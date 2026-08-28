"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CompareSlider } from "@/components/CompareSlider";
import { DropZone } from "@/components/DropZone";
import { EnhanceBar } from "@/components/EnhanceBar";
import { FileStats } from "@/components/FileStats";
import { FormatPicker } from "@/components/FormatPicker";
import { HistogramView } from "@/components/GradeControls";
import { OutputActions } from "@/components/OutputActions";
import { UndoRedoBar } from "@/components/UndoRedoBar";
import { cutOut, replaceBackground, samplePixel, type CutoutMode } from "@/lib/cutout";
import { applyEnhance, cloneEnhance, enhanceForSlug, type EnhanceSettings } from "@/lib/enhance";
import { canvasToFormat } from "@/lib/export";
import { getFormat, type ConvertFormat } from "@/lib/formats";
import { applyAutoToCanvas, computeHistogram, type Histogram } from "@/lib/grade";
import {
  emptyMask,
  growMask,
  healCanvas,
  maskHasPaint,
  overlayMask,
  paintBrush,
  paintRect,
  wandSelect,
} from "@/lib/heal";
import { fileToBitmap, revokeResult, type ProcessResult } from "@/lib/image";
import type { ToolDef } from "@/lib/tools";
import { useEditHistory, type HistoryMode } from "./useEditHistory";
import { useLookMatch } from "./useLookMatch";

type EditSnap = {
  enhance: EnhanceSettings;
  cutOn: boolean;
  cutMode: CutoutMode;
  tolerance: number;
  feather: number;
  seed: { x: number; y: number } | null;
  chroma: [number, number, number];
  fillMode: "alpha" | "color" | "image";
  fillColor: string;
  matchAmount: number;
  pixels: ImageData | null;
};

function cloneSnap(snap: EditSnap): EditSnap {
  return {
    enhance: cloneEnhance(snap.enhance),
    cutOn: snap.cutOn,
    cutMode: snap.cutMode,
    tolerance: snap.tolerance,
    feather: snap.feather,
    seed: snap.seed ? { ...snap.seed } : null,
    chroma: [snap.chroma[0], snap.chroma[1], snap.chroma[2]],
    fillMode: snap.fillMode,
    fillColor: snap.fillColor,
    matchAmount: snap.matchAmount,
    pixels: snap.pixels
      ? new ImageData(new Uint8ClampedArray(snap.pixels.data), snap.pixels.width, snap.pixels.height)
      : null,
  };
}

