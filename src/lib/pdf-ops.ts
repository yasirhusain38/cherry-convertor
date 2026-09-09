import {
  BlendMode,
  PDFCheckBox,
  PDFDocument,
  PDFDropdown,
  PDFRadioGroup,
  PDFTextField,
  StandardFonts,
  degrees,
  rgb,
} from "pdf-lib";
import { canvasToBlob, drawExact, fileToBitmap } from "./image";
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

/** `order` is 1-based source pages. `0` inserts a blank page the same size as page 1. Duplicates allowed. */
export async function assemblePdfPages(file: File, order: number[]): Promise<Blob> {
  if (!order.length) throw new Error("Leave at least one page.");
  const src = await loadPdf(file);
  const out = await PDFDocument.create();
  const sample = src.getPage(0).getSize();
  for (const n of order) {
    if (n <= 0) {
      out.addPage([sample.width, sample.height]);
      continue;
    }
    const index = n - 1;
    if (index < 0 || index >= src.getPageCount()) continue;
    const [page] = await out.copyPages(src, [index]);
    out.addPage(page);
  }
  if (!out.getPageCount()) throw new Error("No pages left to save.");
  return pdfBlob(await out.save());
}

export async function watermarkPdf(
  file: File,
  options: { text: string; opacity?: number; size?: number; pages?: number[] },
): Promise<Blob> {
  const text = options.text.trim();
  if (!text) throw new Error("Type watermark text.");
  const src = await loadPdf(file);
  const font = await src.embedFont(StandardFonts.HelveticaBold);
  const size = options.size ?? 42;
  const opacity = options.opacity ?? 0.16;
  const widthOf = font.widthOfTextAtSize(text, size);
  const target = options.pages?.length ? new Set(options.pages.map((n) => n - 1)) : null;
  for (const i of src.getPageIndices()) {
    if (target && !target.has(i)) continue;
    const page = src.getPage(i);
    const { width, height } = page.getSize();
    page.drawText(text, {
      x: Math.max(24, (width - widthOf) / 2),
      y: height / 2 - size / 3,
      size,
      font,
      color: rgb(0.45, 0.45, 0.45),
      rotate: degrees(-32),
      opacity,
    });
  }
  return pdfBlob(await src.save());
}

export async function numberPdfPages(file: File): Promise<Blob> {
  const src = await loadPdf(file);
  const font = await src.embedFont(StandardFonts.Helvetica);
  const count = src.getPageCount();
  for (const i of src.getPageIndices()) {
    const page = src.getPage(i);
    const { width } = page.getSize();
    const label = `${i + 1} / ${count}`;
    const size = 10;
    const w = font.widthOfTextAtSize(label, size);
    page.drawText(label, {
      x: (width - w) / 2,
      y: 18,
      size,
      font,
      color: rgb(0.25, 0.25, 0.25),
    });
  }
  return pdfBlob(await src.save());
}

