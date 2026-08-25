"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CompareSlider } from "@/components/CompareSlider";
import { DropZone } from "@/components/DropZone";
import { EnhanceBar } from "@/components/EnhanceBar";
import { FileStats } from "@/components/FileStats";
import { FormatPicker } from "@/components/FormatPicker";
import { OutputActions } from "@/components/OutputActions";
import { TargetSizeField } from "@/components/TargetSizeField";
import { WatermarkPanel } from "@/components/WatermarkPanel";
import { UndoRedoBar } from "@/components/UndoRedoBar";
import { applyEnhance, cloneEnhance, enhanceForSlug, type EnhanceSettings } from "@/lib/enhance";
import { useEditHistory } from "./useEditHistory";
import { useLookMatch } from "./useLookMatch";
import { parseTypedSize, type SizeUnit } from "@/lib/target-size";
import { canvasToFormat, isLossyFormat } from "@/lib/export";
import { getFormat, type ConvertFormat } from "@/lib/formats";
import {
  compressToTargetBytes,
  drawExact,
  fileToBitmap,
  revokeResult,
  scaleToFit,
  type ProcessResult,
} from "@/lib/image";
import type { ToolDef } from "@/lib/tools";

function defaultFormat(tool: ToolDef): ConvertFormat {
  if (tool.slug === "image-to-base64") return getFormat("txt")!;
  if (tool.outputMime === "image/png") return getFormat("png")!;
  if (tool.outputMime === "image/webp") return getFormat("webp")!;
  return getFormat("jpeg")!;
}

