"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import JSZip from "jszip";
import { CompareSlider } from "@/components/CompareSlider";
import { DropZone } from "@/components/DropZone";
import { FileStats } from "@/components/FileStats";
import { FormatPicker } from "@/components/FormatPicker";
import { OutputActions } from "@/components/OutputActions";
import { UndoRedoBar } from "@/components/UndoRedoBar";
import { downloadBlob } from "@/lib/download";
import {
  pickKnownStamp,
  reconstructUnderStamp,
  stampMask,
  type KnownStamp,
} from "@/lib/ai-watermarks";
import {
  buildWatermarkMask,
  orMask,
  selectOverlayAt,
  type MarkPreset,
} from "@/lib/detect-mark";
import { canvasToFormat } from "@/lib/export";
import { getFormat, type ConvertFormat } from "@/lib/formats";
import { emptyMask, healCanvas, healImageData, maskHasPaint, overlayMask, paintBrush, tightenToOverlay } from "@/lib/heal";
import { drawExact, fileToBitmap, revokeResult, type ProcessResult } from "@/lib/image";
import type { ToolDef } from "@/lib/tools";
import { useEditHistory } from "./useEditHistory";

const PRESETS: Array<{ id: MarkPreset; label: string; hint: string }> = [
  { id: "auto", label: "Auto detect", hint: "Tight corner badges only" },
  { id: "gemini", label: "Gemini / Nano Banana", hint: "Small bottom-right sparkle" },
  { id: "grok", label: "Grok / xAI", hint: "Small corner stamp" },
  { id: "imagen", label: "Imagen", hint: "Visible Google overlay" },
  { id: "tiktok", label: "TikTok-style", hint: "Username + logo" },
  { id: "banner", label: "Bottom bar", hint: "Thin lower caption" },
  { id: "subtitle", label: "Captions", hint: "Lower-third text" },
  { id: "corners", label: "Four corners", hint: "Tiny corner chips only" },
];