export async function cropPdfPages(
  file: File,
  box: { x: number; y: number; w: number; h: number },
  pages?: number[],
): Promise<Blob> {
  if (box.w < 0.05 || box.h < 0.05) throw new Error("Draw a larger crop box on the preview.");
  const src = await loadPdf(file);
  const target = pages?.length ? new Set(pages.map((n) => n - 1)) : null;
  for (const i of src.getPageIndices()) {
    if (target && !target.has(i)) continue;
    const page = src.getPage(i);
    const { width, height } = page.getSize();
    const x = box.x * width;
    const y = (1 - box.y - box.h) * height;
    const w = box.w * width;
    const h = box.h * height;
    page.setCropBox(x, y, w, h);
    page.setMediaBox(x, y, w, h);
  }
  return pdfBlob(await src.save());
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

export async function deletePdfPages(file: File, remove: number[]): Promise<Blob> {
  const src = await loadPdf(file);
  const drop = new Set(remove.map((n) => n - 1));
  const keep = src.getPageIndices().filter((i) => !drop.has(i));
  if (!keep.length) throw new Error("That would delete every page. Leave at least one.");
  const out = await PDFDocument.create();
  const copied = await out.copyPages(src, keep);
  copied.forEach((page) => out.addPage(page));
  return pdfBlob(await out.save());
}

export async function rotatePdfPages(file: File, angle: 90 | 180 | 270, pages?: number[]): Promise<Blob> {
  const src = await loadPdf(file);
  const target = pages?.length
    ? new Set(pages.map((n) => n - 1))
    : new Set(src.getPageIndices());
  for (const i of src.getPageIndices()) {
    if (!target.has(i)) continue;
    const page = src.getPage(i);
    const current = page.getRotation().angle;
    page.setRotation(degrees((current + angle) % 360));
  }
  return pdfBlob(await src.save());
}

export async function flattenPdf(file: File): Promise<Blob> {
  const src = await loadPdf(file);
  try {
    src.getForm().flatten();
  } catch {
    /* no AcroForm */
  }
  return pdfBlob(await src.save());
}

export async function stampSignature(options: {
  pdf: File;
  signature: File;
  widthMm: number;
  marginMm: number;
  corner: "br" | "bl" | "tr" | "tl";
  allPages: boolean;
}): Promise<Blob> {
  const src = await loadPdf(options.pdf);
  const bitmap = await fileToBitmap(options.signature);
  const canvas = drawExact(bitmap, bitmap.width, bitmap.height);
  bitmap.close();
  const png = await canvasToBlob(canvas, "image/png");
  const image = await src.embedPng(new Uint8Array(await png.arrayBuffer()));
  const widthPt = (options.widthMm / 25.4) * 72;
  const heightPt = (image.height / image.width) * widthPt;
  const margin = (options.marginMm / 25.4) * 72;
  const indices = options.allPages ? src.getPageIndices() : [src.getPageCount() - 1];
  for (const i of indices) {
    const page = src.getPage(i);
    const { width, height } = page.getSize();
    const x =
      options.corner === "bl" || options.corner === "tl" ? margin : width - margin - widthPt;
    const y =
      options.corner === "bl" || options.corner === "br" ? margin : height - margin - heightPt;
    page.drawImage(image, { x, y, width: widthPt, height: heightPt });
  }
  return pdfBlob(await src.save());
}

export type PdfFormField = { name: string; type: "text" | "check" | "choice"; value: string };

export async function listPdfFields(file: File): Promise<PdfFormField[]> {
  const src = await loadPdf(file);
  let form;
  try {
    form = src.getForm();
  } catch {
    return [];
  }
  const out: PdfFormField[] = [];
  for (const field of form.getFields()) {
    const name = field.getName();
    if (field instanceof PDFTextField) {
      out.push({ name, type: "text", value: field.getText() ?? "" });
    } else if (field instanceof PDFCheckBox) {
      out.push({ name, type: "check", value: field.isChecked() ? "yes" : "" });
    } else if (field instanceof PDFDropdown) {
      out.push({ name, type: "choice", value: field.getSelected()[0] ?? "" });
    } else if (field instanceof PDFRadioGroup) {
      out.push({ name, type: "choice", value: field.getSelected() ?? "" });
    }
  }
  return out;
}

export async function fillPdfFields(
  file: File,
  values: Record<string, string>,
  overlay?: { text: string; page: number },
): Promise<Blob> {
  const src = await loadPdf(file);
  try {
    const form = src.getForm();
    for (const [name, value] of Object.entries(values)) {
      try {
        const field = form.getField(name);
        if (field instanceof PDFTextField) field.setText(value);
        else if (field instanceof PDFCheckBox) {
          if (value && value !== "no" && value !== "false") field.check();
          else field.uncheck();
        } else if (field instanceof PDFDropdown || field instanceof PDFRadioGroup) {
          if (value) field.select(value);
        }
      } catch {
        /* skip unknown widgets */
      }
    }
    form.updateFieldAppearances();
  } catch {
    /* no form */
  }
  if (overlay?.text.trim()) {
    const font = await src.embedFont(StandardFonts.Helvetica);
    const page = src.getPage(Math.max(0, overlay.page - 1));
    page.drawText(overlay.text.trim(), {
      x: 48,
      y: 36,
      size: 11,
      font,
      color: rgb(0.13, 0.12, 0.12),
    });
  }
  return pdfBlob(await src.save());
}

export type RedactBox = { page: number; x: number; y: number; w: number; h: number };

export async function redactPdf(file: File, boxes: RedactBox[]): Promise<Blob> {
  if (!boxes.length) throw new Error("Draw at least one black box on the preview.");
  const src = await loadPdf(file);
  for (const box of boxes) {
    const page = src.getPage(Math.max(0, box.page - 1));
    const { width, height } = page.getSize();
    page.drawRectangle({
      x: box.x * width,
      y: (1 - box.y - box.h) * height,
      width: box.w * width,
      height: box.h * height,
      color: rgb(0, 0, 0),
    });
  }
  return pdfBlob(await src.save());
}

export type PaperFormat = "a4" | "letter" | "legal";

const PAPER: Record<PaperFormat, { w: number; h: number }> = {
  a4: { w: 595.28, h: 841.89 },
  letter: { w: 612, h: 792 },
  legal: { w: 612, h: 1008 },
};

export async function fitPdfPageSize(file: File, format: PaperFormat): Promise<Blob> {
  const src = await loadPdf(file);
  const out = await PDFDocument.create();
  const target = PAPER[format];
  for (const i of src.getPageIndices()) {
    const embedded = await out.embedPage(src.getPage(i));
    const { width, height } = embedded;
    const page = out.addPage([target.w, target.h]);
    const scale = Math.min(target.w / width, target.h / height);
    const w = width * scale;
    const h = height * scale;
    page.drawPage(embedded, {
      x: (target.w - w) / 2,
      y: (target.h - h) / 2,
      xScale: scale,
      yScale: scale,
    });
  }
  return pdfBlob(await out.save());
}

export async function extractPdfImages(file: File): Promise<Array<{ name: string; blob: Blob }>> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const out: Array<{ name: string; blob: Blob }> = [];
  let n = 1;
  for (let i = 1; i <= doc.numPages; i += 1) {
    const page = await doc.getPage(i);
    const ops = await page.getOperatorList();
    const paint = pdfjs.OPS.paintImageXObject;
    const names = new Set<string>();
    for (let j = 0; j < ops.fnArray.length; j += 1) {
      if (ops.fnArray[j] !== paint) continue;
      const name = ops.argsArray[j]?.[0];
      if (typeof name === "string") names.add(name);
    }
    for (const name of names) {
      try {
        const img = await Promise.race([
          new Promise<{ width: number; height: number; data?: Uint8ClampedArray | Uint8Array }>((resolve, reject) => {
            try {
              page.objs.get(name, (obj: unknown) => {
                if (obj && typeof obj === "object" && "width" in obj) {
                  resolve(obj as { width: number; height: number; data?: Uint8ClampedArray | Uint8Array });
                } else reject(new Error("skip"));
              });
            } catch (err) {
              reject(err);
            }
          }),
          new Promise<never>((_, reject) => {
            window.setTimeout(() => reject(new Error("skip")), 1200);
          }),
        ]);
        if (!img.data || !img.width || !img.height) continue;
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;
        const pixels = ctx.createImageData(img.width, img.height);
        const src = img.data;
        if (src.length === img.width * img.height * 4) {
          pixels.data.set(src);
        } else if (src.length === img.width * img.height * 3) {
          for (let p = 0, q = 0; p < pixels.data.length; p += 4, q += 3) {
            pixels.data[p] = src[q] ?? 0;
            pixels.data[p + 1] = src[q + 1] ?? 0;
            pixels.data[p + 2] = src[q + 2] ?? 0;
            pixels.data[p + 3] = 255;
          }
        } else continue;
        ctx.putImageData(pixels, 0, 0);
        const blob = await canvasToBlob(canvas, "image/png");
        out.push({ name: `image-${String(n).padStart(2, "0")}.png`, blob });
        n += 1;
      } catch {
        /* skip this xobject */
      }
    }
  }
  if (!out.length) {
    const pages = await rasterPdfPages(file, 1.6);
    for (let i = 0; i < pages.length; i += 1) {
      out.push({
        name: `page-${String(i + 1).padStart(2, "0")}.png`,
        blob: await canvasToBlob(pages[i].canvas, "image/png"),
      });
    }
  }
  return out;
}