function copyCanvasPixels(canvas: HTMLCanvasElement | null): ImageData | null {
  if (!canvas) return null;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

type Panel = "adjust" | "cutout" | "heal";

function panelFor(slug: string): Panel {
  if (slug.includes("object") || (slug.includes("watermark") && !slug.includes("add"))) return "heal";
  if (slug.includes("background") || slug.includes("chroma") || slug.includes("replace")) return "cutout";
  return "adjust";
}

function pointerToImage(
  event: { clientX: number; clientY: number },
  el: HTMLElement,
  imgW: number,
  imgH: number,
) {
  const rect = el.getBoundingClientRect();
  const scale = Math.min(rect.width / imgW, rect.height / imgH);
  const dw = imgW * scale;
  const dh = imgH * scale;
  const ox = (rect.width - dw) / 2;
  const oy = (rect.height - dh) / 2;
  return {
    x: (event.clientX - rect.left - ox) / scale,
    y: (event.clientY - rect.top - oy) / scale,
  };
}

export function ImageStudio({ tool }: { tool: ToolDef }) {
  const [file, setFile] = useState<File | null>(null);
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [enhance, setEnhance] = useState<EnhanceSettings>(() => cloneEnhance(enhanceForSlug(tool.slug)));
  const [panel, setPanel] = useState<Panel>(() => panelFor(tool.slug));
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [format, setFormat] = useState<ConvertFormat>(
    getFormat(tool.slug.includes("background") || tool.slug.includes("chroma") ? "png" : "jpeg")!,
  );
  const [hist, setHist] = useState<Histogram | null>(null);
  const look = useLookMatch(bitmap);

  const [cutMode, setCutMode] = useState<CutoutMode>(tool.slug.includes("chroma") ? "chroma" : "corners");
  const [cutOn, setCutOn] = useState(
    tool.slug.includes("background") || tool.slug.includes("chroma") || tool.slug.includes("replace"),
  );
  const [tolerance, setTolerance] = useState(42);
  const [feather, setFeather] = useState(10);
  const [seed, setSeed] = useState<{ x: number; y: number } | null>(null);
  const [chroma, setChroma] = useState<readonly [number, number, number]>([0, 177, 64]);
  const [fillMode, setFillMode] = useState<"alpha" | "color" | "image">(
    tool.slug.includes("replace") ? "color" : "alpha",
  );
  const [fillColor, setFillColor] = useState("#ffffff");
  const [fillBmp, setFillBmp] = useState<ImageBitmap | null>(null);

  const workRef = useRef<HTMLCanvasElement | null>(null);
  const viewRef = useRef<HTMLCanvasElement>(null);
  const maskRef = useRef<Uint8Array | null>(null);
  const undoRef = useRef<ImageData[]>([]);
  const [brush, setBrush] = useState(28);
  const [healMode, setHealMode] = useState<"brush" | "rect" | "wand">("brush");
  const [wandTol, setWandTol] = useState(36);
  const drawing = useRef(false);
  const rectStart = useRef<{ x: number; y: number } | null>(null);
  const stagedRef = useRef<HTMLCanvasElement | null>(null);

  const initialSnap = useMemo<EditSnap>(
    () => ({
      enhance: cloneEnhance(enhanceForSlug(tool.slug)),
      cutOn: tool.slug.includes("background") || tool.slug.includes("chroma") || tool.slug.includes("replace"),
      cutMode: tool.slug.includes("chroma") ? "chroma" : "corners",
      tolerance: 42,
      feather: 10,
      seed: null,
      chroma: [0, 177, 64],
      fillMode: tool.slug.includes("replace") ? "color" : "alpha",
      fillColor: "#ffffff",
      matchAmount: 80,
      pixels: null,
    }),
    [tool.slug],
  );

  const resetSource = useCallback(() => {
    bitmap?.close();
    fillBmp?.close();
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    revokeResult(result);
    setFile(null);
    setBitmap(null);
    setSourceUrl(null);
    setResult(null);
    setError(null);
    workRef.current = null;
    maskRef.current = null;
  }, [bitmap, fillBmp, result, sourceUrl]);

  async function load(files: File[]) {
    const next = files[0];
    if (!next) return;
    bitmap?.close();
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    revokeResult(result);
    setError(null);
    try {
      const bmp = await fileToBitmap(next);
      const work = document.createElement("canvas");
      work.width = bmp.width;
      work.height = bmp.height;
      work.getContext("2d")?.drawImage(bmp, 0, 0);
      workRef.current = work;
      maskRef.current = emptyMask(work.width, work.height);
      undoRef.current = [];
      setFile(next);
      setBitmap(bmp);
      setSourceUrl(URL.createObjectURL(next));
      history.reset(initialSnap);
      applySnap(initialSnap);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that image.");
    }
  }

  const redrawHeal = useCallback(() => {
    const view = viewRef.current;
    const work = workRef.current;
    const mask = maskRef.current;
    if (!view || !work || !mask) return;
    const vctx = view.getContext("2d");
    if (!vctx) return;
    const scale = Math.min(1, 960 / Math.max(work.width, work.height));
    view.width = Math.max(1, Math.round(work.width * scale));
    view.height = Math.max(1, Math.round(work.height * scale));
    vctx.imageSmoothingEnabled = true;
    vctx.drawImage(work, 0, 0, view.width, view.height);
    const overlay = document.createElement("canvas");
    overlay.width = work.width;
    overlay.height = work.height;
    const octx = overlay.getContext("2d");
    if (!octx) return;
    overlayMask(octx, mask, work.width, work.height);
    vctx.drawImage(overlay, 0, 0, view.width, view.height);
  }, []);

  const takeSnap = useCallback(
    (pixels: boolean): EditSnap => ({
      enhance: cloneEnhance(enhance),
      cutOn,
      cutMode,
      tolerance,
      feather,
      seed: seed ? { ...seed } : null,
      chroma: [chroma[0], chroma[1], chroma[2]],
      fillMode,
      fillColor,
      matchAmount: look.amount,
      pixels: pixels ? copyCanvasPixels(workRef.current) : null,
    }),
    [chroma, cutMode, cutOn, enhance, feather, fillColor, fillMode, look.amount, seed, tolerance],
  );

  const applySnap = useCallback(
    (snap: EditSnap) => {
      setEnhance(cloneEnhance(snap.enhance));
      setCutOn(snap.cutOn);
      setCutMode(snap.cutMode);
      setTolerance(snap.tolerance);
      setFeather(snap.feather);
      setSeed(snap.seed);
      setChroma(snap.chroma);
      setFillMode(snap.fillMode);
      setFillColor(snap.fillColor);
      look.setAmount(snap.matchAmount);
      const work = workRef.current;
      if (snap.pixels && work) {
        work.getContext("2d")?.putImageData(snap.pixels, 0, 0);
        redrawHeal();
      }
    },
    [look, redrawHeal],
  );

  const history = useEditHistory(initialSnap, cloneSnap, { onRestore: applySnap });

  function patchEdit(partial: Partial<EditSnap>, mode: HistoryMode = "gesture") {
    const next = { ...takeSnap(false), ...partial, pixels: null };
    history.set(next, mode);
    applySnap(next);
  }

  useEffect(() => {
    if (panel === "heal") redrawHeal();
  }, [panel, bitmap, redrawHeal]);

  useEffect(() => {
    const work = workRef.current;
    if (!work || !file) return;
    let cancelled = false;
    const handle = window.setTimeout(async () => {
      setBusy(true);
      try {
        const canvas = applyEnhance(work, work.width, work.height, enhance, look.match);
        stagedRef.current = canvas;
        if (cutOn) {
          const keyed = cutOut(canvas, canvas.width, canvas.height, {
            mode: cutMode,
            tolerance,
            feather,
            seedX: seed?.x,
            seedY: seed?.y,
            chroma,
          });
          const composed =
            fillMode === "alpha"
              ? keyed
              : replaceBackground(keyed, fillMode === "image" && fillBmp ? fillBmp : fillColor);
          const ctx = composed.getContext("2d");
          if (ctx) setHist(computeHistogram(ctx.getImageData(0, 0, composed.width, composed.height)));
          const next = await canvasToFormat(composed, format, 0.92);
          if (cancelled) {
            revokeResult(next);
            return;
          }
          setResult((prev) => {
            revokeResult(prev);
            return next;
          });
        } else {
          const ctx = canvas.getContext("2d");
          if (ctx) setHist(computeHistogram(ctx.getImageData(0, 0, canvas.width, canvas.height)));
          const next = await canvasToFormat(canvas, format, 0.92);
          if (cancelled) {
            revokeResult(next);
            return;
          }
          setResult((prev) => {
            revokeResult(prev);
            return next;
          });
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Processing failed.");
      } finally {
        if (!cancelled) setBusy(false);
      }
    }, 120);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [
    chroma,
    cutMode,
    cutOn,
    enhance,
    feather,
    file,
    fillBmp,
    fillColor,
    fillMode,
    format,
    look.match,
    seed,
    tolerance,
  ]);

  async function bakeAuto(kind: "wb" | "contrast") {
    const work = workRef.current;
    if (!work) return;
    const before = takeSnap(true);
    const canvas = applyEnhance(work, work.width, work.height, enhance, look.match);
    applyAutoToCanvas(canvas, kind);
    const ctx = work.getContext("2d");
    ctx?.drawImage(canvas, 0, 0, work.width, work.height);
    const bmp = await createImageBitmap(work);
    bitmap?.close();
    setBitmap(bmp);
    const afterEnhance = cloneEnhance(enhanceForSlug(tool.slug));
    setEnhance(afterEnhance);
    history.record(before, {
      ...takeSnap(true),
      enhance: afterEnhance,
      pixels: copyCanvasPixels(work),
    });
  }

  function imagePoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const work = workRef.current;
    const view = viewRef.current;
    if (!work || !view) return null;
    return pointerToImage(event, view, work.width, work.height);
  }

  function onHealDown(event: React.PointerEvent<HTMLCanvasElement>) {
    const work = workRef.current;
    const mask = maskRef.current;
    const pt = imagePoint(event);
    if (!work || !mask || !pt) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawing.current = true;
    if (healMode === "rect") {
      rectStart.current = pt;
      return;
    }
    if (healMode === "wand") {
      const ctx = work.getContext("2d");
      if (!ctx) return;
      const image = ctx.getImageData(0, 0, work.width, work.height);
      wandSelect(image, mask, pt.x, pt.y, wandTol, true);
      redrawHeal();
      drawing.current = false;
      return;
    }
    paintBrush(mask, work.width, work.height, pt.x, pt.y, brush);
    redrawHeal();
  }

  function onHealMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || healMode !== "brush") return;
    const work = workRef.current;
    const mask = maskRef.current;
    const pt = imagePoint(event);
    if (!work || !mask || !pt) return;
    paintBrush(mask, work.width, work.height, pt.x, pt.y, brush);
    redrawHeal();
  }

  function onHealUp(event: React.PointerEvent<HTMLCanvasElement>) {
    const work = workRef.current;
    const mask = maskRef.current;
    const pt = imagePoint(event);
    if (healMode === "rect" && rectStart.current && work && mask && pt) {
      paintRect(mask, work.width, work.height, {
        x: Math.min(rectStart.current.x, pt.x),
        y: Math.min(rectStart.current.y, pt.y),
        w: Math.abs(pt.x - rectStart.current.x),
        h: Math.abs(pt.y - rectStart.current.y),
      });
      redrawHeal();
    }
    drawing.current = false;
    rectStart.current = null;
  }

  function runHeal() {
    const work = workRef.current;
    const mask = maskRef.current;
    if (!work || !mask || !maskHasPaint(mask)) return;
    const ctx = work.getContext("2d");
    if (!ctx) return;
    const before = takeSnap(true);
    healCanvas(work, mask, 8);
    maskRef.current = emptyMask(work.width, work.height);
    redrawHeal();
    history.record(before, takeSnap(true));
    setEnhance((e) => ({ ...e }));
  }

  const watermarkPage = tool.slug.includes("watermark") && !tool.slug.includes("add");

  return (
    <div className="grid gap-6">
      {!file ? (
        <DropZone onFiles={load} label="Drop a photo to edit" />
      ) : (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <UndoRedoBar undo={history.undo} redo={history.redo} canUndo={history.canUndo} canRedo={history.canRedo} />
          <button type="button" className="btn btn-ghost" onClick={resetSource}>
            New file
          </button>
        </div>
      )}

      {file && sourceUrl && result && panel === "adjust" ? (
        <CompareSlider beforeUrl={sourceUrl} afterUrl={result.url} />
      ) : null}

      {file && result && panel === "cutout" ? (
        <div
          className="cursor-crosshair overflow-hidden rounded-[16px] border border-[var(--line)] bg-[linear-gradient(45deg,#F5F5F1_25%,transparent_25%),linear-gradient(-45deg,#F5F5F1_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#F5F5F1_75%),linear-gradient(-45deg,transparent_75%,#F5F5F1_75%)] bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0] bg-[#221F1F]"
          onClick={(event) => {
            const staged = stagedRef.current;
            if (!staged) return;
            const pt = pointerToImage(event, event.currentTarget, staged.width, staged.height);
            if (pt.x < 0 || pt.y < 0 || pt.x > staged.width || pt.y > staged.height) return;
            const rgb = samplePixel(staged, staged.width, staged.height, pt.x, pt.y, 3);
            patchEdit(
              {
                seed: pt,
                chroma: [rgb[0], rgb[1], rgb[2]],
                cutMode: cutMode === "corners" ? "wand" : cutMode,
                cutOn: true,
              },
              "instant",
            );
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={result.url} alt="Cutout preview — click the backdrop" className="mx-auto max-h-[460px] object-contain" />
          <p className="border-t border-[var(--line)] px-4 py-2 text-center text-[10px] tracking-[0.18em] text-[#F5F5F1]/70 uppercase">
            Click the backdrop to sample
          </p>
        </div>
      ) : null}

      {file && panel === "heal" ? (
        <canvas
          ref={viewRef}
          className="mx-auto h-auto max-h-[480px] w-auto max-w-full touch-none cursor-crosshair rounded-[16px] border border-[var(--line)] bg-[#221F1F]"
          onPointerDown={onHealDown}
          onPointerMove={onHealMove}
          onPointerUp={onHealUp}
          onPointerCancel={onHealUp}
        />
      ) : null}

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["adjust", "Grade & rotate"],
            ["cutout", "Background"],
            ["heal", "Remove object"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`btn min-h-10 px-3 ${panel === id ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setPanel(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="card grid gap-6 p-6">
        <p className="text-sm leading-6 text-[var(--ink-soft)]">
          Full editor on this page: free rotation (try 36.6°), colour grade, match a reference still, cut out a backdrop,
          or select an object and heal it. Pixels stay in this tab. Drag the preview to compare before and after.
        </p>
        <HistogramView hist={hist} />

        {panel === "adjust" ? (
          <>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-ghost min-h-10 px-3" disabled={!bitmap} onClick={() => bakeAuto("wb")}>
                Auto white balance
              </button>
              <button
                type="button"
                className="btn btn-ghost min-h-10 px-3"
                disabled={!bitmap}
                onClick={() => bakeAuto("contrast")}
              >
                Auto contrast
              </button>
            </div>
            <EnhanceBar
              value={enhance}
              onChange={(next) => patchEdit({ enhance: next })}
              matchAmount={look.amount}
              hasReference={look.hasReference}
              onMatchAmount={(n) => {
                look.setAmount(n);
                patchEdit({ matchAmount: n });
              }}
              onReference={look.loadReference}
            />
          </>
        ) : null}

        {panel === "cutout" ? (
          <div className="grid gap-5">
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={cutOn}
                onChange={(event) => patchEdit({ cutOn: event.target.checked }, "instant")}
              />
              Apply background cutout
            </label>
            <p className="text-sm leading-6 text-[var(--ink-soft)]">
              Click the processed preview? Switch to Grade to see it. Best on a flat wall or green screen — click a
              corner below after enabling wand, or use auto corners.
            </p>
            <div className="flex flex-wrap gap-2">
              {([
                ["corners", "Auto corners"],
                ["wand", "Click wand"],
                ["chroma", "Chroma key"],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`btn min-h-10 px-3 ${cutMode === id ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => patchEdit({ cutMode: id, cutOn: true }, "instant")}
                >
                  {label}
                </button>
              ))}
            </div>
            <label className="grid gap-2 text-sm">
              Tolerance · {tolerance}
              <input
                type="range"
                min={8}
                max={140}
                value={tolerance}
                onChange={(e) => patchEdit({ tolerance: Number(e.target.value) })}
              />
            </label>
            <label className="grid gap-2 text-sm">
              Feather · {feather}
              <input type="range" min={0} max={40} value={feather} onChange={(e) => patchEdit({ feather: Number(e.target.value) })} />
            </label>
            {cutMode !== "corners" && bitmap ? (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  const rgb = samplePixel(bitmap, bitmap.width, bitmap.height, 2, 2, 3);
                  patchEdit({ chroma: [rgb[0], rgb[1], rgb[2]], seed: { x: 2, y: 2 } }, "instant");
                }}
              >
                Sample top-left
              </button>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {([
                ["alpha", "Transparent"],
                ["color", "Solid fill"],
                ["image", "Image fill"],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`btn min-h-10 px-3 ${fillMode === id ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => patchEdit({ fillMode: id }, "instant")}
                >
                  {label}
                </button>
              ))}
            </div>
            {fillMode === "color" ? (
              <label className="grid max-w-40 gap-2 text-sm">
                Fill colour
                <input
                  className="field h-12"
                  type="color"
                  value={fillColor}
                  onChange={(e) => patchEdit({ fillColor: e.target.value }, "instant")}
                />
              </label>
            ) : null}
            {fillMode === "image" ? (
              <input
                className="field"
                type="file"
                accept="image/*"
                onChange={async (event) => {
                  const next = event.target.files?.[0];
                  if (!next) return;
                  fillBmp?.close();
                  setFillBmp(await fileToBitmap(next));
                }}
              />
            ) : null}
          </div>
        ) : null}

        {panel === "heal" ? (
          <div className="grid gap-5">
            <p className="text-sm leading-6 text-[var(--ink-soft)]">
              {watermarkPage
                ? "Select the visible stamp or logo (brush, box, or click-wand), then Remove. Invisible SynthID / C2PA is not stripped."
                : "Select the object — paint, box, or click similar colour — then Remove. Nearby pixels fill the hole. Small marks work; huge crowds smear."}
            </p>
            <div className="flex flex-wrap gap-2">
              {([
                ["brush", "Brush"],
                ["rect", "Box"],
                ["wand", "Click select"],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`btn min-h-10 px-3 ${healMode === id ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setHealMode(id)}
                >
                  {label}
                </button>
              ))}
              <button type="button" className="btn btn-primary min-h-10 px-3" onClick={runHeal} disabled={!bitmap}>
                Remove selection
              </button>
              <button
                type="button"
                className="btn btn-ghost min-h-10 px-3"
                onClick={() => {
                  const work = workRef.current;
                  const mask = maskRef.current;
                  if (!work || !mask) return;
                  growMask(mask, work.width, work.height, 3);
                  redrawHeal();
                }}
              >
                Grow selection
              </button>
              <button
                type="button"
                className="btn btn-ghost min-h-10 px-3"
                disabled={!history.canUndo}
                onClick={history.undo}
              >
                Undo
              </button>
              <button
                type="button"
                className="btn btn-ghost min-h-10 px-3"
                disabled={!history.canRedo}
                onClick={history.redo}
              >
                Redo
              </button>
              <button
                type="button"
                className="btn btn-ghost min-h-10 px-3"
                onClick={() => {
                  const work = workRef.current;
                  if (!work) return;
                  maskRef.current = emptyMask(work.width, work.height);
                  redrawHeal();
                }}
              >
                Clear
              </button>
            </div>
            <label className="grid gap-2 text-sm">
              Brush · {brush}px
              <input type="range" min={6} max={140} value={brush} onChange={(e) => setBrush(Number(e.target.value))} />
            </label>
            {healMode === "wand" ? (
              <label className="grid gap-2 text-sm">
                Click-select tolerance · {wandTol}
                <input type="range" min={8} max={120} value={wandTol} onChange={(e) => setWandTol(Number(e.target.value))} />
              </label>
            ) : null}
          </div>
        ) : null}

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

export const ColorGradeTool = ImageStudio;
export const CutoutTool = ImageStudio;
export const HealTool = ImageStudio;
export const PhotoStudio = ImageStudio;
