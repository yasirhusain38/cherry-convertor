"use client";

import { useEffect, useState } from "react";
import { CompareSlider } from "@/components/CompareSlider";
import { DropZone } from "@/components/DropZone";
import { FileStats } from "@/components/FileStats";
import { FormatPicker } from "@/components/FormatPicker";
import { OutputActions } from "@/components/OutputActions";
import { enhanceBitmap, extendBitmap, upscaleBitmap } from "@/lib/extra-edit";
import { canvasToFormat } from "@/lib/export";
import { getFormat, type ConvertFormat } from "@/lib/formats";
import { fileToBitmap, revokeResult, type ProcessResult } from "@/lib/image";
import type { ToolDef } from "@/lib/tools";

export function ExtraEditTools({ tool }: { tool: ToolDef }) {
  const kind = tool.slug.includes("upscale")
    ? "upscale"
    : tool.slug.includes("extend")
      ? "extend"
      : "enhance";
  const [file, setFile] = useState<File | null>(null);
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [factor, setFactor] = useState<2 | 3 | 4>(2);
  const [pad, setPad] = useState(12);
  const [fill, setFill] = useState<"blur" | "color">("blur");
  const [color, setColor] = useState("#ffffff");
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
        const canvas =
          kind === "upscale"
            ? upscaleBitmap(bitmap, factor)
            : kind === "extend"
              ? extendBitmap(bitmap, pad, fill, color)
              : enhanceBitmap(bitmap);
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
  }, [bitmap, color, factor, fill, format, kind, pad]);

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