export async function highlightPdf(file: File, boxes: RedactBox[]): Promise<Blob> {
  if (!boxes.length) throw new Error("Draw at least one highlight on the preview.");
  const src = await loadPdf(file);
  for (const box of boxes) {
    const page = src.getPage(Math.max(0, box.page - 1));
    const { width, height } = page.getSize();
    page.drawRectangle({
      x: box.x * width,
      y: (1 - box.y - box.h) * height,
      width: box.w * width,
      height: box.h * height,
      color: rgb(1, 0.92, 0.18),
      opacity: 0.42,
      blendMode: BlendMode.Multiply,
    });
  }
  return pdfBlob(await src.save());
}

function canvasToGrayscale(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = img.data;
  for (let i = 0; i < data.length; i += 4) {
    const y = 0.2126 * (data[i] ?? 0) + 0.7152 * (data[i + 1] ?? 0) + 0.0722 * (data[i + 2] ?? 0);
    data[i] = y;
    data[i + 1] = y;
    data[i + 2] = y;
  }
  ctx.putImageData(img, 0, 0);
}

/** Raster rebuild as grayscale JPEG. Selectable text on converted pages is gone — that is the honest path. */
export async function grayscalePdf(file: File, pages?: number[]): Promise<Blob> {
  const rasters = await rasterPdfPages(file, 1.55);
  const src = await loadPdf(file);
  const out = await PDFDocument.create();
  const target = pages?.length ? new Set(pages.map((n) => n - 1)) : null;
  for (let i = 0; i < rasters.length; i += 1) {
    if (target && !target.has(i)) {
      const [page] = await out.copyPages(src, [i]);
      out.addPage(page);
      continue;
    }
    const canvas = rasters[i].canvas;
    canvasToGrayscale(canvas);
    const jpeg = await canvasToBlob(canvas, "image/jpeg", 0.82);
    const image = await out.embedJpg(new Uint8Array(await jpeg.arrayBuffer()));
    const { width, height } = src.getPage(i).getSize();
    const page = out.addPage([width, height]);
    page.drawImage(image, { x: 0, y: 0, width, height });
  }
  if (!out.getPageCount()) throw new Error("No pages to convert.");
  return pdfBlob(await out.save());
}

