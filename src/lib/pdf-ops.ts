import { PDFDocument } from "pdf-lib";
import { drawExact, fileToBitmap } from "./image";
import { rasterPdfPages, type PageCanvas } from "./pdf-raster";

export function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export function parsePageRanges(input: string, pageCount: number): number[] {
  const wanted = new Set<number>();
  for (const part of input.split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean)) {
    const m = part.match(/^(\d+)\s*[-–]\s*(\d+)$/);
    if (m) {
      const a = Math.min(Number(m[1]), Number(m[2]));
      const b = Math.max(Number(m[1]), Number(m[2]));
      for (let i = a; i <= b; i += 1) {
        if (i >= 1 && i <= pageCount) wanted.add(i);
      }
      continue;
    }
    const n = Number(part);
    if (Number.isInteger(n) && n >= 1 && n <= pageCount) wanted.add(n);
  }
  return [...wanted].sort((a, b) => a - b);
}

export async function loadPdf(file: File): Promise<PDFDocument> {
  return PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
}

function pdfBlob(bytes: Uint8Array): Blob {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return new Blob([copy], { type: "application/pdf" });
}

export async function mergePdfs(files: File[]): Promise<Blob> {
  if (!files.length) throw new Error("Add at least one PDF.");
  const out = await PDFDocument.create();
  for (const file of files) {
    const src = await loadPdf(file);
    const copied = await out.copyPages(src, src.getPageIndices());
    copied.forEach((page) => out.addPage(page));
  }
  return pdfBlob(await out.save());
}

export async function extractPdfPages(file: File, pages: number[]): Promise<Blob> {
  if (!pages.length) throw new Error("Pick at least one page.");
  const src = await loadPdf(file);
  const out = await PDFDocument.create();
  const indices = pages.map((n) => n - 1).filter((i) => i >= 0 && i < src.getPageCount());
  if (!indices.length) throw new Error("Those page numbers are not in this file.");
  const copied = await out.copyPages(src, indices);
  copied.forEach((page) => out.addPage(page));
  return pdfBlob(await out.save());
}

export async function splitPdfToFiles(file: File): Promise<Array<{ name: string; blob: Blob }>> {
  const src = await loadPdf(file);
  const count = src.getPageCount();
  const out: Array<{ name: string; blob: Blob }> = [];
  const base = file.name.replace(/\.pdf$/i, "") || "document";
  const pad = String(count).length;
  for (let i = 0; i < count; i += 1) {
    const doc = await PDFDocument.create();
    const [page] = await doc.copyPages(src, [i]);
    doc.addPage(page);
    out.push({
      name: `${base}-p${String(i + 1).padStart(pad, "0")}.pdf`,
      blob: pdfBlob(await doc.save()),
    });
  }
  return out;
}

export async function pdfPageCount(file: File): Promise<number> {
  const src = await loadPdf(file);
  return src.getPageCount();
}

type TextItem = { str: string; x: number; y: number; w: number; h: number };

async function pdfjsDocument(file: File) {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  const data = new Uint8Array(await file.arrayBuffer());
  return pdfjs.getDocument({ data }).promise;
}

function clusterLines(items: TextItem[], yTol: number): string[] {
  if (!items.length) return [];
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
  const lines: TextItem[][] = [];
  for (const item of sorted) {
    const last = lines[lines.length - 1];
    if (!last || Math.abs(last[0].y - item.y) > yTol) {
      lines.push([item]);
    } else {
      last.push(item);
    }
  }
  return lines.map((line) =>
    line
      .sort((a, b) => a.x - b.x)
      .map((i) => i.str)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim(),
  ).filter(Boolean);
}

export async function extractPdfText(file: File): Promise<{ pages: string[]; text: string; pageCount: number }> {
  const doc = await pdfjsDocument(file);
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i += 1) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const items: TextItem[] = [];
    for (const raw of content.items) {
      if (!("str" in raw) || !raw.str) continue;
      const t = raw.transform;
      items.push({
        str: raw.str,
        x: t[4],
        y: t[5],
        w: "width" in raw ? Number(raw.width) || 0 : 0,
        h: Math.abs(t[3] || t[0] || 10),
      });
    }
    const avgH = items.reduce((s, it) => s + it.h, 0) / Math.max(1, items.length);
    pages.push(clusterLines(items, Math.max(2, avgH * 0.45)).join("\n"));
  }
  return { pages, text: pages.join("\n\n"), pageCount: doc.numPages };
}

export type TableRow = string[];

export async function extractPdfTables(file: File): Promise<{ pages: TableRow[][]; pageCount: number }> {
  const doc = await pdfjsDocument(file);
  const pages: TableRow[][] = [];
  for (let i = 1; i <= doc.numPages; i += 1) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const items: TextItem[] = [];
    for (const raw of content.items) {
      if (!("str" in raw) || !raw.str.trim()) continue;
      const t = raw.transform;
      items.push({
        str: raw.str.trim(),
        x: t[4],
        y: t[5],
        w: "width" in raw ? Number(raw.width) || 0 : 0,
        h: Math.abs(t[3] || t[0] || 10),
      });
    }
    const avgH = items.reduce((s, it) => s + it.h, 0) / Math.max(1, items.length);
    const yTol = Math.max(2, avgH * 0.45);
    const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
    const lineItems: TextItem[][] = [];
    for (const item of sorted) {
      const last = lineItems[lineItems.length - 1];
      if (!last || Math.abs(last[0].y - item.y) > yTol) lineItems.push([item]);
      else last.push(item);
    }
    const xs = [...new Set(items.map((it) => Math.round(it.x / 12) * 12))].sort((a, b) => a - b);
    const rows: TableRow[] = lineItems.map((line) => {
      const cols = xs.map(() => "");
      for (const cell of line.sort((a, b) => a.x - b.x)) {
        let best = 0;
        let bestDist = Infinity;
        xs.forEach((x, idx) => {
          const d = Math.abs(cell.x - x);
          if (d < bestDist) {
            bestDist = d;
            best = idx;
          }
        });
        cols[best] = cols[best] ? `${cols[best]} ${cell.str}` : cell.str;
      }
      return cols;
    });
    pages.push(rows);
  }
  return { pages, pageCount: doc.numPages };
}

export async function rasterPdfOrImages(files: File[], scale = 1.6): Promise<PageCanvas[]> {
  const pages: PageCanvas[] = [];
  for (const file of files) {
    if (isPdfFile(file)) {
      pages.push(...(await rasterPdfPages(file, scale)));
    } else {
      const bitmap = await fileToBitmap(file);
      const canvas = drawExact(bitmap, bitmap.width, bitmap.height, "#ffffff");
      bitmap.close();
      pages.push({ canvas, width: canvas.width, height: canvas.height });
    }
  }
  return pages;
}
