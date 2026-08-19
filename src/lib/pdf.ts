import { jsPDF } from "jspdf";

type PageSize = "a4" | "letter" | "4x6";

const PAGE: Record<PageSize, { w: number; h: number }> = {
  a4: { w: 210, h: 297 },
  letter: { w: 215.9, h: 279.4 },
  "4x6": { w: 101.6, h: 152.4 },
};

export async function imagesToPdf(options: {
  images: Array<{ dataUrl: string; width: number; height: number }>;
  pageSize?: PageSize;
  marginMm?: number;
  filename?: string;
}): Promise<Blob> {
  const pageSize = options.pageSize ?? "a4";
  const margin = options.marginMm ?? 8;
  const first = options.images[0];
  if (!first) throw new Error("Add at least one image.");

  const landscape = first.width > first.height;
  const pdf = new jsPDF({
    unit: "mm",
    format: pageSize === "4x6" ? [PAGE[pageSize].w, PAGE[pageSize].h] : pageSize,
    orientation: landscape ? "landscape" : "portrait",
    compress: true,
  });

  options.images.forEach((image, index) => {
    if (index > 0) {
      const nextLandscape = image.width > image.height;
      pdf.addPage(
        pageSize === "4x6" ? [PAGE[pageSize].w, PAGE[pageSize].h] : pageSize,
        nextLandscape ? "landscape" : "portrait",
      );
    }
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const maxW = pageW - margin * 2;
    const maxH = pageH - margin * 2;
    const ratio = image.width / image.height;
    let w = maxW;
    let h = w / ratio;
    if (h > maxH) {
      h = maxH;
      w = h * ratio;
    }
    const x = (pageW - w) / 2;
    const y = (pageH - h) / 2;
    const format = image.dataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";
    pdf.addImage(image.dataUrl, format, x, y, w, h, undefined, "FAST");
  });

  return pdf.output("blob");
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(blob);
  });
}

export async function makePhotoSheet(options: {
  photoDataUrl: string;
  photoWmm: number;
  photoHmm: number;
  copies?: number;
  pageSize?: "a4" | "4x6";
}): Promise<Blob> {
  const page = PAGE[options.pageSize ?? "a4"];
  const copies = options.copies ?? 8;
  const gap = 3;
  const pdf = new jsPDF({
    unit: "mm",
    format: [page.w, page.h],
    orientation: "portrait",
    compress: true,
  });

  const cols = Math.max(1, Math.floor((page.w - 10 + gap) / (options.photoWmm + gap)));
  let x = 5;
  let y = 5;
  let col = 0;
  let rowH = options.photoHmm;

  for (let i = 0; i < copies; i += 1) {
    if (y + rowH > page.h - 5) break;
    pdf.addImage(
      options.photoDataUrl,
      "JPEG",
      x,
      y,
      options.photoWmm,
      options.photoHmm,
      undefined,
      "FAST",
    );
    col += 1;
    x += options.photoWmm + gap;
    if (col >= cols) {
      col = 0;
      x = 5;
      y += rowH + gap;
    }
  }

  return pdf.output("blob");
}
