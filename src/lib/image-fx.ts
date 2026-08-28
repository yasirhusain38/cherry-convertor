import { drawCover, drawExact } from "./image";

export type NormRect = { x: number; y: number; w: number; h: number };

function ctx2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas is not supported in this browser.");
  return ctx;
}

export function cloneCanvas(source: CanvasImageSource, w: number, h: number): HTMLCanvasElement {
  return drawExact(source, w, h);
}

export function pixelateCanvas(canvas: HTMLCanvasElement, block: number): void {
  const ctx = ctx2d(canvas);
  const b = Math.max(2, Math.round(block));
  const smallW = Math.max(1, Math.ceil(canvas.width / b));
  const smallH = Math.max(1, Math.ceil(canvas.height / b));
  const tmp = document.createElement("canvas");
  tmp.width = smallW;
  tmp.height = smallH;
  const tctx = ctx2d(tmp);
  tctx.imageSmoothingEnabled = false;
  tctx.drawImage(canvas, 0, 0, smallW, smallH);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(tmp, 0, 0, smallW, smallH, 0, 0, canvas.width, canvas.height);
}

export function blurCanvas(canvas: HTMLCanvasElement, px: number): void {
  const ctx = ctx2d(canvas);
  const copy = document.createElement("canvas");
  copy.width = canvas.width;
  copy.height = canvas.height;
  ctx2d(copy).drawImage(canvas, 0, 0);
  ctx.filter = `blur(${Math.max(0, px)}px)`;
  ctx.drawImage(copy, 0, 0);
  ctx.filter = "none";
}

function applyRect(
  canvas: HTMLCanvasElement,
  rect: NormRect,
  paint: (slice: HTMLCanvasElement) => void,
): void {
  const x = Math.round(rect.x * canvas.width);
  const y = Math.round(rect.y * canvas.height);
  const w = Math.max(1, Math.round(rect.w * canvas.width));
  const h = Math.max(1, Math.round(rect.h * canvas.height));
  const slice = document.createElement("canvas");
  slice.width = w;
  slice.height = h;
  ctx2d(slice).drawImage(canvas, x, y, w, h, 0, 0, w, h);
  paint(slice);
  ctx2d(canvas).drawImage(slice, x, y);
}

export function mosaicRects(canvas: HTMLCanvasElement, rects: NormRect[], block: number): void {
  for (const rect of rects) applyRect(canvas, rect, (slice) => pixelateCanvas(slice, block));
}

export function blurRects(canvas: HTMLCanvasElement, rects: NormRect[], px: number): void {
  for (const rect of rects) applyRect(canvas, rect, (slice) => blurCanvas(slice, px));
}

export function sketchCanvas(canvas: HTMLCanvasElement): void {
  const ctx = ctx2d(canvas);
  const { width, height } = canvas;
  const src = ctx.getImageData(0, 0, width, height);
  const gray = new Uint8ClampedArray(width * height);
  for (let i = 0, p = 0; i < src.data.length; i += 4, p += 1) {
    gray[p] = Math.round(src.data[i] * 0.299 + src.data[i + 1] * 0.587 + src.data[i + 2] * 0.114);
  }
  const radius = Math.max(2, Math.round(Math.min(width, height) / 180));
  const blur = boxBlurGray(gray, width, height, radius);
  for (let i = 0, p = 0; i < src.data.length; i += 4, p += 1) {
    const g = gray[p];
    const b = 255 - blur[p];
    const dodge = b === 0 ? 255 : Math.min(255, Math.round((g * 255) / b));
    src.data[i] = src.data[i + 1] = src.data[i + 2] = dodge;
  }
  ctx.putImageData(src, 0, 0);
}

function boxBlurGray(src: Uint8ClampedArray, w: number, h: number, r: number): Uint8ClampedArray {
  const tmp = new Uint8ClampedArray(src.length);
  const out = new Uint8ClampedArray(src.length);
  const span = r * 2 + 1;
  for (let y = 0; y < h; y += 1) {
    let sum = 0;
    for (let x = -r; x <= r; x += 1) sum += src[y * w + clamp(x, 0, w - 1)];
    for (let x = 0; x < w; x += 1) {
      tmp[y * w + x] = Math.round(sum / span);
      sum += src[y * w + clamp(x + r + 1, 0, w - 1)] - src[y * w + clamp(x - r, 0, w - 1)];
    }
  }
  for (let x = 0; x < w; x += 1) {
    let sum = 0;
    for (let y = -r; y <= r; y += 1) sum += tmp[clamp(y, 0, h - 1) * w + x];
    for (let y = 0; y < h; y += 1) {
      out[y * w + x] = Math.round(sum / span);
      sum += tmp[clamp(y + r + 1, 0, h - 1) * w + x] - tmp[clamp(y - r, 0, h - 1) * w + x];
    }
  }
  return out;
}

