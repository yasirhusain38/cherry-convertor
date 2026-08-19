import { clamp } from "./format";

export type OutputMime = "image/jpeg" | "image/png" | "image/webp";

export type ProcessResult = {
  blob: Blob;
  url: string;
  width: number;
  height: number;
  bytes: number;
  mime: string;
};

export function isHeic(file: File): boolean {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return (
    type.includes("heic") ||
    type.includes("heif") ||
    name.endsWith(".heic") ||
    name.endsWith(".heif")
  );
}

export function extForMime(mime: string): string {
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("pdf")) return "pdf";
  if (mime.includes("bmp")) return "bmp";
  if (mime.includes("svg")) return "svg";
  if (mime.includes("avif")) return "avif";
  if (mime.includes("gif")) return "gif";
  if (mime.includes("icon") || mime.includes("ico")) return "ico";
  return "jpg";
}

async function heicToJpeg(file: File): Promise<Blob> {
  const heic2any = (await import("heic2any")).default;
  const converted = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.92,
  });
  return Array.isArray(converted) ? converted[0] : converted;
}

function loadHtmlImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not decode that file as an image."));
    image.src = url;
  });
}

export async function fileToBitmap(file: File): Promise<ImageBitmap> {
  const blob: Blob = isHeic(file) ? await heicToJpeg(file) : file;
  try {
    return await createImageBitmap(blob);
  } catch {
    const url = URL.createObjectURL(blob);
    try {
      const image = await loadHtmlImage(url);
      return await createImageBitmap(image);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode image."))),
      type,
      quality,
    );
  });
}

export function drawCover(
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  destW: number,
  destH: number,
  fill?: string,
  zoom = 1,
  offsetX = 0,
  offsetY = 0,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(destW));
  canvas.height = Math.max(1, Math.round(destH));
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) throw new Error("Canvas is not supported in this browser.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  const scale = Math.max(canvas.width / srcW, canvas.height / srcH) * Math.max(1, zoom);
  const w = srcW * scale;
  const h = srcH * scale;
  const slackX = (canvas.width - w) / 2;
  const slackY = (canvas.height - h) / 2;
  const x = slackX + offsetX * Math.abs(slackX);
  const y = slackY + offsetY * Math.abs(slackY);
  ctx.drawImage(source, x, y, w, h);
  return canvas;
}

export function drawContain(
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  destW: number,
  destH: number,
  fill?: string,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(destW));
  canvas.height = Math.max(1, Math.round(destH));
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) throw new Error("Canvas is not supported in this browser.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  const scale = Math.min(canvas.width / srcW, canvas.height / srcH);
  const w = srcW * scale;
  const h = srcH * scale;
  const x = (canvas.width - w) / 2;
  const y = (canvas.height - h) / 2;
  ctx.drawImage(source, x, y, w, h);
  return canvas;
}

export function drawExact(
  source: CanvasImageSource,
  destW: number,
  destH: number,
  fill?: string,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(destW));
  canvas.height = Math.max(1, Math.round(destH));
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) throw new Error("Canvas is not supported in this browser.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export function cropSource(
  source: CanvasImageSource,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  destW?: number,
  destH?: number,
  fill?: string,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(destW ?? sw));
  canvas.height = Math.max(1, Math.round(destH ?? sh));
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) throw new Error("Canvas is not supported in this browser.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export async function resultFromCanvas(
  canvas: HTMLCanvasElement,
  mime: string,
  quality?: number,
): Promise<ProcessResult> {
  let blob = await canvasToBlob(canvas, mime, quality);
  if (mime === "image/jpeg") {
    blob = await setJpegDpi(blob, 72);
  }
  return {
    blob,
    url: URL.createObjectURL(blob),
    width: canvas.width,
    height: canvas.height,
    bytes: blob.size,
    mime,
  };
}

export async function encodeImage(options: {
  source: ImageBitmap;
  width?: number;
  height?: number;
  mime?: OutputMime;
  quality?: number;
  fill?: string;
}): Promise<ProcessResult> {
  const mime = options.mime ?? "image/jpeg";
  const width = options.width ?? options.source.width;
  const height = options.height ?? options.source.height;
  const canvas = drawExact(options.source, width, height, options.fill);
  return resultFromCanvas(canvas, mime, options.quality);
}

export async function compressToTargetBytes(options: {
  source: ImageBitmap;
  targetBytes: number;
  mime?: OutputMime;
  fill?: string;
}): Promise<ProcessResult> {
  const mime = options.mime ?? "image/jpeg";
  const target = Math.max(2 * 1024, options.targetBytes);
  let width = options.source.width;
  let height = options.source.height;
  let best: ProcessResult | null = null;

  for (let scalePass = 0; scalePass < 10; scalePass += 1) {
    const canvas = drawExact(options.source, width, height, options.fill);
    if (mime === "image/png") {
      const attempt = await resultFromCanvas(canvas, "image/png");
      if (attempt.bytes <= target) return attempt;
      best = attempt;
    } else {
      let lo = 0.04;
      let hi = 0.95;
      for (let i = 0; i < 10; i += 1) {
        const quality = (lo + hi) / 2;
        const attempt = await resultFromCanvas(canvas, mime, quality);
        if (attempt.bytes <= target) {
          if (best) URL.revokeObjectURL(best.url);
          best = attempt;
          lo = quality;
        } else {
          URL.revokeObjectURL(attempt.url);
          hi = quality;
        }
      }
      if (best && best.bytes <= target) return best;
    }

    const current = best?.bytes ?? Number.POSITIVE_INFINITY;
    const factor = Math.sqrt(target / current) * 0.9;
    const nextScale = clamp(Number.isFinite(factor) ? factor : 0.85, 0.45, 0.92);
    width = Math.max(32, Math.round(width * nextScale));
    height = Math.max(32, Math.round(height * nextScale));
  }

  if (!best) throw new Error("Could not reach the target file size.");
  return best;
}

