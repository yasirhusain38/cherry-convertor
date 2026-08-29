"use client";

import { useEffect, useMemo, useState } from "react";
import { DropZone } from "@/components/DropZone";
import { EnhanceBar } from "@/components/EnhanceBar";
import { UndoRedoBar } from "@/components/UndoRedoBar";
import { FileStats } from "@/components/FileStats";
import { FormatPicker } from "@/components/FormatPicker";
import { OutputActions } from "@/components/OutputActions";
import { downloadBlob } from "@/lib/download";
import { applyEnhance, cloneEnhance, DEFAULT_ENHANCE, type EnhanceSettings } from "@/lib/enhance";
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
import { adviceFromBitmap, checkCompliance, sampleCorners } from "@/lib/face-crop";
import { useEditHistory } from "./useEditHistory";
import { useLookMatch } from "./useLookMatch";

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
  const look = useLookMatch(bitmap);
  const history = useEditHistory(
    { enhance: cloneEnhance(DEFAULT_ENHANCE), matchAmount: 80 },
    (snap) => ({ enhance: cloneEnhance(snap.enhance), matchAmount: snap.matchAmount }),
    { onRestore: (snap) => look.setAmount(snap.matchAmount) },
  );
  const enhance = history.present.enhance;
  const setEnhance = (next: EnhanceSettings) => history.set({ enhance: next, matchAmount: look.amount });
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [facePct, setFacePct] = useState<number | null>(null);
  const [checks, setChecks] = useState<Array<{ label: string; pass: boolean; detail: string }>>([]);
  const [faceNote, setFaceNote] = useState<string | null>(null);

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
      const advice = await adviceFromBitmap(bmp, spec);
      setFacePct(advice.facePct);
      setFaceNote(advice.note);
      if (advice.found) {
        setZoom(advice.zoom);
        setOffsetX(advice.offsetX);
        setOffsetY(advice.offsetY);
      }
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
        const staged = applyEnhance(bitmap, bitmap.width, bitmap.height, enhance, look.match);
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
        const preview = document.createElement("canvas");
        preview.width = next.width;
        preview.height = next.height;
        const pctx = preview.getContext("2d");
        if (pctx) {
          const img = await createImageBitmap(next.blob);
          pctx.drawImage(img, 0, 0);
          img.close();
          setChecks(
            checkCompliance({
              spec,
              width: next.width,
              height: next.height,
              bytes: next.bytes,
              mime: next.mime,
              facePct: facePct != null ? Math.round(facePct * zoom) : null,
              cornerRgb: sampleCorners(preview),
            }),
          );
        }
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
  }, [bg, bitmap, enhance, format, look.match, offsetX, offsetY, pixels.height, pixels.width, targetKb, useTarget, zoom]);

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
        <div className="grid gap-3">
          <DropZone
            onFiles={load}
            label="Drop a portrait"
            hint="Face the camera, even lighting, then we crop to the official frame. File stays on this device."
          />
          <DropZone
            capture
            onFiles={load}
            label="Or use the phone camera"
            hint="capture=user — still local, never uploaded."
          />
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <UndoRedoBar undo={history.undo} redo={history.redo} canUndo={history.canUndo} canRedo={history.canRedo} />
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              bitmap?.close();
              revokeResult(result);
              setFile(null);
              setBitmap(null);
              setResult(null);
              history.reset({ enhance: cloneEnhance(DEFAULT_ENHANCE), matchAmount: 80 });
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
          {faceNote ? <p className="text-sm text-[var(--ink-soft)]">{faceNote}</p> : null}
          <button
            type="button"
            className="btn btn-ghost"
            disabled={!bitmap}
            onClick={async () => {
              if (!bitmap) return;
              const advice = await adviceFromBitmap(bitmap, spec);
              setFacePct(advice.facePct);
              setFaceNote(advice.note);
              if (advice.found) {
                setZoom(advice.zoom);
                setOffsetX(advice.offsetX);
                setOffsetY(advice.offsetY);
              }
            }}
          >
            Auto face crop
          </button>
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
          <EnhanceBar
            value={enhance}
            onChange={setEnhance}
            matchAmount={look.amount}
            hasReference={look.hasReference}
            onMatchAmount={(n) => {
              look.setAmount(n);
              history.set({ enhance, matchAmount: n });
            }}
            onReference={look.loadReference}
          />
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
          {checks.length ? (
            <ul className="card divide-y divide-[var(--line)]">
              {checks.map((c) => (
                <li key={c.label} className="flex justify-between gap-4 px-5 py-3 text-sm">
                  <span>
                    {c.pass ? "Pass" : "Check"} · {c.label}
                  </span>
                  <span className="text-[var(--ink-soft)]">{c.detail}</span>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn btn-ghost" onClick={() => downloadSheet("4x6")}>
              4×6 / 4-up sheet
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => downloadSheet("a4")}>
              A4 / 8-up sheet
            </button>
          </div>
        </>
      ) : null}
      {error ? <p className="text-sm text-brand">{error}</p> : null}
    </div>
  );
}
