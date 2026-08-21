"use client";

import { useMemo, useState } from "react";
import { DropZone } from "@/components/DropZone";
import { TargetSizeField } from "@/components/TargetSizeField";
import { downloadBlob } from "@/lib/download";
import { formatBytes } from "@/lib/format";
import { filesToPageCanvases } from "@/lib/pdf-raster";
import { blobToDataUrl, imagesToPdf } from "@/lib/pdf";
import { canvasToBlob } from "@/lib/image";
import { parseTypedSize, type SizeUnit } from "@/lib/target-size";
import { getDocumentSpec } from "@/data/document-specs";
import type { ToolDef } from "@/lib/tools";

export function DocumentCompressTool({ tool }: { tool: ToolDef }) {
  const spec = getDocumentSpec(tool.documentSpecId ?? tool.slug);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const defaultMb = spec.defaultBytes / (1024 * 1024);
  const [targetSize, setTargetSize] = useState(spec.locked ? String(defaultMb) : String(defaultMb));
  const [targetUnit, setTargetUnit] = useState<SizeUnit>(defaultMb >= 1 ? "MB" : "KB");

  const parsed = useMemo(
    () => parseTypedSize(targetSize, targetUnit),
    [targetSize, targetUnit],
  );
  const targetBytes = parsed?.bytes ?? spec.defaultBytes;

  async function run() {
    if (!files.length) return;
    setBusy(true);
    setError(null);
    try {
      setProgress("Reading pages…");
      const pages = await filesToPageCanvases(files);
      if (!pages.length) throw new Error("No pages found.");
      let quality = 0.82;
      let blob: Blob | null = null;
      for (let attempt = 0; attempt < 7; attempt += 1) {
        setProgress(`Encoding · pass ${attempt + 1}`);
        const images = [];
        for (const page of pages) {
          const jpeg = await canvasToBlob(page.canvas, "image/jpeg", quality);
          images.push({
            dataUrl: await blobToDataUrl(jpeg),
            width: page.width,
            height: page.height,
          });
        }
        blob = await imagesToPdf({ images, pageSize: "a4", marginMm: 6 });
        if (blob.size <= targetBytes) break;
        quality = Math.max(0.28, quality - 0.1);
      }
      if (!blob) throw new Error("Could not build the PDF.");
      downloadBlob(blob, `${tool.slug}.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not compress that file.");
    } finally {
      setBusy(false);
      setProgress("");
    }
  }

  return (
    <div className="grid gap-6">
      <p className="text-sm leading-6 text-[var(--ink-soft)]">{spec.notes}</p>
      <DropZone
        multiple
        accept="application/pdf,.pdf,image/*,.heic,.heif"
        label="Drop a PDF or photos of pages"
        hint="Bank statements, marksheets, bills — rebuilt locally as a smaller PDF."
        onFiles={(next) => setFiles((prev) => [...prev, ...next])}
      />
      {files.length ? (
        <ul className="card divide-y divide-[var(--line)]">
          {files.map((file, index) => (
            <li key={`${file.name}-${index}`} className="flex justify-between gap-4 px-5 py-3 text-sm">
              <span>
                {file.name} · {formatBytes(file.size)}
              </span>
              <button
                type="button"
                className="text-brand"
                onClick={() => setFiles((prev) => prev.filter((_, i) => i !== index))}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="card grid gap-4 p-6">
        <TargetSizeField
          value={targetSize}
          unit={targetUnit}
          onValue={setTargetSize}
          onUnit={setTargetUnit}
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn btn-primary" disabled={!files.length || busy} onClick={run}>
          {busy ? progress || "Working…" : "Download smaller PDF"}
        </button>
        {files.length ? (
          <button type="button" className="btn btn-ghost" onClick={() => setFiles([])} disabled={busy}>
            Clear
          </button>
        ) : null}
      </div>
      {error ? <p className="text-sm text-brand">{error}</p> : null}
    </div>
  );
}
