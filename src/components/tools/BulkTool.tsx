"use client";

import { useState } from "react";
import JSZip from "jszip";
import { DropZone } from "@/components/DropZone";
import { FormatPicker } from "@/components/FormatPicker";
import { downloadBlob } from "@/lib/download";
import { canvasToFormat } from "@/lib/export";
import { formatBytes } from "@/lib/format";
import { getFormat, type ConvertFormat } from "@/lib/formats";
import { drawExact, fileToBitmap, scaleToFit } from "@/lib/image";

export function BulkTool({ mode }: { mode: "bulk-resize" | "bulk-compress" }) {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [quality, setQuality] = useState(0.78);
  const [maxWidth, setMaxWidth] = useState(1920);
  const [format, setFormat] = useState<ConvertFormat>(getFormat("jpeg")!);

  async function run() {
    if (!files.length) return;
    setBusy(true);
    setError(null);
    try {
      const zip = new JSZip();
      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        setProgress(`${i + 1} / ${files.length}`);
        const bitmap = await fileToBitmap(file);
        const sized =
          mode === "bulk-resize"
            ? scaleToFit(bitmap.width, bitmap.height, maxWidth)
            : { width: bitmap.width, height: bitmap.height };
        const canvas = drawExact(bitmap, sized.width, sized.height, "#ffffff");
        const result = await canvasToFormat(canvas, format, quality);
        const base = file.name.replace(/\.[^.]+$/, "");
        zip.file(`${base}-cherry.${format.ext}`, result.blob);
        URL.revokeObjectURL(result.url);
        bitmap.close();
      }
      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlob(blob, mode === "bulk-resize" ? "resized-images.zip" : "compressed-images.zip");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk processing failed.");
    } finally {
      setBusy(false);
      setProgress("");
    }
  }

  return (
    <div className="grid gap-6">
      <DropZone
        multiple
        label="Drop a set of images"
        hint={`${files.length} file${files.length === 1 ? "" : "s"} staged · processed locally`}
        onFiles={(next) => setFiles((prev) => [...prev, ...next])}
      />
      {files.length ? (
        <p className="text-sm text-[var(--ink-soft)]">
          {files.length} files · {formatBytes(files.reduce((sum, file) => sum + file.size, 0))} original
        </p>
      ) : null}
      <div className="card grid gap-6 p-6 md:grid-cols-2">
        {mode === "bulk-resize" ? (
          <label className="grid gap-2 text-sm">
            Max width
            <input
              className="field"
              type="number"
              min={64}
              value={maxWidth}
              onChange={(event) => setMaxWidth(Number(event.target.value))}
            />
          </label>
        ) : null}
        <label className="grid gap-2 text-sm">
          Quality {Math.round(quality * 100)}
          <input
            type="range"
            min={0.2}
            max={0.95}
            step={0.01}
            value={quality}
            onChange={(event) => setQuality(Number(event.target.value))}
          />
        </label>
        <FormatPicker value={format.id} onChange={setFormat} />
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn btn-primary" disabled={!files.length || busy || !format.supported} onClick={run}>
          {busy ? `Working ${progress}` : `Download ZIP · .${format.ext}`}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setFiles([])} disabled={busy}>
          Clear
        </button>
      </div>
      {error ? <p className="text-sm text-brand">{error}</p> : null}
    </div>
  );
}