function clamp(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n));
}

export function cartoonCanvas(canvas: HTMLCanvasElement): void {
  const ctx = ctx2d(canvas);
  const { width, height } = canvas;
  blurCanvas(canvas, Math.max(1, Math.round(Math.min(width, height) / 280)));
  const img = ctx.getImageData(0, 0, width, height);
  const data = img.data;
  const levels = 6;
  const step = 255 / (levels - 1);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.round(data[i] / step) * step;
    data[i + 1] = Math.round(data[i + 1] / step) * step;
    data[i + 2] = Math.round(data[i + 2] / step) * step;
  }
  const gray = new Uint8ClampedArray(width * height);
  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    gray[p] = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
  }
  const thresh = 28;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const gx =
        -gray[(y - 1) * width + (x - 1)] +
        gray[(y - 1) * width + (x + 1)] -
        2 * gray[y * width + (x - 1)] +
        2 * gray[y * width + (x + 1)] -
        gray[(y + 1) * width + (x - 1)] +
        gray[(y + 1) * width + (x + 1)];
      const gy =
        -gray[(y - 1) * width + (x - 1)] -
        2 * gray[(y - 1) * width + x] -
        gray[(y - 1) * width + (x + 1)] +
        gray[(y + 1) * width + (x - 1)] +
        2 * gray[(y + 1) * width + x] +
        gray[(y + 1) * width + (x + 1)];
      if (Math.abs(gx) + Math.abs(gy) > thresh) {
        const i = (y * width + x) * 4;
        data[i] = data[i + 1] = data[i + 2] = 20;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
}

export function addBorder(
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  widthPx: number,
  color: string,
): HTMLCanvasElement {
  const w = Math.max(1, Math.round(widthPx));
  const canvas = document.createElement("canvas");
  canvas.width = srcW + w * 2;
  canvas.height = srcH + w * 2;
  const ctx = ctx2d(canvas);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, w, w, srcW, srcH);
  return canvas;
}

export function roundedImage(
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  radius: number,
  circle: boolean,
): HTMLCanvasElement {
  const size = circle ? Math.min(srcW, srcH) : undefined;
  const canvas = document.createElement("canvas");
  canvas.width = size ?? srcW;
  canvas.height = size ?? srcH;
  const ctx = ctx2d(canvas);
  ctx.save();
  ctx.beginPath();
  if (circle) {
    const r = canvas.width / 2;
    ctx.arc(r, r, r, 0, Math.PI * 2);
  } else {
    const r = Math.max(0, Math.min(radius, Math.min(canvas.width, canvas.height) / 2));
    roundedRect(ctx, 0, 0, canvas.width, canvas.height, r);
  }
  ctx.clip();
  if (circle) {
    const cover = drawCover(source, srcW, srcH, canvas.width, canvas.height);
    ctx.drawImage(cover, 0, 0);
  } else {
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  }
  ctx.restore();
  return canvas;
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function splitCanvas(canvas: HTMLCanvasElement, rows: number, cols: number): HTMLCanvasElement[] {
  const r = Math.max(1, Math.round(rows));
  const c = Math.max(1, Math.round(cols));
  const tileW = Math.floor(canvas.width / c);
  const tileH = Math.floor(canvas.height / r);
  const tiles: HTMLCanvasElement[] = [];
  for (let y = 0; y < r; y += 1) {
    for (let x = 0; x < c; x += 1) {
      const tile = document.createElement("canvas");
      tile.width = tileW;
      tile.height = tileH;
      ctx2d(tile).drawImage(canvas, x * tileW, y * tileH, tileW, tileH, 0, 0, tileW, tileH);
      tiles.push(tile);
    }
  }
  return tiles;
}

export function joinCanvases(canvases: HTMLCanvasElement[], direction: "horizontal" | "vertical", fill = "#ffffff"): HTMLCanvasElement {
  if (!canvases.length) throw new Error("Add at least two images.");
  if (direction === "horizontal") {
    const height = Math.max(...canvases.map((c) => c.height));
    const width = canvases.reduce((s, c) => s + Math.round((c.width / c.height) * height), 0);
    const out = document.createElement("canvas");
    out.width = width;
    out.height = height;
    const ctx = ctx2d(out);
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, width, height);
    let x = 0;
    for (const c of canvases) {
      const w = Math.round((c.width / c.height) * height);
      ctx.drawImage(c, x, 0, w, height);
      x += w;
    }
    return out;
  }
  const width = Math.max(...canvases.map((c) => c.width));
  const height = canvases.reduce((s, c) => s + Math.round((c.height / c.width) * width), 0);
  const out = document.createElement("canvas");
  out.width = width;
  out.height = height;
  const ctx = ctx2d(out);
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, width, height);
  let y = 0;
  for (const c of canvases) {
    const h = Math.round((c.height / c.width) * width);
    ctx.drawImage(c, 0, y, width, h);
    y += h;
  }
  return out;
}

