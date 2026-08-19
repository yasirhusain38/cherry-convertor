"use client";

import { useState } from "react";
import { DropZone } from "@/components/DropZone";
import { FormatPicker } from "@/components/FormatPicker";
import { downloadBlob } from "@/lib/download";
import { canvasToFormat } from "@/lib/export";
import { getFormat, type ConvertFormat } from "@/lib/formats";
import { fileToBitmap, encodeImage, revokeResult, drawExact } from "@/lib/image";
import { blobToDataUrl, imagesToPdf } from "@/lib/pdf";
import JSZip from "jszip";

export function PdfTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<"a4" | "letter" | "4x6">("a4");
  const [format, setFormat] = useState<ConvertFormat>(getFormat("pdf")!);

  async function build() {
    if (!files.length) return;
    setBusy(true);
    setError(null);
    try {
      const images = [];
      for (const file of files) {
        const bitmap = await fileToBitmap(file);
        const encoded = await encodeImage({
          source: bitmap,
          mime: "image/jpeg",
          quality: 0.9,
          fill: "#ffffff",
        });
        images.push({
          dataUrl: await blobToDataUrl(encoded.blob),
          width: encoded.width,
          height: encoded.height,
        });
        revokeResult(encoded);
        bitmap.close();
      }
      if (format.id === "pdf") {
        const pdf = await imagesToPdf({ images, pageSize });
        downloadBlob(pdf, "cherry-converter.pdf");
      } else {
        const zip = new JSZip();
        for (let i = 0; i < files.length; i += 1) {
          const bitmap = await fileToBitmap(files[i]);
          const canvas = drawExact(bitmap, bitmap.width, bitmap.height);
          const converted = await canvasToFormat(canvas, format, 0.9);
          zip.file(`page-${String(i + 1).padStart(2, "0")}.${format.ext}`, converted.blob);
          URL.revokeObjectURL(converted.url);
          bitmap.close();
        }
        downloadBlob(await zip.generateAsync({ type: "blob" }), `cherry-pages.zip`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not build the PDF.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6">
      <DropZone
        multiple
        label="Drop images for a PDF"
        hint="Each file becomes one page. Order is the order you add them."
        onFiles={(next) => setFiles((prev) => [...prev, ...next])}
      />
      {files.length ? (
        <ul className="card divide-y divide-[var(--line)]">
          {files.map((file, index) => (
            <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
              <span>
                {String(index + 1).padStart(2, "0")}  /  {file.name}
              </span>
              <span className="flex gap-3">
                <button
                  type="button"
                  className="text-[#F5F5F1]"
                  onClick={() =>
                    setFiles((prev) => {
                      if (index === 0) return prev;
                      const next = [...prev];
                      [next[index - 1], next[index]] = [next[index], next[index - 1]];
                      return next;
                    })
                  }
                >
                  Up
                </button>
                <button
                  type="button"
                  className="text-[#F5F5F1]"
                  onClick={() =>
                    setFiles((prev) => {
                      if (index === prev.length - 1) return prev;
                      const next = [...prev];
                      [next[index + 1], next[index]] = [next[index], next[index + 1]];
                      return next;
                    })
                  }
                >
                  Down
                </button>
                <button
                  type="button"
                  className="text-brand"
                  onClick={() => setFiles((prev) => prev.filter((_, i) => i !== index))}
                >
                  Remove
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex flex-wrap items-end gap-4">
        <label className="grid gap-2 text-sm">
          Page
          <select
            className="field min-w-40"
            value={pageSize}
            onChange={(event) => setPageSize(event.target.value as typeof pageSize)}
          >
            <option value="a4">A4</option>
            <option value="letter">Letter</option>
            <option value="4x6">4 × 6 in</option>
          </select>
        </label>
        <FormatPicker value={format.id} onChange={setFormat} />
        <button type="button" className="btn btn-primary" disabled={!files.length || busy || !format.supported} onClick={build}>
          {busy ? "Building…" : format.id === "pdf" ? "Download PDF" : `Download ZIP · .${format.ext}`}
        </button>
        {files.length ? (
          <button type="button" className="btn btn-ghost" onClick={() => setFiles([])}>
            Clear
          </button>
        ) : null}
      </div>
      {error ? <p className="text-sm text-brand">{error}</p> : null}
    </div>
  );
}
