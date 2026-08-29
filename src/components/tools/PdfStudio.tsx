"use client";

import { useMemo, useState } from "react";
import { DropZone } from "@/components/DropZone";
import { downloadBlob } from "@/lib/download";
import { canvasToBlob } from "@/lib/image";
import { textToDocx, rowsToXlsx } from "@/lib/office";
import { ocrCanvases } from "@/lib/ocr";
import { stripPdfMetadata } from "@/lib/pdf-meta";
import {
  extractPdfPages,
  extractPdfTables,
  extractPdfText,
  mergePdfs,
  parsePageRanges,
  pdfPageCount,
  rasterPdfOrImages,
  splitPdfToFiles,
} from "@/lib/pdf-ops";
import type { ToolDef } from "@/lib/tools";
import JSZip from "jszip";

type Kind =
  | "merge"
  | "split"
  | "extract"
  | "png"
  | "text"
  | "word"
  | "excel"
  | "meta";

function kindOf(slug: string): Kind {
  if (slug.includes("metadata") || slug.includes("strip")) return "meta";
  if (slug.includes("merger") || slug.includes("merge")) return "merge";
  if (slug.includes("split")) return "split";
  if (slug.includes("extract")) return "extract";
  if (slug.includes("png")) return "png";
  if (slug.includes("excel")) return "excel";
  if (slug.includes("word")) return "word";
  return "text";
}