function copyPixels(canvas: HTMLCanvasElement): ImageData {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser.");
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

export function WatermarkStudio({ tool }: { tool: ToolDef }) {
  const [files, setFiles] = useState<File[]>([]);
  const [index, setIndex] = useState(0);
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [preset, setPreset] = useState<MarkPreset>(
    tool.slug.includes("grok") ? "grok" : tool.slug.includes("gemini") ? "gemini" : "auto",
  );
  const [format, setFormat] = useState<ConvertFormat>(getFormat("png")!);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("Drop a Gemini or Grok image. The bottom-right stamp is located, reversed, and healed on this device.");
  const [coverage, setCoverage] = useState<string | null>(null);
  const workRef = useRef<HTMLCanvasElement | null>(null);
  const viewRef = useRef<HTMLCanvasElement>(null);
  const maskRef = useRef<Uint8Array | null>(null);
  const stampRef = useRef<KnownStamp | null>(null);
  const drawing = useRef(false);
  const [brush, setBrush] = useState(12);
  const [paint, setPaint] = useState(false);
  const file = files[index] ?? null;

  const history = useEditHistory<ImageData | null>(null, (value) =>
    value ? new ImageData(new Uint8ClampedArray(value.data), value.width, value.height) : null,
  );

  const redraw = useCallback(() => {
    const view = viewRef.current;
    const work = workRef.current;
    const mask = maskRef.current;
    if (!view || !work || !mask) return;
    const vctx = view.getContext("2d");
    if (!vctx) return;
    const scale = Math.min(1, 960 / Math.max(work.width, work.height));
    view.width = Math.max(1, Math.round(work.width * scale));
    view.height = Math.max(1, Math.round(work.height * scale));
    vctx.drawImage(work, 0, 0, view.width, view.height);
    const overlay = document.createElement("canvas");
    overlay.width = work.width;
    overlay.height = work.height;
    const octx = overlay.getContext("2d");
    if (!octx) return;
    overlayMask(octx, mask, work.width, work.height, "rgba(242,1,63,0.55)");
    vctx.drawImage(overlay, 0, 0, view.width, view.height);
    const stamp = stampRef.current;
    if (stamp) {
      const s = view.width / work.width;
      vctx.strokeStyle = "#F2013F";
      vctx.lineWidth = 2;
      vctx.strokeRect(stamp.x * s, stamp.y * s, stamp.w * s, stamp.h * s);
    }
  }, []);

  function applyDetect(work: HTMLCanvasElement, kind: MarkPreset) {
    const ctx = work.getContext("2d");
    if (!ctx) return;
    const image = ctx.getImageData(0, 0, work.width, work.height);
    if (kind === "tiktok" || kind === "banner" || kind === "subtitle" || kind === "corners") {
      stampRef.current = null;
      const built = buildWatermarkMask(image, kind);
      maskRef.current = built.mask;
      setCoverage(null);
      setStatus(
        built.count
          ? `Marked ${built.count} overlay pixels. Remove + AI heal next.`
          : "Nothing found. Click the stamp.",
      );
      redraw();
      return;
    }
    const stamp = pickKnownStamp(work.width, work.height, image, kind);
    stampRef.current = stamp;
    maskRef.current = stampMask(work.width, work.height, stamp);
    setCoverage(
      `${stamp.label} · ${stamp.sizeLabel} · ${stamp.marginRight}px from right · ${stamp.marginBottom}px from bottom · ${stamp.coveragePct.toFixed(2)}% of the image`,
    );
    setStatus(
      `Inventory: ${stamp.label} · type=AI badge · location=bottom-right · ${stamp.sizeLabel} · ${stamp.marginRight}px from right, ${stamp.marginBottom}px from bottom · ${stamp.coveragePct.toFixed(2)}% of the frame. Semi-transparent overlay. Only that chip will be reversed and healed.`,
    );
    redraw();
  }

  async function loadOne(next: File) {
    bitmap?.close();
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    revokeResult(result);
    const bmp = await fileToBitmap(next);
    const work = drawExact(bmp, bmp.width, bmp.height);
    workRef.current = work;
    maskRef.current = emptyMask(work.width, work.height);
    setBitmap(bmp);
    setSourceUrl(URL.createObjectURL(next));
    history.reset(copyPixels(work));
    applyDetect(work, preset);
  }

  async function onFiles(next: File[]) {
    if (!next.length) return;
    setError(null);
    setFiles(next);
    setIndex(0);
    try {
      await loadOne(next[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that image.");
    }
  }

  useEffect(() => {
    if (workRef.current) applyDetect(workRef.current, preset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset]);

  useEffect(() => {
    redraw();
  }, [bitmap, redraw]);

  async function encode() {
    const work = workRef.current;
    if (!work) return;
    setBusy(true);
    try {
      const next = await canvasToFormat(work, format, 0.94);
      setResult((prev) => {
        revokeResult(prev);
        return next;
      });
    } finally {
      setBusy(false);
    }
  }

  async function removeMarks() {
    const work = workRef.current;
    const mask = maskRef.current;
    const ctx = work?.getContext("2d");
    if (!work || !mask || !ctx || !maskHasPaint(mask)) {
      setError("Select Gemini, Grok, or Auto so the bottom-right chip is marked.");
      return;
    }
    setError(null);
    setBusy(true);
    const before = copyPixels(work);
    try {
      const image = ctx.getImageData(0, 0, work.width, work.height);
      const stamp = stampRef.current;
      if (stamp) reconstructUnderStamp(image, stamp);
      else healImageData(image, mask, 6, "overlay");
      ctx.putImageData(image, 0, 0);
      maskRef.current = emptyMask(work.width, work.height);
      history.record(before, copyPixels(work));
      setStatus(
        stamp
          ? `Removed ${stamp.label} (${stamp.sizeLabel}). Chip reversed and healed on this device. Rest of the frame untouched.`
          : "Overlay peeled and healed on this device.",
      );
      redraw();
      await encode();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Remove failed.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const snap = history.present;
    const work = workRef.current;
    if (!snap || !work) return;
    work.getContext("2d")?.putImageData(snap, 0, 0);
    redraw();
    void encode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history.present]);

  function pointerOnImage(event: React.PointerEvent<HTMLCanvasElement>) {
    const work = workRef.current;
    const view = viewRef.current;
    if (!work || !view) return null;
    const rect = view.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * work.width,
      y: ((event.clientY - rect.top) / rect.height) * work.height,
    };
  }

  function onPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    const work = workRef.current;
    const mask = maskRef.current;
    const pt = pointerOnImage(event);
    if (!work || !mask || !pt) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const ctx = work.getContext("2d");
    if (!ctx) return;
    if (paint) {
      drawing.current = true;
      paintBrush(mask, work.width, work.height, pt.x, pt.y, brush);
      redraw();
      return;
    }
    const image = ctx.getImageData(0, 0, work.width, work.height);
    orMask(mask, selectOverlayAt(image, pt.x, pt.y));
    maskRef.current = tightenToOverlay(image, mask, 12);
    setStatus("Marked overlay at your click. If red still covers photo text, Clear red and click only the logo.");
    redraw();
  }

  function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || !paint) return;
    const work = workRef.current;
    const mask = maskRef.current;
    const pt = pointerOnImage(event);
    if (!work || !mask || !pt) return;
    paintBrush(mask, work.width, work.height, pt.x, pt.y, brush);
    redraw();
  }

  async function runBatch() {
    if (files.length < 2) return;
    setBusy(true);
    try {
      const zip = new JSZip();
      for (let i = 0; i < files.length; i += 1) {
        setStatus(`Batch ${i + 1} / ${files.length}`);
        const bmp = await fileToBitmap(files[i]);
        const canvas = drawExact(bmp, bmp.width, bmp.height);
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
          if (preset === "tiktok" || preset === "banner" || preset === "subtitle" || preset === "corners") {
            const built = buildWatermarkMask(image, preset);
            if (built.count) healCanvas(canvas, built.mask, 8, "overlay");
          } else {
            const stamp = pickKnownStamp(canvas.width, canvas.height, image, preset);
            reconstructUnderStamp(image, stamp);
            ctx.putImageData(image, 0, 0);
          }
        }
        const out = await canvasToFormat(canvas, format, 0.94);
        zip.file(`${files[i].name.replace(/\.[^.]+$/, "")}-clean.${format.ext}`, out.blob);
        URL.revokeObjectURL(out.url);
        bmp.close();
      }
      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlob(blob, "watermark-clean.zip");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Batch failed.");
    } finally {
      setBusy(false);
      setStatus("Batch ZIP downloaded.");
    }
  }

  return (
    <div className="grid gap-6">
      {!file ? (
        <DropZone
          multiple
          onFiles={onFiles}
          label="Drop a photo with a visible stamp"
          hint="Click the watermark — only those pixels are healed"
        />
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[var(--ink-soft)]">
            {file.name}
            {files.length > 1 ? ` · ${index + 1}/${files.length}` : ""} · local only
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <UndoRedoBar
              undo={history.undo}
              redo={history.redo}
              canUndo={history.canUndo}
              canRedo={history.canRedo}
            />
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                bitmap?.close();
                if (sourceUrl) URL.revokeObjectURL(sourceUrl);
                revokeResult(result);
                setFiles([]);
                setBitmap(null);
                setSourceUrl(null);
                setResult(null);
              }}
            >
              New file
            </button>
          </div>
        </div>
      )}

      {sourceUrl && result ? <CompareSlider beforeUrl={sourceUrl} afterUrl={result.url} /> : null}

      {file ? (
        <canvas
          ref={viewRef}
          className="mx-auto h-auto max-h-[480px] w-auto max-w-full touch-none cursor-crosshair rounded-[16px] border border-[var(--line)] bg-[#221F1F]"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={() => {
            drawing.current = false;
          }}
        />
      ) : null}

      <div className="card grid gap-5 p-6">
        <p className="text-sm leading-6 text-[var(--ink-soft)]">{status}</p>
        {coverage ? (
          <p className="rounded-[12px] border border-[var(--line)] px-4 py-3 text-sm leading-6">
            <span className="label">Known stamp area</span>
            <span className="mt-2 block">{coverage}</span>
          </p>
        ) : null}
        <p className="label">Detect or click the mark</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((item) => (
            <button
              key={item.id}
              type="button"
              title={item.hint}
              className={`btn min-h-10 px-3 ${preset === item.id ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setPreset(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`btn min-h-10 px-3 ${!paint ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setPaint(false)}
          >
            Click stamp
          </button>
          <button
            type="button"
            className={`btn min-h-10 px-3 ${paint ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setPaint(true)}
          >
            Fine brush
          </button>
          <button
            type="button"
            className="btn btn-ghost min-h-10 px-3"
            onClick={() => {
              const work = workRef.current;
              if (!work) return;
              maskRef.current = emptyMask(work.width, work.height);
              setStatus("Mask cleared. Click the watermark.");
              redraw();
            }}
          >
            Clear red
          </button>
        </div>
        {paint ? (
          <label className="grid gap-2 text-sm">
            Brush · {brush}px — keep it smaller than the stamp
            <input type="range" min={4} max={48} value={brush} onChange={(e) => setBrush(Number(e.target.value))} />
          </label>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" disabled={!file || busy} onClick={() => void removeMarks()}>
            {busy ? "Healing stamp…" : "Remove watermark"}
          </button>
          {files.length > 1 ? (
            <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => void runBatch()}>
              Batch all {files.length}
            </button>
          ) : null}
        </div>
        <p className="text-sm leading-6 text-[var(--ink-soft)]">
          Gemini sparkle: 48×48 px (32px inset) or 96×96 px (64px inset) bottom-right. Grok logo: small mark, same
          corner. Reversed and healed on this device — no account, no key. Rest of the photo is untouched.
        </p>
        <FormatPicker value={format.id} onChange={setFormat} />
      </div>

      {file && result ? (
        <>
          <FileStats originalBytes={file.size} outputBytes={result.bytes} width={result.width} height={result.height} />
          <OutputActions result={result} fileName={file.name} format={format} busy={busy} />
        </>
      ) : null}
      {error ? <p className="text-sm text-brand">{error}</p> : null}
    </div>
  );
}
