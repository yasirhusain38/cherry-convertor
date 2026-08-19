import type { ConvertFormat } from "./formats";
import { canvasToBlob, drawExact, resultFromCanvas, type ProcessResult } from "./image";
import { blobToDataUrl, imagesToPdf } from "./pdf";

function canvasToBmp(canvas: HTMLCanvasElement): Blob {
  const width = canvas.width;
  const height = canvas.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser.");
  const pixels = ctx.getImageData(0, 0, width, height).data;
  const rowSize = Math.ceil((width * 3) / 4) * 4;
  const pixelBytes = rowSize * height;
  const header = 54;
  const buffer = new ArrayBuffer(header + pixelBytes);
  const view = new DataView(buffer);
  view.setUint8(0, 0x42);
  view.setUint8(1, 0x4d);
  view.setUint32(2, header + pixelBytes, true);
  view.setUint32(10, header, true);
  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, -height, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, 24, true);
  view.setUint32(34, pixelBytes, true);
  const body = new Uint8Array(buffer, header);
  let offset = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      body[offset] = pixels[i + 2];
      body[offset + 1] = pixels[i + 1];
      body[offset + 2] = pixels[i];
      offset += 3;
    }
    offset += rowSize - width * 3;
  }
  return new Blob([buffer], { type: "image/bmp" });
}

async function canvasToIco(canvas: HTMLCanvasElement): Promise<Blob> {
  const size = Math.min(256, Math.max(canvas.width, canvas.height));
  const square = drawExact(canvas, size, size);
  const png = await canvasToBlob(square, "image/png");
  const pngBytes = new Uint8Array(await png.arrayBuffer());
  const header = new ArrayBuffer(22);
  const view = new DataView(header);
  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, 1, true);
  view.setUint8(6, size === 256 ? 0 : size);
  view.setUint8(7, size === 256 ? 0 : size);
  view.setUint16(10, 1, true);
  view.setUint16(12, 32, true);
  view.setUint32(14, pngBytes.length, true);
  view.setUint32(18, 22, true);
  return new Blob([header, pngBytes], { type: "image/x-icon" });
}

async function pngDataUrl(canvas: HTMLCanvasElement): Promise<string> {
  const png = await canvasToBlob(canvas, "image/png");
  return blobToDataUrl(png);
}

function wrapResult(blob: Blob, canvas: HTMLCanvasElement, mime: string): ProcessResult {
  return {
    blob,
    url: URL.createObjectURL(blob),
    width: canvas.width,
    height: canvas.height,
    bytes: blob.size,
    mime,
  };
}

export function isLossyFormat(id: string): boolean {
  return ["jpeg", "webp", "avif", "gif"].includes(id);
}

export async function canvasToFormat(
  canvas: HTMLCanvasElement,
  format: ConvertFormat,
  quality = 0.92,
): Promise<ProcessResult> {
  if (!format.supported) {
    throw new Error(
      `${format.label} cannot be encoded in the browser. Search JPG, PNG, WebP, BMP, GIF, AVIF, ICO, SVG, PDF, HTML, JSON, TXT, or MD.`,
    );
  }

  if (format.id === "bmp") return wrapResult(canvasToBmp(canvas), canvas, format.mime);
  if (format.id === "ico") {
    const blob = await canvasToIco(canvas);
    return {
      blob,
      url: URL.createObjectURL(blob),
      width: Math.min(256, canvas.width),
      height: Math.min(256, canvas.height),
      bytes: blob.size,
      mime: format.mime,
    };
  }
  if (format.id === "svg") {
    const dataUrl = await pngDataUrl(canvas);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}"><image href="${dataUrl}" width="${canvas.width}" height="${canvas.height}"/></svg>`;
    return wrapResult(new Blob([svg], { type: format.mime }), canvas, format.mime);
  }
  if (format.id === "pdf") {
    const jpeg = await resultFromCanvas(canvas, "image/jpeg", 0.92);
    const pdf = await imagesToPdf({
      images: [
        {
          dataUrl: await blobToDataUrl(jpeg.blob),
          width: jpeg.width,
          height: jpeg.height,
        },
      ],
    });
    URL.revokeObjectURL(jpeg.url);
    return wrapResult(pdf, canvas, format.mime);
  }
  if (format.id === "html") {
    const dataUrl = await pngDataUrl(canvas);
    const html = `<!doctype html><meta charset="utf-8"><title>Cherry Converter</title><img alt="" src="${dataUrl}" width="${canvas.width}" height="${canvas.height}">`;
    return wrapResult(new Blob([html], { type: format.mime }), canvas, format.mime);
  }
  if (format.id === "json") {
    const dataUrl = await pngDataUrl(canvas);
    const json = JSON.stringify(
      { width: canvas.width, height: canvas.height, mime: "image/png", dataUrl },
      null,
      2,
    );
    return wrapResult(new Blob([json], { type: format.mime }), canvas, format.mime);
  }
  if (format.id === "txt") {
    const dataUrl = await pngDataUrl(canvas);
    return wrapResult(new Blob([dataUrl], { type: format.mime }), canvas, format.mime);
  }
  if (format.id === "md") {
    const dataUrl = await pngDataUrl(canvas);
    const md = `![converted](${dataUrl})`;
    return wrapResult(new Blob([md], { type: format.mime }), canvas, format.mime);
  }

  try {
    return await resultFromCanvas(
      canvas,
      format.mime,
      format.id === "png" ? undefined : quality,
    );
  } catch {
    throw new Error(`This browser cannot encode ${format.label}. Try JPG, PNG, or WebP.`);
  }
}

export async function copyBlob(blob: Blob) {
  if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) {
    throw new Error("Clipboard copy is not available in this browser.");
  }
  const type = blob.type.startsWith("image/") ? blob.type : "text/plain";
  await navigator.clipboard.write([new ClipboardItem({ [type]: blob })]);
}
