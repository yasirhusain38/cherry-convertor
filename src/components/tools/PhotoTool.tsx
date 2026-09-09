"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DropZone } from "@/components/DropZone";
import { EnhanceBar } from "@/components/EnhanceBar";
import { UndoRedoBar } from "@/components/UndoRedoBar";
import { FileStats } from "@/components/FileStats";
import { FormatPicker } from "@/components/FormatPicker";
import { OutputActions } from "@/components/OutputActions";
import { downloadBlob } from "@/lib/download";
import { applyEnhance, cloneEnhance, DEFAULT_ENHANCE, type EnhanceSettings } from "@/lib/enhance";
import { canvasToFormat, copyBlob } from "@/lib/export";
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
import { PhotoEditorShell } from "./PhotoEditorShell";
import { formatBytes } from "@/lib/format";

export function PhotoTool({ tool }: { tool: ToolDef }) {
  const [file, setFile] = useState<File | null>(null);
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [presetId, setPresetId] = useState(tool.photoPreset ?? "in-passport");
  const [presetQuery, setPresetQuery] = useState("");
  const spec = useMemo(() => getPhotoSpec(presetId), [presetId]);
  const presetOptions = useMemo(() => {
    const q = presetQuery.trim().toLowerCase();
    const list = q
      ? PHOTO_SPECS.filter((item) =>
          `${item.label} ${item.country} ${item.document} ${item.id}`.toLowerCase().includes(q),
        )
      : PHOTO_SPECS;
    if (!list.some((item) => item.id === presetId)) {
      const current = PHOTO_SPECS.find((item) => item.id === presetId);
      return current ? [current, ...list] : list;
    }
    return list;
  }, [presetId, presetQuery]);
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
  const [infant, setInfant] = useState(false);

  const pixels = photoPixels(spec);

  useEffect(() => {
    if (!bitmap) return;
    let cancelled = false;
    void adviceFromBitmap(bitmap, spec, infant).then((advice) => {
      if (cancelled) return;
      setFacePct(advice.facePct);
      setFaceNote(
        infant
          ? `${advice.note} Infant mode: smaller face, more space above the head. Confirm the form.`
          : advice.note,
      );
      if (advice.found) {
        setZoom(advice.zoom);
        setOffsetX(advice.offsetX);
        setOffsetY(advice.offsetY);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [bitmap, infant, spec]);

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
              infant,
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
  }, [bg, bitmap, enhance, format, infant, look.match, offsetX, offsetY, pixels.height, pixels.width, spec, targetKb, useTarget, zoom, facePct]);

  const resetFile = useCallback(() => {
    bitmap?.close();
    revokeResult(result);
    setFile(null);
    setBitmap(null);
    setResult(null);
    history.reset({ enhance: cloneEnhance(DEFAULT_ENHANCE), matchAmount: 80 });
  }, [bitmap, history, result]);

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
    <PhotoEditorShell
      hasFile={Boolean(file)}
      actions={{
        undo: history.undo,
        redo: history.redo,
        onFiles: load,
        newFile: resetFile,
        save: () => {
          if (!result) return;
          downloadBlob(result.blob, `${(file?.name ?? "photo").replace(/\.[^.]+$/, "")}-cherry.${format.ext}`);
        },
        copy: () => {
          if (result) void copyBlob(result.blob);
        },
        zoomIn: () => setZoom((z) => Math.min(2.4, z + 0.08)),
        zoomOut: () => setZoom((z) => Math.max(1, z - 0.08)),
        zoomFit: () => {
          setZoom(1);
          setOffsetX(0);
          setOffsetY(0);
        },
        zoom100: () => setZoom(1),
        nudge: (dx, dy) => {
          setOffsetX((x) => Math.max(-1, Math.min(1, x + dx)));
          setOffsetY((y) => Math.max(-1, Math.min(1, y + dy)));
        },
        defaultColors: () => setBg(spec.background),
        swapColors: () => setBg((c) => (c.toLowerCase() === "#ffffff" ? "#000000" : "#ffffff")),
        desaturate: () => setEnhance({ ...enhance, grayscale: !enhance.grayscale }),
      }}
      empty={
        <DropZone
          onFiles={load}
          label="Drop a portrait"
          hint="Face the camera, even lighting, then we crop to the official frame. File stays on this device."
        />
      }
      toolbar={
        <>
          <p className="min-w-0 truncate text-sm">{file?.name} · local</p>
          {result ? (
            <p className="hidden text-xs text-[var(--ink-soft)] md:block">
              {formatBytes(result.bytes)} · {result.width}×{result.height}
            </p>
          ) : null}
          <span className="ml-auto" />
          <UndoRedoBar undo={history.undo} redo={history.redo} canUndo={history.canUndo} canRedo={history.canRedo} />
          <OutputActions result={result} fileName={file?.name ?? "photo"} format={format} busy={busy} compact />
          <button type="button" className="btn btn-ghost" onClick={resetFile}>
            New file
          </button>
        </>
      }
      canvas={
        <div
          className="overflow-hidden border border-[var(--line)] bg-[var(--cream)]"
          style={{
            aspectRatio: `${spec.widthMm} / ${spec.heightMm}`,
            height: "100%",
            maxHeight: "100%",
            width: "auto",
          }}
        >
          {result && result.mime.startsWith("image/") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={result.url} alt="Passport preview" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full min-h-[200px] items-center justify-center text-sm text-[var(--ink-soft)]">
              Preview
            </div>
          )}
        </div>
      }
      panel={
        <>
          <p className="text-sm leading-6 text-[var(--ink-soft)]">{spec.notes}</p>
          {!file ? (
            <DropZone
              capture
              onFiles={load}
              label="Use the phone camera"
              hint="capture=user — still local, never uploaded."
            />
          ) : null}
          <label className="grid gap-2 text-sm">
            Search country / exam
            <input
              className="field"
              value={presetQuery}
              onChange={(event) => setPresetQuery(event.target.value)}
              placeholder="India, NID, DS-160, IBPS…"
              autoComplete="off"
            />
          </label>
          <label className="grid gap-2 text-sm">
            Official size
            <select
              className="field"
              value={presetId}
              onChange={(event) => {
                const id = event.target.value;
                setPresetId(id);
                const next = getPhotoSpec(id);
                setBg(next.background);
                setTargetKb(next.maxKB ?? 50);
              }}
            >
              {presetOptions.map((item) => (
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
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" checked={infant} onChange={(event) => setInfant(event.target.checked)} />
            Infant crop (more head room — confirm the form)
          </label>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={!bitmap}
            onClick={async () => {
              if (!bitmap) return;
              const advice = await adviceFromBitmap(bitmap, spec, infant);
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
          <details className="border-t border-[var(--line)] pt-4">
            <summary className="cursor-pointer text-sm text-[var(--ink-soft)]">Adjust (optional)</summary>
            <div className="mt-4">
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
          </details>
          {file && result ? (
            <>
              <FileStats
                originalBytes={file.size}
                outputBytes={result.bytes}
                width={result.width}
                height={result.height}
              />
              {checks.length ? (
                <ul className="divide-y divide-[var(--line)] rounded-[12px] border border-[var(--line)]">
                  <li className="px-4 py-3 text-sm">
                    <p className="label">Live check</p>
                    <p className={`mt-1 ${checks.every((c) => c.pass) ? "" : "text-brand"}`}>
                      {checks.every((c) => c.pass)
                        ? "All checks passed — still confirm the form."
                        : "Fix the items marked Fail before you upload."}
                    </p>
                  </li>
                  {checks.map((c) => (
                    <li key={c.label} className="flex justify-between gap-4 px-4 py-2 text-sm">
                      <span className={c.pass ? "" : "text-brand"}>
                        {c.pass ? "Pass" : "Fail"} · {c.label}
                      </span>
                      <span className="text-[var(--ink-soft)]">{c.detail}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="text-sm leading-6 text-[var(--ink-soft)]">
                <p className="label">Portals reject for</p>
                <p className="mt-2">
                  File over the KB cap · wrong pixels · blur · glare · cropped ears or chin · photo of a printed photo ·
                  black-and-white when the form wants colour. Confirm the circular.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
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
        </>
      }
    />
  );
}