export async function setJpegDpi(blob: Blob, dpi: number): Promise<Blob> {
  const buffer = new Uint8Array(await blob.arrayBuffer());
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return blob;

  for (let i = 2; i < buffer.length - 18; i += 1) {
    if (buffer[i] !== 0xff) continue;
    if (buffer[i + 1] !== 0xe0) continue;
    const isJfif =
      buffer[i + 4] === 0x4a &&
      buffer[i + 5] === 0x46 &&
      buffer[i + 6] === 0x49 &&
      buffer[i + 7] === 0x46 &&
      buffer[i + 8] === 0x00;
    if (!isJfif) continue;
    const density = clamp(Math.round(dpi), 1, 65535);
    buffer[i + 11] = 0x01;
    buffer[i + 12] = (density >> 8) & 0xff;
    buffer[i + 13] = density & 0xff;
    buffer[i + 14] = (density >> 8) & 0xff;
    buffer[i + 15] = density & 0xff;
    return new Blob([buffer], { type: "image/jpeg" });
  }
  return blob;
}

export async function setPngDpi(blob: Blob, dpi: number): Promise<Blob> {
  const ppm = Math.round(dpi / 0.0254);
  const src = new Uint8Array(await blob.arrayBuffer());
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < 8; i += 1) {
    if (src[i] !== signature[i]) return blob;
  }

  const phys = new Uint8Array(21);
  const view = new DataView(phys.buffer);
  view.setUint32(0, 9);
  phys[4] = 112;
  phys[5] = 72;
  phys[6] = 89;
  phys[7] = 115;
  view.setUint32(8, ppm);
  view.setUint32(12, ppm);
  phys[16] = 1;
  const crc = crc32(phys.subarray(4, 17));
  view.setUint32(17, crc);

  const ihdrEnd = 8 + 4 + 4 + 13 + 4;
  const out = new Uint8Array(src.length + phys.length);
  out.set(src.subarray(0, ihdrEnd), 0);
  out.set(phys, ihdrEnd);
  out.set(src.subarray(ihdrEnd), ihdrEnd + phys.length);
  return new Blob([out], { type: "image/png" });
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i += 1) {
    crc ^= data[i];
    for (let j = 0; j < 8; j += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function removeBackground(
  source: ImageBitmap,
  tolerance = 48,
  feather = 18,
): HTMLCanvasElement {
  const canvas = drawExact(source, source.width, source.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser.");
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = image;
  const sample = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    return [data[i], data[i + 1], data[i + 2]] as const;
  };

  const corners = [
    sample(2, 2),
    sample(width - 3, 2),
    sample(2, height - 3),
    sample(width - 3, height - 3),
  ];
  const bg = [0, 1, 2].map((c) =>
    Math.round(corners.reduce((sum, px) => sum + px[c], 0) / corners.length),
  );

  for (let i = 0; i < data.length; i += 4) {
    const dr = data[i] - bg[0];
    const dg = data[i + 1] - bg[1];
    const db = data[i + 2] - bg[2];
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);
    if (dist <= tolerance) {
      data[i + 3] = 0;
    } else if (dist < tolerance + feather) {
      data[i + 3] = Math.round(((dist - tolerance) / feather) * 255);
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

export function inkSignature(source: ImageBitmap, threshold = 186, ink = "#141212"): HTMLCanvasElement {
  const canvas = drawExact(source, source.width, source.height, "#ffffff");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser.");
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = image;
  for (let i = 0; i < data.length; i += 4) {
    const luma = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    if (luma > threshold) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = 255;
    } else {
      const n = Number.parseInt(ink.replace("#", ""), 16);
      data[i] = (n >> 16) & 255;
      data[i + 1] = (n >> 8) & 255;
      data[i + 2] = n & 255;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

export function revokeResult(result?: ProcessResult | null) {
  if (result?.url) URL.revokeObjectURL(result.url);
}

export function scaleToFit(
  srcW: number,
  srcH: number,
  maxW?: number,
  maxH?: number,
): { width: number; height: number } {
  let width = srcW;
  let height = srcH;
  if (maxW && width > maxW) {
    height = Math.round((height * maxW) / width);
    width = maxW;
  }
  if (maxH && height > maxH) {
    width = Math.round((width * maxH) / height);
    height = maxH;
  }
  return { width: Math.max(1, width), height: Math.max(1, height) };
}
