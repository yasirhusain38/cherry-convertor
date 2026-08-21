"use client";

import { useEffect, useMemo, useState } from "react";
import { DropZone } from "@/components/DropZone";
import { EnhanceBar } from "@/components/EnhanceBar";
import { FileStats } from "@/components/FileStats";
import { FormatPicker } from "@/components/FormatPicker";
import { OutputActions } from "@/components/OutputActions";
import { downloadBlob } from "@/lib/download";
import { applyEnhance, DEFAULT_ENHANCE, type EnhanceSettings } from "@/lib/enhance";
import { canvasToFormat } from "@/lib/export";
import { getFormat, type ConvertFormat } from "@/lib/formats";
import {
  compressToTargetBytes,
  drawCover,
  drawExact,
  fileToBitmap,
  revokeResult,
  type ProcessResult,
} from "@/lib/image";
import { blobToDataUrl, makePhotoSheet } from "@/lib/pdf";
import { PHOTO_SPECS, getPhotoSpec, photoPixels } from "@/data/photo-specs";
import type { ToolDef } from "@/lib/tools";

export function PhotoTool({ tool }: { tool: ToolDef }) {
  const [file, setFile] = useState<File | null>(null);
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [presetId, setPresetId] = useState(tool.photoPreset ?? "in-passport");
  const spec = useMemo(() => getPhotoSpec(presetId), [presetId]);
  const [bg, setBg] = useState(spec.background);
  const [targetKb, setTargetKb] = useState(spec.maxKB ?? 50);
  const [useTarget, setUseTarget] = useState(true);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [format, setFormat] = useState<ConvertFormat>(getFormat("jpeg")!);
  const [enhance, setEnhance] = useState<EnhanceSettings>(DEFAULT_ENHANCE);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

  const pixels = photoPixels(spec);

  useEffect(() => {
    setBg(spec.background);
    setTargetKb(spec.maxKB ?? 50);
  }, [spec]);

  async function load(files: File[]) {
    const next = files[0];
    if (!next) return;
    bitmap?.close();
    revokeResult(result);
    setBusy(true);
    setError(null);
    try {
      const bmp = await fileToBitmap(next);
      setFile(next);
      setBitmap(bmp);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that image.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!bitmap) return;
    let cancelled = false;
    const handle = window.setTimeout(async () => {
      setBusy(true);
      try {
        const staged = applyEnhance(bitmap, bitmap.width, bitmap.height, enhance);
        const canvas = drawCover(
          staged,
          staged.width,
          staged.height,
          pixels.width,
          pixels.height,
          bg,
          zoom,
          offsetX,
          offsetY,
        );
        let next: ProcessResult;
        if (useTarget) {
          const source = await createImageBitmap(canvas);
          const targeted = await compressToTargetBytes({
            source,
            targetBytes: targetKb * 1024,
            mime: format.id === "webp" ? "image/webp" : "image/jpeg",
            fill: bg,
          });
          source.close();
          const img = await createImageBitmap(targeted.blob);
          const out = drawExact(img, img.width, img.height);
          img.close();
          URL.revokeObjectURL(targeted.url);
          next = await canvasToFormat(out, format, 0.92);
        } else {
          next = await canvasToFormat(canvas, format, 0.92);
        }
        if (cancelled) {
          revokeResult(next);
          return;
        }
        setResult((prev) => {
          revokeResult(prev);
          return next;
        });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not build the photo.");
      } finally {
        if (!cancelled) setBusy(false);
      }
    }, 120);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [bg, bitmap, enhance, format, offsetX, offsetY, pixels.height, pixels.width, targetKb, useTarget, zoom]);

  async function downloadSheet(pageSize: "a4" | "4x6") {
    if (!result) return;
    const dataUrl = await blobToDataUrl(result.blob);
    const sheet = await makePhotoSheet({
      photoDataUrl: dataUrl,
      photoWmm: spec.widthMm,
      photoHmm: spec.heightMm,
      copies: pageSize === "4x6" ? 6 : 8,
      pageSize,
    });
    downloadBlob(sheet, `passport-sheet-${pageSize}.pdf`);
  }

  return (
    <div className="grid gap-6">
      {!file ? (
        <DropZone
          onFiles={load}
          label="Drop a portrait"
          hint="Face the camera, even lighting, then we crop to the official frame."
        />
      ) : (
        <div className="flex justify-end">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              bitmap?.close();
              revokeResult(result);
              setFile(null);
              setBitmap(null);
              setResult(null);
            }}
          >
            New file
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="card overflow-hidden p-6">
          <div
            className="mx-auto overflow-hidden border border-[var(--line)] bg-[var(--cream)]"
            style={{
              aspectRatio: `${spec.widthMm} / ${spec.heightMm}`,
              maxWidth: 360,
            }}
          >
            {result && result.mime.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={result.url} alt="Passport preview" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full min-h-[280px] items-center justify-center text-sm text-[var(--ink-soft)]">
                Preview
              </div>
            )}
          </div>
          <p className="mt-4 text-center text-sm text-[var(--ink-soft)]">{spec.notes}</p>
        </div>

        <div className="grid gap-4">
          <label className="grid gap-2 text-sm">
            Official size
            <select className="field" value={presetId} onChange={(event) => setPresetId(event.target.value)}>
              {PHOTO_SPECS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <dl className="grid grid-cols-2 gap-2 text-sm text-[var(--ink-soft)]">
            <div>
              <dt className="label">Size</dt>
              <dd>
                {spec.widthMm} × {spec.heightMm} mm
              </dd>
            </div>
            <div>
              <dt className="label">Pixels</dt>
              <dd>
                {pixels.width} × {pixels.height}
              </dd>
            </div>
            <div>
              <dt className="label">Background</dt>
              <dd>{spec.backgroundLabel}</dd>
            </div>
            <div>
              <dt className="label">File cap</dt>
              <dd>{spec.maxKB ? `${spec.minKB ? `${spec.minKB}–` : ""}${spec.maxKB} KB` : "Open"}</dd>
            </div>
          </dl>
          <label className="grid gap-2 text-sm">
            Background
            <input className="field h-12" type="color" value={bg} onChange={(event) => setBg(event.target.value)} />
          </label>
          <label className="grid gap-2 text-sm">
            Face zoom {zoom.toFixed(2)}×
            <input
              type="range"
              min={1}
              max={2.4}
              step={0.02}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
            />
          </label>
          <label className="grid gap-2 text-sm">
            Move left / right
            <input
              type="range"
              min={-1}
              max={1}
              step={0.02}
              value={offsetX}
              onChange={(event) => setOffsetX(Number(event.target.value))}
            />
          </label>
          <label className="grid gap-2 text-sm">
            Move up / down
            <input
              type="range"
              min={-1}
              max={1}
              step={0.02}
              value={offsetY}
              onChange={(event) => setOffsetY(Number(event.target.value))}
            />
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={useTarget}
              onChange={(event) => setUseTarget(event.target.checked)}
            />
            Also cap file size
          </label>
          {useTarget ? (
            <label className="grid gap-2 text-sm">
              Max KB · {targetKb}
              <input
                type="range"
                min={spec.minKB ?? 10}
                max={Math.max(spec.maxKB ?? 200, 500)}
                value={targetKb}
                onChange={(event) => setTargetKb(Number(event.target.value))}
              />
            </label>
          ) : null}
          <FormatPicker value={format.id} onChange={setFormat} />
          <EnhanceBar value={enhance} onChange={setEnhance} />
        </div>
      </div>

      {file && result ? (
        <>
          <FileStats
            originalBytes={file.size}
            outputBytes={result.bytes}
            width={result.width}
            height={result.height}
          />
          <OutputActions result={result} fileName={file.name} format={format} busy={busy} />
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn btn-ghost" onClick={() => downloadSheet("4x6")}>
              4×6 sheet
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => downloadSheet("a4")}>
              A4 sheet
            </button>
          </div>
        </>
      ) : null}
      {error ? <p className="text-sm text-brand">{error}</p> : null}
    </div>
  );
}
