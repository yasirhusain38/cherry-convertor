import { applyAutoToCanvas } from "./grade";
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