export function SingleImageTool({ tool }: { tool: ToolDef }) {
  const [file, setFile] = useState<File | null>(null);
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [quality, setQuality] = useState(0.8);
  const [format, setFormat] = useState<ConvertFormat>(defaultFormat(tool));
  const [maxWidth, setMaxWidth] = useState("");
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [lock, setLock] = useState(true);
  const [percent, setPercent] = useState(100);
  const [fill, setFill] = useState("#ffffff");
  const [targetSize, setTargetSize] = useState("");
  const [targetUnit, setTargetUnit] = useState<SizeUnit>("KB");
  const look = useLookMatch(bitmap);
  const [fileName, setFileName] = useState("");
  const history = useEditHistory(
    { enhance: enhanceForSlug(tool.slug), matchAmount: 80 },
    (snap) => ({ enhance: cloneEnhance(snap.enhance), matchAmount: snap.matchAmount }),
    {
      onRestore: (snap) => {
        look.setAmount(snap.matchAmount);
      },
    },
  );
  const enhance = history.present.enhance;
  const setEnhance = (next: EnhanceSettings) => history.set({ enhance: next, matchAmount: look.amount });

  const parsedTarget = useMemo(
    () => parseTypedSize(targetSize, targetUnit),
    [targetSize, targetUnit],
  );
  const customTargetBytes = parsedTarget?.bytes ?? null;
  const activeTargetBytes = customTargetBytes ?? (tool.targetBytes ?? null);
  const showTargetField =
    tool.mode === "compress" || tool.mode === "resize" || tool.mode === "enhance" || tool.mode === "convert";
  const aspect = bitmap ? bitmap.width / bitmap.height : 1;

  const reset = useCallback(() => {
    revokeResult(result);
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    bitmap?.close();
    setFile(null);
    setBitmap(null);
    setSourceUrl(null);
    setResult(null);
    setError(null);
    history.reset({ enhance: enhanceForSlug(tool.slug), matchAmount: 80 });
  }, [bitmap, history, result, sourceUrl, tool.slug]);

  const onFiles = useCallback(
    async (files: File[]) => {
      const next = files[0];
      if (!next) return;
      reset();
      setBusy(true);
      setError(null);
      try {
        const bmp = await fileToBitmap(next);
        setFile(next);
        setBitmap(bmp);
        setSourceUrl(URL.createObjectURL(next));
        setFileName(next.name.replace(/\.[^.]+$/, ""));
        setWidth(bmp.width);
        setHeight(bmp.height);
        setPercent(100);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not read that image.");
      } finally {
        setBusy(false);
      }
    },
    [reset],
  );

  useEffect(() => {
    if (!bitmap || !file) return;
    let cancelled = false;
    const handle = window.setTimeout(async () => {
      setBusy(true);
      setError(null);
      try {
        const enhanced = applyEnhance(bitmap, bitmap.width, bitmap.height, enhance, look.match);
        let work = enhanced;
        if (tool.mode === "resize") {
          work = drawExact(enhanced, width || enhanced.width, height || enhanced.height, fill);
        } else if (maxWidth) {
          const sized = scaleToFit(enhanced.width, enhanced.height, Number(maxWidth));
          work = drawExact(enhanced, sized.width, sized.height, fill);
        }

        let next: ProcessResult;
        if (activeTargetBytes) {
          const source = await createImageBitmap(work);
          const targeted = await compressToTargetBytes({
            source,
            targetBytes: activeTargetBytes,
            mime: format.id === "webp" ? "image/webp" : "image/jpeg",
            fill,
          });
          source.close();
          const img = await createImageBitmap(targeted.blob);
          const canvas = drawExact(img, img.width, img.height);
          img.close();
          URL.revokeObjectURL(targeted.url);
          next = await canvasToFormat(canvas, format, quality);
        } else {
          next = await canvasToFormat(work, format, quality);
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
        if (!cancelled) setError(err instanceof Error ? err.message : "Processing failed.");
      } finally {
        if (!cancelled) setBusy(false);
      }
    }, 160);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [
    activeTargetBytes,
    bitmap,
    enhance,
    file,
    fill,
    format,
    height,
    maxWidth,
    look.match,
    quality,
    tool.mode,
    width,
  ]);

  const underTarget = useMemo(() => {
    if (!result || !activeTargetBytes) return null;
    return result.bytes <= activeTargetBytes;
  }, [activeTargetBytes, result]);

  return (
    <div className="grid gap-6">
      {!file ? (
        <DropZone onFiles={onFiles} />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[var(--ink-soft)]">{file.name} · local only</p>
            <div className="flex flex-wrap items-center gap-2">
              <UndoRedoBar undo={history.undo} redo={history.redo} canUndo={history.canUndo} canRedo={history.canRedo} />
              <button type="button" className="btn btn-ghost" onClick={reset}>
                New file
              </button>
            </div>
          </div>

          {sourceUrl && result && result.mime.startsWith("image/") ? (
            <CompareSlider beforeUrl={sourceUrl} afterUrl={result.url} />
          ) : (
            <div className="card flex min-h-[240px] items-center justify-center text-sm text-[var(--ink-soft)]">
              {busy ? "Encoding…" : "Preview appears after processing"}
            </div>
          )}

          <FileStats
            originalBytes={file.size}
            outputBytes={result?.bytes}
            width={result?.width}
            height={result?.height}
            extra={[
              { label: "Format", value: `.${format.ext}` },
              ...(activeTargetBytes
                ? [{ label: "Target", value: underTarget ? "Met" : busy ? "Working" : "Over" }]
                : []),
            ]}
          />

          <div className="card grid gap-6 p-6 md:grid-cols-2">
            {tool.slug === "add-watermark" ? (
              <WatermarkPanel value={enhance} onChange={setEnhance} featured />
            ) : null}
            {tool.slug === "rotate-image" ? (
              <p className="text-sm leading-6 text-[var(--ink-soft)] md:col-span-2">
                Type any angle (36.6°, 12°, 359°) or drag 0–360°. 90° steps are still one click.
              </p>
            ) : null}
            {tool.slug === "flip-image" ? (
              <p className="text-sm leading-6 text-[var(--ink-soft)] md:col-span-2">
                Horizontal flip is on. Use Flip V if you need the photo upside down.
              </p>
            ) : null}
            {tool.slug === "black-and-white" ? (
              <p className="text-sm leading-6 text-[var(--ink-soft)] md:col-span-2">
                Black and white is already applied. Raise contrast if the face looks flat.
              </p>
            ) : null}
            {tool.slug === "image-to-base64" ? (
              <p className="text-sm leading-6 text-[var(--ink-soft)] md:col-span-2">
                Output is set to TXT (Base64). Search JSON, HTML, or MD in Convert to if you need those.
              </p>
            ) : null}

            {tool.mode === "resize" ? (
              <>
                <label className="grid gap-2 text-sm">
                  Width (px)
                  <input
                    className="field"
                    type="number"
                    min={1}
                    value={width || ""}
                    onChange={(event) => {
                      const next = Number(event.target.value);
                      setWidth(next);
                      if (lock && next) setHeight(Math.max(1, Math.round(next / aspect)));
                    }}
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  Height (px)
                  <input
                    className="field"
                    type="number"
                    min={1}
                    value={height || ""}
                    onChange={(event) => {
                      const next = Number(event.target.value);
                      setHeight(next);
                      if (lock && next) setWidth(Math.max(1, Math.round(next * aspect)));
                    }}
                  />
                </label>
                <label className="grid gap-2 text-sm md:col-span-2">
                  Scale {percent}%
                  <input
                    type="range"
                    min={5}
                    max={200}
                    value={percent}
                    onChange={(event) => {
                      const next = Number(event.target.value);
                      setPercent(next);
                      if (!bitmap) return;
                      setWidth(Math.max(1, Math.round((bitmap.width * next) / 100)));
                      setHeight(Math.max(1, Math.round((bitmap.height * next) / 100)));
                    }}
                  />
                </label>
                <label className="flex items-center gap-3 text-sm">
                  <input type="checkbox" checked={lock} onChange={(event) => setLock(event.target.checked)} />
                  Lock aspect ratio
                </label>
                <div className="flex flex-wrap gap-2">
                  {[1920, 1280, 1080, 800, 640].map((size) => (
                    <button
                      key={size}
                      type="button"
                      className="btn btn-ghost min-h-10 px-3"
                      onClick={() => {
                        setWidth(size);
                        setHeight(Math.max(1, Math.round(size / aspect)));
                        if (bitmap) setPercent(Math.round((size / bitmap.width) * 100));
                      }}
                    >
                      {size}w
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            {showTargetField ? (
              <TargetSizeField
                value={targetSize}
                unit={targetUnit}
                onValue={setTargetSize}
                onUnit={setTargetUnit}
              />
            ) : null}

            {tool.mode === "compress" ? (
              <label className="grid gap-2 text-sm">
                Max width (optional)
                <input
                  className="field"
                  type="number"
                  min={32}
                  placeholder="Original"
                  value={maxWidth}
                  onChange={(event) => setMaxWidth(event.target.value)}
                />
              </label>
            ) : null}

            {tool.mode === "target-size" && !customTargetBytes ? (
              <p className="text-sm leading-6 text-[var(--ink-soft)]">
                Default target is {Math.round((tool.targetBytes ?? 0) / 1024)} KB. Type another size below if you want.
              </p>
            ) : null}

            {tool.mode === "target-size" ? (
              <TargetSizeField
                value={targetSize}
                unit={targetUnit}
                onValue={setTargetSize}
                onUnit={setTargetUnit}
              />
            ) : null}

            <FormatPicker value={format.id} onChange={setFormat} />
            {format.note ? <p className="text-sm text-[var(--ink-soft)]">{format.note}</p> : null}

            {isLossyFormat(format.id) && !activeTargetBytes ? (
              <label className="grid gap-2 text-sm">
                Quality {Math.round(quality * 100)}
                <input
                  type="range"
                  min={0.1}
                  max={0.95}
                  step={0.01}
                  value={quality}
                  onChange={(event) => setQuality(Number(event.target.value))}
                />
              </label>
            ) : null}

            {format.id === "jpeg" ? (
              <label className="grid gap-2 text-sm">
                Background if flattening
                <input className="field h-12" type="color" value={fill} onChange={(event) => setFill(event.target.value)} />
              </label>
            ) : null}

            <EnhanceBar
              value={enhance}
              onChange={setEnhance}
              focus={tool.slug === "add-watermark" ? "watermark" : "all"}
              matchAmount={look.amount}
              hasReference={look.hasReference}
              onMatchAmount={(n) => {
                look.setAmount(n);
                history.set({ enhance, matchAmount: n });
              }}
              onReference={look.loadReference}
            />
          </div>

          <OutputActions
            result={result}
            fileName={fileName || file.name}
            format={format}
            busy={busy}
            onFileName={setFileName}
          />
          {underTarget === false ? (
            <p className="text-sm text-brand">Still above target — try JPEG or a smaller crop.</p>
          ) : null}
        </>
      )}
      {error ? <p className="text-sm text-brand">{error}</p> : null}
    </div>
  );
}
