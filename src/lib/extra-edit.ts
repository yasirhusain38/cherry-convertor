import { applyAutoToCanvas } from "./grade";
import { detectFaces } from "./image-fx";
import { drawExact } from "./image";

export function upscaleBitmap(source: ImageBitmap, factor: 2 | 3 | 4): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(source.width * factor));
  canvas.height = Math.max(1, Math.round(source.height * factor));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  sharpenCanvas(canvas, 0.45 + factor * 0.08);
  return canvas;
}

export function extendBitmap(
  source: ImageBitmap,
  padPct: number,
  mode: "reflect" | "blur" | "color",
  color = "#ffffff",
): HTMLCanvasElement {
  const padX = Math.round(source.width * (padPct / 100));
  const padY = Math.round(source.height * (padPct / 100));
  const canvas = document.createElement("canvas");
  canvas.width = source.width + padX * 2;
  canvas.height = source.height + padY * 2;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser.");
  if (mode === "color") {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.filter = mode === "blur" ? `blur(${Math.max(8, Math.round(Math.min(padX, padY) * 0.4))}px)` : "none";
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    ctx.filter = "none";
  }
  ctx.drawImage(source, padX, padY);
  return canvas;
}

export function enhanceBitmap(source: ImageBitmap): HTMLCanvasElement {
  const canvas = drawExact(source, source.width, source.height);
  applyAutoToCanvas(canvas, "wb");
  applyAutoToCanvas(canvas, "contrast");
  sharpenCanvas(canvas, 0.55);
  return canvas;
}

function sharpenCanvas(canvas: HTMLCanvasElement, amount: number): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = image;
  const src = new Uint8ClampedArray(data);
  const k = amount;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const i = (y * width + x) * 4;
      for (let c = 0; c < 3; c += 1) {
        let blur = 0;
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            blur += src[((y + dy) * width + (x + dx)) * 4 + c];
          }
        }
        blur /= 9;
        data[i + c] = Math.max(0, Math.min(255, Math.round(src[i + c] + (src[i + c] - blur) * k)));
      }
    }
  }
  ctx.putImageData(image, 0, 0);
}

export async function blurFaces(
  source: ImageBitmap,
  radius = 18,
): Promise<{ canvas: HTMLCanvasElement; count: number }> {
  const canvas = drawExact(source, source.width, source.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser.");
  const faces = await detectFaces(source);
  for (const face of faces) {
    const pad = 0.12;
    const x = Math.max(0, Math.floor((face.x - pad * face.w) * canvas.width));
    const y = Math.max(0, Math.floor((face.y - pad * face.h) * canvas.height));
    const w = Math.min(canvas.width - x, Math.ceil(face.w * (1 + pad * 2) * canvas.width));
    const h = Math.min(canvas.height - y, Math.ceil(face.h * (1 + pad * 2) * canvas.height));
    if (w < 8 || h < 8) continue;
    const block = Math.max(8, Math.round(Math.min(w, h) / Math.max(4, 28 - radius)));
    const small = document.createElement("canvas");
    small.width = Math.max(1, Math.floor(w / block));
    small.height = Math.max(1, Math.floor(h / block));
    const sctx = small.getContext("2d");
    if (!sctx) continue;
    sctx.imageSmoothingEnabled = false;
    sctx.drawImage(canvas, x, y, w, h, 0, 0, small.width, small.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(small, x, y, w, h);
    ctx.imageSmoothingEnabled = true;
  }
  return { canvas, count: faces.length };
}

export function trimWhitespace(source: ImageBitmap, threshold = 248): HTMLCanvasElement {
  const src = drawExact(source, source.width, source.height);
  const ctx = src.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser.");
  const { data, width, height } = ctx.getImageData(0, 0, src.width, src.height);
  const isBlank = (i: number) => data[i] >= threshold && data[i + 1] >= threshold && data[i + 2] >= threshold;
  let top = 0;
  let bottom = height - 1;
  let left = 0;
  let right = width - 1;
  outerTop: for (; top < height; top += 1) {
    for (let x = 0; x < width; x += 1) if (!isBlank((top * width + x) * 4)) break outerTop;
  }
  outerBottom: for (; bottom > top; bottom -= 1) {
    for (let x = 0; x < width; x += 1) if (!isBlank((bottom * width + x) * 4)) break outerBottom;
  }
  outerLeft: for (; left < width; left += 1) {
    for (let y = top; y <= bottom; y += 1) if (!isBlank((y * width + left) * 4)) break outerLeft;
  }
  outerRight: for (; right > left; right -= 1) {
    for (let y = top; y <= bottom; y += 1) if (!isBlank((y * width + right) * 4)) break outerRight;
  }
  const w = Math.max(1, right - left + 1);
  const h = Math.max(1, bottom - top + 1);
  return cropFrom(src, left, top, w, h);
}

function cropFrom(source: HTMLCanvasElement, x: number, y: number, w: number, h: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser.");
  ctx.drawImage(source, x, y, w, h, 0, 0, w, h);
  return canvas;
}

export function addPhotoBorder(source: ImageBitmap, pct: number, color: string): HTMLCanvasElement {
  return extendBitmap(source, pct, "color", color);
}