/** Consecutive pages on one sheet (2-up). Vectors are embedded, not rasterised. */
export async function nUpPdf(file: File, n = 2): Promise<Blob> {
  const cols = n === 2 ? 2 : Math.max(2, Math.min(4, n));
  const src = await loadPdf(file);
  const out = await PDFDocument.create();
  const count = src.getPageCount();
  for (let i = 0; i < count; i += cols) {
    const group = src.getPageIndices().slice(i, i + cols);
    const sizes = group.map((idx) => src.getPage(idx).getSize());
    const cellW = Math.max(...sizes.map((s) => s.width));
    const cellH = Math.max(...sizes.map((s) => s.height));
    const sheet = out.addPage([cellW * cols, cellH]);
    for (let c = 0; c < group.length; c += 1) {
      const [embedded] = await out.embedPdf(src, [group[c]]);
      const { width, height } = sizes[c];
      sheet.drawPage(embedded, {
        x: cellW * c + (cellW - width) / 2,
        y: (cellH - height) / 2,
      });
    }
  }
  return pdfBlob(await out.save());
}

export async function insertImagesIntoPdf(file: File, images: File[], afterPage: number): Promise<Blob> {
  if (!images.length) throw new Error("Drop at least one image to insert.");
  const src = await loadPdf(file);
  const out = await PDFDocument.create();
  const count = src.getPageCount();
  const at = Math.max(0, Math.min(afterPage, count));
  const sample = src.getPage(0).getSize();

  async function addImages() {
    for (const image of images) {
      const bitmap = await fileToBitmap(image);
      const canvas = drawExact(bitmap, bitmap.width, bitmap.height, "#ffffff");
      bitmap.close();
      const png = await canvasToBlob(canvas, "image/png");
      const embedded = await out.embedPng(new Uint8Array(await png.arrayBuffer()));
      const page = out.addPage([sample.width, sample.height]);
      const scale = Math.min(sample.width / embedded.width, sample.height / embedded.height) * 0.92;
      const w = embedded.width * scale;
      const h = embedded.height * scale;
      page.drawImage(embedded, {
        x: (sample.width - w) / 2,
        y: (sample.height - h) / 2,
        width: w,
        height: h,
      });
    }
  }

  if (at > 0) {
    const head = await out.copyPages(src, src.getPageIndices().slice(0, at));
    head.forEach((page) => out.addPage(page));
  }
  await addImages();
  if (at < count) {
    const tail = await out.copyPages(src, src.getPageIndices().slice(at));
    tail.forEach((page) => out.addPage(page));
  }
  return pdfBlob(await out.save());
}

