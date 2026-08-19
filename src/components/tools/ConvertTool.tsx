"use client";

import { useEffect, useState } from "react";
import { DropZone } from "@/components/DropZone";
import { EnhanceBar } from "@/components/EnhanceBar";
import { FileStats } from "@/components/FileStats";
import { FormatPicker } from "@/components/FormatPicker";
import { OutputActions } from "@/components/OutputActions";
import { applyEnhance, DEFAULT_ENHANCE, type EnhanceSettings } from "@/lib/enhance";
import { canvasToFormat, isLossyFormat } from "@/lib/export";
import { CONVERT_FORMATS, detectInputLabel, getFormat, type ConvertFormat } from "@/lib/formats";
import { drawExact, fileToBitmap, revokeResult, type ProcessResult } from "@/lib/image";

const ACCEPT =
  "image/*,.heic,.heif,.svg,.bmp,.ico,.avif,application/pdf,.pdf";

export function ConvertTool() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<ConvertFormat>(
    getFormat("jpeg") ?? CONVERT_FORMATS[0],
  );
  const [quality, setQuality] = useState(0.92);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enhance, setEnhance] = useState<EnhanceSettings>(DEFAULT_ENHANCE);
  const lossy = isLossyFormat(format.id);

  function clear() {
    revokeResult(result);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setResult(null);
    setPreviewUrl(null);
    setError(null);
  }

  async function onFiles(files: File[]) {
    const next = files[0];
    if (!next) return;
    revokeResult(result);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(next);
    setPreviewUrl(URL.createObjectURL(next));
    setResult(null);
    setError(null);
  }

  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    const handle = window.setTimeout(async () => {
      setBusy(true);
      setError(null);
      try {
        const bitmap = await fileToBitmap(file);
        const enhanced = applyEnhance(bitmap, bitmap.width, bitmap.height, enhance);
        bitmap.close();
        const canvas = drawExact(enhanced, enhanced.width, enhanced.height);
        const next = await canvasToFormat(canvas, format, quality);
        if (cancelled) {
          revokeResult(next);
          return;
        }
        setResult((prev) => {
          revokeResult(prev);
          return next;
        });
      } catch (err) {
        if (!cancelled) {
          setResult((prev) => {
            revokeResult(prev);
            return null;
          });
          setError(err instanceof Error ? err.message : "Conversion failed.");
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    }, 140);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [enhance, file, format, quality]);

  return (
    <div className="grid gap-6">
      {!file ? (
        <DropZone
          onFiles={onFiles}
          accept={ACCEPT}
          label="Drop any file to convert"
          hint="Search the output format. Images, HEIC, and SVG convert in this browser. Office, audio, and video stay listed so you can see the limit."
        />
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[var(--ink-soft)]">
            {file.name} · detected {detectInputLabel(file)} · local only
          </p>
          <button type="button" className="btn btn-ghost" onClick={clear}>
            New file
          </button>
        </div>
      )}

      <div className="card grid gap-6 p-6 md:grid-cols-2">
        <label className="grid gap-2 text-sm">
          From
          <div className="field flex items-center text-[var(--ink-soft)]">
            {file ? detectInputLabel(file) : "Auto-detect after upload"}
          </div>
        </label>
        <FormatPicker value={format.id} onChange={setFormat} />
        {lossy && format.supported ? (
          <label className="grid gap-2 text-sm md:col-span-2">
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
        {format.note ? (
          <p className="text-sm leading-6 text-[var(--ink-soft)] md:col-span-2">{format.note}</p>
        ) : null}
        <EnhanceBar value={enhance} onChange={setEnhance} />
      </div>

      {file && previewUrl && format.mime.startsWith("image/") && result ? (
        <div className="overflow-hidden rounded-[16px] border border-[var(--line)] bg-[#221F1F]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={result.url} alt="Converted preview" className="mx-auto max-h-[420px] object-contain" />
        </div>
      ) : null}

      {file && result ? (
        <FileStats
          originalBytes={file.size}
          outputBytes={result.bytes}
          width={result.width}
          height={result.height}
          extra={[{ label: "Format", value: `.${format.ext}` }]}
        />
      ) : null}

      {file ? <OutputActions result={result} fileName={file.name} format={format} busy={busy} /> : null}
      {error ? <p className="text-sm text-brand">{error}</p> : null}
    </div>
  );
}