export type CollageLayout = "2x2" | "3x3" | "1x2" | "2x1" | "1x3";

export function collageCanvases(
  canvases: HTMLCanvasElement[],
  layout: CollageLayout,
  gap = 8,
  bg = "#221F1F",
): HTMLCanvasElement {
  const map: Record<CollageLayout, [number, number]> = {
    "2x2": [2, 2],
    "3x3": [3, 3],
    "1x2": [1, 2],
    "2x1": [2, 1],
    "1x3": [1, 3],
  };
  const [rows, cols] = map[layout];
  const cell = 640;
  const out = document.createElement("canvas");
  out.width = cols * cell + gap * (cols + 1);
  out.height = rows * cell + gap * (rows + 1);
  const ctx = ctx2d(out);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, out.width, out.height);
  for (let i = 0; i < rows * cols; i += 1) {
    const src = canvases[i];
    const r = Math.floor(i / cols);
    const c = i % cols;
    const x = gap + c * (cell + gap);
    const y = gap + r * (cell + gap);
    if (!src) {
      ctx.fillStyle = "#2c2a2a";
      ctx.fillRect(x, y, cell, cell);
      continue;
    }
    const cover = drawCover(src, src.width, src.height, cell, cell);
    ctx.drawImage(cover, x, y);
  }
  return out;
}

export function memeCanvas(source: CanvasImageSource, srcW: number, srcH: number, top: string, bottom: string): HTMLCanvasElement {
  const canvas = drawExact(source, srcW, srcH);
  const ctx = ctx2d(canvas);
  const size = Math.max(28, Math.round(canvas.width / 12));
  ctx.font = `900 ${size}px Impact, Haettenschweiler, "Arial Black", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(4, Math.round(size / 10));
  ctx.strokeStyle = "#000000";
  ctx.fillStyle = "#ffffff";
  const drawBlock = (text: string, yStart: number, fromBottom: boolean) => {
    const lines = wrapText(ctx, text.toUpperCase(), canvas.width * 0.92);
    const blockH = lines.length * size * 1.1;
    let y = fromBottom ? canvas.height - blockH - size * 0.25 : yStart;
    for (const line of lines) {
      const x = canvas.width / 2;
      ctx.strokeText(line, x, y);
      ctx.fillText(line, x, y);
      y += size * 1.1;
    }
  };
  if (top.trim()) drawBlock(top, size * 0.2, false);
  if (bottom.trim()) drawBlock(bottom, 0, true);
  return canvas;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const lines: string[] = [];
  let current = words[0];
  for (let i = 1; i < words.length; i += 1) {
    const test = `${current} ${words[i]}`;
    if (ctx.measureText(test).width <= maxW) current = test;
    else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
}

export async function detectFaces(bitmap: ImageBitmap): Promise<NormRect[]> {
  const Detector = (window as unknown as { FaceDetector?: new (opts?: { fastMode?: boolean }) => { detect: (src: ImageBitmap) => Promise<Array<{ boundingBox: DOMRectReadOnly }>> } }).FaceDetector;
  if (!Detector) return [];
  try {
    const detector = new Detector({ fastMode: true });
    const faces = await detector.detect(bitmap);
    return faces.map((f) => ({
      x: f.boundingBox.x / bitmap.width,
      y: f.boundingBox.y / bitmap.height,
      w: f.boundingBox.width / bitmap.width,
      h: f.boundingBox.height / bitmap.height,
    }));
  } catch {
    return [];
  }
}