export function canvasIsBlank(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let ink = 0;
  let n = 0;
  for (let i = 0; i < data.length; i += 16) {
    n += 1;
    const y = 0.2126 * (data[i] ?? 0) + 0.7152 * (data[i + 1] ?? 0) + 0.0722 * (data[i + 2] ?? 0);
    if ((data[i + 3] ?? 0) > 8 && y < 242) ink += 1;
  }
  return n > 0 && ink / n < 0.008;
}

/** 1-based page numbers that raster as nearly empty (white / no ink). */
export async function detectBlankPdfPages(file: File): Promise<number[]> {
  const pages = await rasterPdfPages(file, 0.32);
  const blanks: number[] = [];
  pages.forEach((page, i) => {
    if (canvasIsBlank(page.canvas)) blanks.push(i + 1);
  });
  return blanks;
}

export async function reversePdfPages(file: File): Promise<Blob> {
  const src = await loadPdf(file);
  const out = await PDFDocument.create();
  const copied = await out.copyPages(src, [...src.getPageIndices()].reverse());
  copied.forEach((page) => out.addPage(page));
  return pdfBlob(await out.save());
}

/** One landscape sheet per page pair: A on the left, B on the right. Visual, not a legal redline. */
export async function comparePdfsSideBySide(leftFile: File, rightFile: File): Promise<Blob> {
  const left = await loadPdf(leftFile);
  const right = await loadPdf(rightFile);
  const out = await PDFDocument.create();
  const n = Math.max(left.getPageCount(), right.getPageCount());
  for (let i = 0; i < n; i += 1) {
    const lw = i < left.getPageCount() ? left.getPage(i).getSize().width : 612;
    const lh = i < left.getPageCount() ? left.getPage(i).getSize().height : 792;
    const rw = i < right.getPageCount() ? right.getPage(i).getSize().width : 612;
    const rh = i < right.getPageCount() ? right.getPage(i).getSize().height : 792;
    const cellW = Math.max(lw, rw);
    const cellH = Math.max(lh, rh);
    const sheet = out.addPage([cellW * 2, cellH]);
    if (i < left.getPageCount()) {
      const [embedded] = await out.embedPdf(left, [i]);
      sheet.drawPage(embedded, { x: (cellW - lw) / 2, y: (cellH - lh) / 2 });
    }
    if (i < right.getPageCount()) {
      const [embedded] = await out.embedPdf(right, [i]);
      sheet.drawPage(embedded, { x: cellW + (cellW - rw) / 2, y: (cellH - rh) / 2 });
    }
  }
  return pdfBlob(await out.save());
}
