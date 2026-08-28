import { drawExact, fileToBitmap } from "./image";

export type PageCanvas = { canvas: HTMLCanvasElement; width: number; height: number };

export async function rasterPdfPages(file: File, scale = 1.4): Promise<PageCanvas[]> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const pages: PageCanvas[] = [];
  for (let i = 1; i <= doc.numPages; i += 1) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not supported in this browser.");
    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    pages.push({ canvas, width: canvas.width, height: canvas.height });
  }
  return pages;
}

export async function filesToPageCanvases(files: File[]): Promise<PageCanvas[]> {
  const pages: PageCanvas[] = [];
  for (const file of files) {
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (isPdf) {
      pages.push(...(await rasterPdfPages(file)));
    } else {
      const bitmap = await fileToBitmap(file);
      const canvas = drawExact(bitmap, bitmap.width, bitmap.height, "#ffffff");
      bitmap.close();
      pages.push({ canvas, width: canvas.width, height: canvas.height });
    }
  }
  return pages;
}