export function PdfStudio({ tool }: { tool: ToolDef }) {
  const kind = kindOf(tool.slug);
  const multiple = kind === "merge" || kind === "png";
  const [files, setFiles] = useState<File[]>([]);
  const [range, setRange] = useState("1-3");
  const [ocr, setOcr] = useState(kind === "word");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [pageCount, setPageCount] = useState<number | null>(null);

  const file = files[0] ?? null;

  async function onFiles(next: File[]) {
    setError(null);
    setPreview("");
    const list = multiple ? [...files, ...next] : next.slice(0, 1);
    setFiles(list);
    const first = list[0];
    if (first && kind !== "merge") {
      try {
        setPageCount(await pdfPageCount(first));
      } catch {
        setPageCount(null);
      }
    }
  }

  const hint = useMemo(() => {
    if (kind === "merge") return "Drop PDFs in order. Use Up/Down to reorder.";
    if (kind === "word") return "Text-based PDFs become a .docx. Scanned pages can be OCRed in this tab.";
    if (kind === "excel") return "Text is grouped into columns from its position on the page.";
    return "The file stays in this tab.";
  }, [kind]);

  async function run() {
    if (!files.length) return;
    setBusy(true);
    setError(null);
    setStatus("Working…");
    try {
      if (kind === "merge") {
        const blob = await mergePdfs(files);
        downloadBlob(blob, "merged.pdf");
        setStatus(`Merged ${files.length} files.`);
        return;
      }
      if (!file) return;
      if (kind === "meta") {
        const blob = await stripPdfMetadata(file);
        downloadBlob(blob, `${baseName(file)}-no-meta.pdf`);
        setStatus("Title, author, dates, and Info dictionary cleared in this tab. Encrypted files may fail.");
        return;
      }
      if (kind === "split") {
        const parts = await splitPdfToFiles(file);
        if (parts.length === 1) {
          downloadBlob(parts[0].blob, parts[0].name);
        } else {
          const zip = new JSZip();
          parts.forEach((p) => zip.file(p.name, p.blob));
          downloadBlob(await zip.generateAsync({ type: "blob" }), `${baseName(file)}-pages.zip`);
        }
        setStatus(`${parts.length} page file${parts.length === 1 ? "" : "s"}.`);
        return;
      }
      if (kind === "extract") {
        const count = pageCount ?? (await pdfPageCount(file));
        const pages = parsePageRanges(range, count);
        const blob = await extractPdfPages(file, pages);
        downloadBlob(blob, `${baseName(file)}-pages.pdf`);
        setStatus(`Extracted ${pages.length} page${pages.length === 1 ? "" : "s"}.`);
        return;
      }
      if (kind === "png") {
        setStatus("Rasterising…");
        const pages = await rasterPdfOrImages(files, 2);
        if (pages.length === 1) {
          downloadBlob(await canvasToBlob(pages[0].canvas, "image/png"), `${baseName(files[0])}.png`);
        } else {
          const zip = new JSZip();
          for (let i = 0; i < pages.length; i += 1) {
            zip.file(`page-${String(i + 1).padStart(2, "0")}.png`, await canvasToBlob(pages[i].canvas, "image/png"));
          }
          downloadBlob(await zip.generateAsync({ type: "blob" }), `${baseName(files[0])}-pages.zip`);
        }
        setStatus(`${pages.length} PNG${pages.length === 1 ? "" : "s"}.`);
        return;
      }
      if (kind === "excel") {
        const tables = await extractPdfTables(file);
        if (ocr && tables.pages.every((rows) => rows.every((r) => r.every((c) => !c)))) {
          setStatus("No text layer — OCRing…");
          const rasters = await rasterPdfOrImages([file], 2);
          const texts = await ocrCanvases(
            rasters.map((p) => p.canvas),
            "eng",
            (page, total) => setStatus(`OCR ${page}/${total}`),
          );
          const sheets = texts.map((t, i) => ({
            name: `Page ${i + 1}`,
            rows: t.split(/\n/).map((line) => line.split(/\s{2,}|\t/)),
          }));
          downloadBlob(await rowsToXlsx(sheets), `${baseName(file)}.xlsx`);
        } else {
          const sheets = tables.pages.map((rows, i) => ({ name: `Page ${i + 1}`, rows }));
          downloadBlob(await rowsToXlsx(sheets), `${baseName(file)}.xlsx`);
        }
        setStatus("Downloaded .xlsx");
        return;
      }

      let pages: string[] = [];
      const extracted = await extractPdfText(file);
      const empty = !extracted.text.trim();
      if (empty || (ocr && kind === "word")) {
        if (empty || ocr) {
          setStatus("OCRing scanned pages…");
          const rasters = await rasterPdfOrImages([file], 2);
          pages = await ocrCanvases(
            rasters.map((p) => p.canvas),
            "eng",
            (page, total) => setStatus(`OCR ${page}/${total}`),
          );
        }
      } else {
        pages = extracted.pages;
      }
      const text = pages.join("\n\n");
      setPreview(text.slice(0, 8000));
      if (kind === "word") {
        downloadBlob(await textToDocx(pages, file.name), `${baseName(file)}.docx`);
        setStatus("Downloaded .docx — text extraction, not a layout-perfect conversion.");
      } else {
        downloadBlob(new Blob([text], { type: "text/plain;charset=utf-8" }), `${baseName(file)}.txt`);
        setStatus("Downloaded .txt");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not process that PDF.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6">
      <DropZone
        multiple={multiple}
        media="pdf"
        label={multiple ? "Drop PDFs, or browse" : "Drop a PDF, or browse"}
        hint={hint}
        onFiles={onFiles}
      />
      {files.length ? (
        <ul className="card divide-y divide-[var(--line)]">
          {files.map((item, index) => (
            <li key={`${item.name}-${index}`} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
              <span>
                {String(index + 1).padStart(2, "0")}  /  {item.name}
                {pageCount && index === 0 && kind !== "merge" ? `  ·  ${pageCount} pages` : ""}
              </span>
              <span className="flex gap-3">
                {multiple ? (
                  <>
                    <button type="button" className="text-[#F5F5F1]" onClick={() => move(index, -1)}>
                      Up
                    </button>
                    <button type="button" className="text-[#F5F5F1]" onClick={() => move(index, 1)}>
                      Down
                    </button>
                  </>
                ) : null}
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
        {kind === "extract" ? (
          <label className="grid gap-2 text-sm">
            Pages
            <input
              className="field min-w-44"
              value={range}
              placeholder="1-3, 5, 8"
              onChange={(event) => setRange(event.target.value)}
            />
          </label>
        ) : null}
        {kind === "word" || kind === "excel" || kind === "text" ? (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={ocr} onChange={(event) => setOcr(event.target.checked)} />
            OCR scanned pages (English, on this device)
          </label>
        ) : null}
        <button type="button" className="btn btn-primary" disabled={!files.length || busy} onClick={run}>
          {busy ? "Working…" : actionLabel(kind)}
        </button>
        {files.length ? (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setFiles([]);
              setPreview("");
              setPageCount(null);
            }}
          >
            Clear
          </button>
        ) : null}
      </div>
      {status ? <p className="text-sm text-[var(--ink-soft)]">{status}</p> : null}
      {error ? <p className="text-sm text-brand">{error}</p> : null}
      {preview ? (
        <pre className="card max-h-[420px] overflow-auto p-5 text-sm leading-6 whitespace-pre-wrap">{preview}</pre>
      ) : null}
    </div>
  );

  function move(index: number, dir: number) {
    setFiles((prev) => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  }
}

function baseName(file: File) {
  return file.name.replace(/\.[^.]+$/, "") || "document";
}

function actionLabel(kind: Kind) {
  if (kind === "merge") return "Merge PDFs";
  if (kind === "split") return "Split pages";
  if (kind === "extract") return "Extract pages";
  if (kind === "png") return "Download PNG";
  if (kind === "word") return "Download Word";
  if (kind === "excel") return "Download Excel";
  if (kind === "meta") return "Strip metadata";
  return "Download text";
}
