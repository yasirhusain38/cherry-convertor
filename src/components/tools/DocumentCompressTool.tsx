"use client";

import { useMemo, useState } from "react";
import { DropZone } from "@/components/DropZone";
import { TargetSizeField } from "@/components/TargetSizeField";
import { downloadBlob } from "@/lib/download";
import { formatBytes } from "@/lib/format";
import { filesToPageCanvases, type PageCanvas } from "@/lib/pdf-raster";
import { blobToDataUrl, imagesToPdf } from "@/lib/pdf";
import { canvasToBlob, drawExact } from "@/lib/image";
import { bytesToSizeInput, capLabel, parseTypedSize, type SizeUnit } from "@/lib/target-size";
import { getDocumentSpec } from "@/data/document-specs";
import type { ToolDef } from "@/lib/tools";

function downscalePages(pages: PageCanvas[], factor: number): PageCanvas[] {
  return pages.map((page) => {
    const width = Math.max(32, Math.round(page.width * factor));
    const height = Math.max(32, Math.round(page.height * factor));
    const canvas = drawExact(page.canvas, width, height, "#ffffff");
    return { canvas, width, height };
  });
}

async function encodePdf(pages: PageCanvas[], quality: number): Promise<Blob> {
  const images = [];
  for (const page of pages) {
    const jpeg = await canvasToBlob(page.canvas, "image/jpeg", quality);
    images.push({
      dataUrl: await blobToDataUrl(jpeg),
      width: page.width,
      height: page.height,
    });
  }
  return imagesToPdf({ images, pageSize: "a4", marginMm: 6 });
}

export function DocumentCompressTool({ tool }: { tool: ToolDef }) {
  const spec = getDocumentSpec(tool.documentSpecId ?? tool.slug);
  const seeded = bytesToSizeInput(spec.defaultBytes);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resultNote, setResultNote] = useState<string | null>(null);
  const [targetSize, setTargetSize] = useState(seeded.value);
  const [targetUnit, setTargetUnit] = useState<SizeUnit>(seeded.unit);

  const parsed = useMemo(
    () => parseTypedSize(targetSize, targetUnit),
    [targetSize, targetUnit],
  );
  const targetBytes = parsed?.bytes ?? spec.defaultBytes;
  const cap = capLabel(spec.defaultBytes);
  const merge = Boolean(spec.merge);

  async function run() {
    if (!files.length) return;
    setBusy(true);
    setError(null);
    setResultNote(null);
    try {
      setProgress("Reading pages…");
      const pages = await filesToPageCanvases(files);
      if (!pages.length) throw new Error("No pages found.");
      let blob: Blob | null = null;
      const scales = [1, 0.72, 0.52];
      outer: for (const scale of scales) {
        const working = scale === 1 ? pages : downscalePages(pages, scale);
        if (scale !== 1) setProgress(`Shrinking pages · ${Math.round(scale * 100)}%`);
        let quality = 0.82;
        for (let attempt = 0; attempt < 7; attempt += 1) {
          setProgress(`Encoding · pass ${attempt + 1}`);
          blob = await encodePdf(working, quality);
          if (blob.size <= targetBytes) break outer;
          quality = Math.max(0.28, quality - 0.1);
        }
      }
      if (!blob) throw new Error("Could not build the PDF.");
      const original = files.reduce((sum, file) => sum + file.size, 0);
      if (blob.size > targetBytes) {
        setError(
          `Still ${formatBytes(blob.size)} after shrinking pages (cap ${formatBytes(targetBytes)}). Drop fewer pages or split the file, then run again.`,
        );
      } else {
        setResultNote(
          `${formatBytes(original)} → ${formatBytes(blob.size)} · cap ${formatBytes(targetBytes)}`,
        );
      }
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
      <dl className="grid grid-cols-2 gap-2 text-sm text-[var(--ink-soft)] md:grid-cols-4">
        <div>
          <dt className="label">File cap</dt>
          <dd>{cap}</dd>
        </div>
        <div>
          <dt className="label">Format</dt>
          <dd>PDF</dd>
        </div>
        <div>
          <dt className="label">Input</dt>
          <dd>{merge ? "Several PDFs or page photos" : "PDF or page photos"}</dd>
        </div>
        <div>
          <dt className="label">Pages</dt>
          <dd>{merge ? "Merged, then capped" : "Rebuilt in drop order"}</dd>
        </div>
      </dl>

      <ol className="grid gap-3 text-sm leading-6 text-[var(--ink-soft)] md:grid-cols-3">
        <li>
          <p className="label">01</p>
          <p className="mt-1 text-[#F5F5F1]">{merge ? "Drop PDFs to merge" : "Drop a PDF"}</p>
          <p>Or photos of pages, in order.</p>
        </li>
        <li>
          <p className="label">02</p>
          <p className="mt-1 text-[#F5F5F1]">Preset applied</p>
          <p>Default cap {cap}. Type another size if the form differs.</p>
        </li>
        <li>
          <p className="label">03</p>
          <p className="mt-1 text-[#F5F5F1]">Download</p>
          <p>The new PDF is saved from this tab. Nothing is uploaded.</p>
        </li>
      </ol>

      <p className="text-sm leading-6 text-[var(--ink-soft)]">{spec.notes}</p>
      <DropZone
        multiple
        accept="application/pdf,.pdf,image/*,.heic,.heif"
        label={merge ? "Drop PDFs to merge" : "Drop a PDF or photos of pages"}
        hint={
          merge
            ? "Merged in drop order, then rebuilt under the cap. Stays on this device."
            : "Bank statements, marksheets, bills — rebuilt locally as a smaller PDF."
        }
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
          {busy ? progress || "Working…" : merge ? "Merge and download PDF" : "Download smaller PDF"}
        </button>
        {files.length ? (
          <button type="button" className="btn btn-ghost" onClick={() => setFiles([])} disabled={busy}>
            Clear
          </button>
        ) : null}
      </div>
      {resultNote ? <p className="text-sm text-[var(--ink-soft)]">{resultNote}</p> : null}
      {error ? <p className="text-sm text-brand">{error}</p> : null}
    </div>
  );
}
