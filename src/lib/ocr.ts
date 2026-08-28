import { rasterPdfOrImages } from "./pdf-ops";

export async function ocrCanvases(
  canvases: HTMLCanvasElement[],
  lang = "eng",
  onProgress?: (page: number, total: number, status: string) => void,
): Promise<string[]> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker(lang);
  try {
    const pages: string[] = [];
    for (let i = 0; i < canvases.length; i += 1) {
      onProgress?.(i + 1, canvases.length, "recognising");
      const { data } = await worker.recognize(canvases[i]);
      pages.push((data.text || "").trim());
    }
    return pages;
  } finally {
    await worker.terminate();
  }
}

export async function ocrFiles(
  files: File[],
  lang = "eng",
  onProgress?: (page: number, total: number, status: string) => void,
): Promise<{ pages: string[]; text: string }> {
  onProgress?.(0, 1, "rasterising");
  const rasters = await rasterPdfOrImages(files, 2);
  const pages = await ocrCanvases(
    rasters.map((p) => p.canvas),
    lang,
    onProgress,
  );
  return { pages, text: pages.filter(Boolean).join("\n\n") };
}
