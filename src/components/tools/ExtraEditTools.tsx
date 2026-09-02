"use client";

import { useEffect, useState } from "react";
import { CompareSlider } from "@/components/CompareSlider";
import { DropZone } from "@/components/DropZone";
import { FileStats } from "@/components/FileStats";
import { FormatPicker } from "@/components/FormatPicker";
import { OutputActions } from "@/components/OutputActions";
import { addPhotoBorder, blurFaces, enhanceBitmap, extendBitmap, trimWhitespace, upscaleBitmap } from "@/lib/extra-edit";
import { canvasToFormat } from "@/lib/export";
import { getFormat, type ConvertFormat } from "@/lib/formats";
import { fileToBitmap, revokeResult, type ProcessResult } from "@/lib/image";
import type { ToolDef } from "@/lib/tools";

function extraKind(slug: string) {
  if (slug.includes("blur-face") || slug.includes("face-blur") || slug.includes("blur-faces")) return "face-blur";
  if (slug.includes("white-space") || slug.includes("whitespace")) return "trim";
  if (slug.includes("border")) return "border";
  if (slug.includes("upscale")) return "upscale";
  if (slug.includes("extend")) return "extend";
  return "enhance";
}

export function ExtraEditTools({ tool }: { tool: ToolDef }) {
  const kind = extraKind(tool.slug);
  const [file, setFile] = useState<File | null>(null);
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [factor, setFactor] = useState<2 | 3 | 4>(2);
  const [pad, setPad] = useState(12);
  const [fill, setFill] = useState<"blur" | "color">("blur");
  const [color, setColor] = useState("#ffffff");
  const [blurAmt, setBlurAmt] = useState(18);
  const [faceNote, setFaceNote] = useState<string | null>(null);
  const [format, setFormat] = useState<ConvertFormat>(getFormat("jpeg")!);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(files: File[]) {
    const next = files[0];
    if (!next) return;
    bitmap?.close();
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    revokeResult(result);
    try {
      const bmp = await fileToBitmap(next);
      setFile(next);
      setBitmap(bmp);
      setSourceUrl(URL.createObjectURL(next));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that image.");
    }
  }

  useEffect(() => {
    if (!bitmap) return;
    let cancelled = false;
    const handle = window.setTimeout(async () => {
      setBusy(true);
      try {
        let canvas: HTMLCanvasElement;
        if (kind === "upscale") canvas = upscaleBitmap(bitmap, factor);
        else if (kind === "extend") canvas = extendBitmap(bitmap, pad, fill, color);
        else if (kind === "border") canvas = addPhotoBorder(bitmap, pad, color);
        else if (kind === "trim") canvas = trimWhitespace(bitmap);
        else if (kind === "face-blur") {
          const blurred = await blurFaces(bitmap, blurAmt);
          canvas = blurred.canvas;
          if (!cancelled) {
            setFaceNote(
              blurred.count
                ? `${blurred.count} face${blurred.count === 1 ? "" : "s"} pixelated in this tab.`
                : "No FaceDetector hit. Chrome or Edge usually detects faces. We did not blur the whole photo.",
            );
          }
        } else canvas = enhanceBitmap(bitmap);
        const next = await canvasToFormat(canvas, format, 0.92);
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
    }, 80);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [bitmap, blurAmt, color, factor, fill, format, kind, pad]);

  return (
    <div className="grid gap-6">
      {!file ? (
        <DropZone onFiles={load} />
      ) : (
        <button
          type="button"
          className="btn btn-ghost justify-self-end"
          onClick={() => {
            bitmap?.close();
            if (sourceUrl) URL.revokeObjectURL(sourceUrl);
            revokeResult(result);
            setFile(null);
            setBitmap(null);
            setSourceUrl(null);
            setResult(null);
          }}
        >
          New file
        </button>
      )}
      {sourceUrl && result ? <CompareSlider beforeUrl={sourceUrl} afterUrl={result.url} /> : null}
      <div className="card grid gap-5 p-6">
        <p className="text-sm leading-6 text-[var(--ink-soft)]">
          {kind === "upscale"
            ? "Local 2× / 3× / 4× upscale with sharpen. Not a cloud ESRGAN model — good for web and prints when you cannot upload."
            : kind === "extend"
              ? "Pad the canvas (outpaint-style) by reflecting or blurring the photo outward. Generative scene invention still needs a desktop model."
              : kind === "face-blur"
                ? "Detects faces in this tab (Chrome/Edge FaceDetector) and pixelates them. No upload. If no face is found, the photo is left unblurred."
                : kind === "trim"
                  ? "Crops near-white margins. Good for scans with paper border. Files stay in this tab."
                  : kind === "border"
                    ? "Solid border around the photo. Not a passport millimetre frame — use the photo tools for that."
                    : "One-click enhance: auto white balance, contrast stretch, and unsharp. Files stay in this tab."}
        </p>
        {kind === "upscale" ? (
          <div className="flex flex-wrap gap-2">
            {([2, 3, 4] as const).map((n) => (
              <button
                key={n}
                type="button"
                className={`btn min-h-10 px-3 ${factor === n ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setFactor(n)}
              >
                {n}×
              </button>
            ))}
          </div>
        ) : null}
        {kind === "extend" ? (
          <>
            <label className="grid gap-2 text-sm">
              Pad {pad}%
              <input type="range" min={4} max={40} value={pad} onChange={(e) => setPad(Number(e.target.value))} />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`btn min-h-10 px-3 ${fill === "blur" ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setFill("blur")}
              >
                Blur fill
              </button>
              <button
                type="button"
                className={`btn min-h-10 px-3 ${fill === "color" ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setFill("color")}
              >
                Solid fill
              </button>
            </div>
            {fill === "color" ? (
              <input className="field h-12 max-w-28" type="color" value={color} onChange={(e) => setColor(e.target.value)} />
            ) : null}
          </>
        ) : null}
        {kind === "face-blur" ? (
          <label className="grid gap-2 text-sm">
            Pixel block · {blurAmt}
            <input type="range" min={8} max={28} value={blurAmt} onChange={(e) => setBlurAmt(Number(e.target.value))} />
          </label>
        ) : null}
        {kind === "border" ? (
          <>
            <label className="grid gap-2 text-sm">
              Border {pad}%
              <input type="range" min={2} max={24} value={pad} onChange={(e) => setPad(Number(e.target.value))} />
            </label>
            <input className="field h-12 max-w-28" type="color" value={color} onChange={(e) => setColor(e.target.value)} />
          </>
        ) : null}
        {faceNote ? <p className="text-sm text-[var(--ink-soft)]">{faceNote}</p> : null}
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
