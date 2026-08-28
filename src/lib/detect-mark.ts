import { clamp } from "./format";
import { emptyMask, growMask, tightenToOverlay, type Rect } from "./heal";

export type MarkRect = Rect & { score: number };

export type MarkPreset =
  | "auto"
  | "gemini"
  | "grok"
  | "imagen"
  | "tiktok"
  | "banner"
  | "subtitle"
  | "corners";

function lumaAt(data: Uint8ClampedArray, i: number): number {
  return 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
}

function blurLuma(luma: Float32Array, width: number, height: number, radius: number): Float32Array {
  const r = Math.max(1, radius);
  const tmp = new Float32Array(luma.length);
  const out = new Float32Array(luma.length);
  const span = r * 2 + 1;
  for (let y = 0; y < height; y += 1) {
    let sum = 0;
    for (let k = -r; k <= r; k += 1) sum += luma[y * width + clamp(k, 0, width - 1)];
    for (let x = 0; x < width; x += 1) {
      tmp[y * width + x] = sum / span;
      sum += luma[y * width + clamp(x + r + 1, 0, width - 1)];
      sum -= luma[y * width + clamp(x - r, 0, width - 1)];
    }
  }
  for (let x = 0; x < width; x += 1) {
    let sum = 0;
    for (let k = -r; k <= r; k += 1) sum += tmp[clamp(k, 0, height - 1) * width + x];
    for (let y = 0; y < height; y += 1) {
      out[y * width + x] = sum / span;
      sum += tmp[clamp(y + r + 1, 0, height - 1) * width + x];
      sum -= tmp[clamp(y - r, 0, height - 1) * width + x];
    }
  }
  return out;
}

export function overlayLiftMap(image: ImageData): { lift: Float32Array; luma: Float32Array } {
  const { data, width, height } = image;
  const luma = new Float32Array(width * height);
  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) luma[p] = lumaAt(data, i);
  const radius = Math.max(6, Math.round(Math.min(width, height) * 0.045));
  const blur = blurLuma(luma, width, height, radius);
  const lift = new Float32Array(width * height);
  for (let i = 0; i < lift.length; i += 1) lift[i] = luma[i] - blur[i];
  return { lift, luma };
}

type Blob = { pixels: number[]; x0: number; y0: number; x1: number; y1: number; score: number };

function flood(
  lift: Float32Array,
  width: number,
  height: number,
  seen: Uint8Array,
  sx: number,
  sy: number,
  thr: number,
  allow: (x: number, y: number) => boolean,
  maxPixels: number,
  maxRadius = 0,
): Blob | null {
  const pixels: number[] = [];
  const qx = [sx];
  const qy = [sy];
  seen[sy * width + sx] = 1;
  let x0 = sx;
  let y0 = sy;
  let x1 = sx;
  let y1 = sy;
  let energy = 0;
  const r2 = maxRadius > 0 ? maxRadius * maxRadius : 0;
  while (qx.length) {
    const x = qx.pop()!;
    const y = qy.pop()!;
    const i = y * width + x;
    pixels.push(i);
    energy += lift[i];
    if (pixels.length > maxPixels) return null;
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
    const step = (nx: number, ny: number) => {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) return;
      if (!allow(nx, ny)) return;
      if (r2 && (nx - sx) * (nx - sx) + (ny - sy) * (ny - sy) > r2) return;
      const ni = ny * width + nx;
      if (seen[ni] || lift[ni] < thr) return;
      seen[ni] = 1;
      qx.push(nx);
      qy.push(ny);
    };
    step(x - 1, y);
    step(x + 1, y);
    step(x, y - 1);
    step(x, y + 1);
  }
  return { pixels, x0, y0, x1, y1, score: energy / Math.max(1, pixels.length) };
}

function isLogoBlob(blob: Blob, width: number, height: number, boxArea: number): boolean {
  const bw = blob.x1 - blob.x0 + 1;
  const bh = blob.y1 - blob.y0 + 1;
  const area = blob.pixels.length;
  const side = Math.min(width, height);
  if (area < 18 || area > width * height * 0.018) return false;
  if (Math.max(bw, bh) > side * 0.2) return false;
  if (bw * bh > 0 && area / (bw * bh) < 0.12) return false;
  if (boxArea > 0 && area > boxArea * 0.45) return false;
  return true;
}

function searchBoxes(preset: MarkPreset, width: number, height: number): Rect[] {
  const box = (x: number, y: number, w: number, h: number): Rect => ({
    x: Math.round(x * width),
    y: Math.round(y * height),
    w: Math.round(w * width),
    h: Math.round(h * height),
  });
  switch (preset) {
    case "gemini":
    case "imagen":
    case "grok":
    case "auto":
      return [box(0.76, 0.78, 0.24, 0.22)];
    case "tiktok":
      return [box(0, 0.82, 0.36, 0.18), box(0.82, 0, 0.18, 0.16)];
    case "banner":
      return [box(0, 0.88, 1, 0.12)];
    case "subtitle":
      return [box(0.12, 0.82, 0.76, 0.14)];
    case "corners":
      return [box(0, 0, 0.2, 0.18), box(0.8, 0, 0.2, 0.18), box(0, 0.82, 0.2, 0.18), box(0.8, 0.82, 0.2, 0.18)];
    default:
      return [box(0.76, 0.78, 0.24, 0.22)];
  }
}

function inRect(x: number, y: number, box: Rect): boolean {
  return x >= box.x && y >= box.y && x < box.x + box.w && y < box.y + box.h;
}

function collectBlobs(
  lift: Float32Array,
  _luma: Float32Array,
  width: number,
  height: number,
  boxes: Rect[],
  preset: MarkPreset,
): Blob[] {
  const mag = new Float32Array(lift.length);
  for (let i = 0; i < lift.length; i += 1) mag[i] = Math.abs(lift[i]);
  const seen = new Uint8Array(width * height);
  const blobs: Blob[] = [];
  const maxPixels = Math.floor(width * height * 0.02);

  for (const box of boxes) {
    const samples: number[] = [];
    for (let y = box.y; y < box.y + box.h; y += 2) {
      for (let x = box.x; x < box.x + box.w; x += 2) {
        if (x < 0 || y < 0 || x >= width || y >= height) continue;
        samples.push(mag[y * width + x]);
      }
    }
    if (samples.length < 20) continue;
    samples.sort((a, b) => a - b);
    const p92 = samples[Math.floor(samples.length * 0.92)];
    const thr = Math.max(16, p92 * 0.9);
    const allow = (x: number, y: number) => inRect(x, y, box);
    const boxArea = Math.max(1, box.w * box.h);

    for (let y = box.y; y < box.y + box.h; y += 1) {
      for (let x = box.x; x < box.x + box.w; x += 1) {
        if (x < 0 || y < 0 || x >= width || y >= height) continue;
        const i = y * width + x;
        if (seen[i] || mag[i] < thr) continue;
        const blob = flood(mag, width, height, seen, x, y, thr, allow, maxPixels);
        if (blob && isLogoBlob(blob, width, height, boxArea) && blob.score >= 16) blobs.push(blob);
      }
    }
  }
  if (preset === "grok" || preset === "gemini" || preset === "imagen") {
    blobs.sort((a, b) => b.x0 + b.y0 - (a.x0 + a.y0));
    return blobs.slice(0, 1);
  }
  blobs.sort((a, b) => b.score * Math.sqrt(b.pixels.length) - a.score * Math.sqrt(a.pixels.length));
  return blobs.slice(0, 2);
}

export function detectMarks(image: ImageData): MarkRect[] {
  return buildWatermarkMask(image, "auto").rects;
}

export function presetRects(kind: MarkPreset, width: number, height: number): MarkRect[] {
  return searchBoxes(kind, width, height).map((box) => ({ ...box, score: 1 }));
}

export function selectOverlayAt(image: ImageData, x: number, y: number): Uint8Array {
  const { data, width, height } = image;
  const { lift } = overlayLiftMap(image);
  const mag = new Float32Array(lift.length);
  for (let i = 0; i < lift.length; i += 1) mag[i] = Math.abs(lift[i]);
  const sx = clamp(Math.round(x), 0, width - 1);
  const sy = clamp(Math.round(y), 0, height - 1);
  const side = Math.min(width, height);
  const rad = Math.max(22, Math.round(side * 0.08));
  const seed = (sy * width + sx) * 4;
  const sr = data[seed];
  const sg = data[seed + 1];
  const sb = data[seed + 2];
  const mask = emptyMask(width, height);
  for (let py = sy - rad; py <= sy + rad; py += 1) {
    for (let px = sx - rad; px <= sx + rad; px += 1) {
      if (px < 0 || py < 0 || px >= width || py >= height) continue;
      if ((px - sx) ** 2 + (py - sy) ** 2 > rad * rad) continue;
      const i = py * width + px;
      const p = i * 4;
      const colorDist = Math.hypot(data[p] - sr, data[p + 1] - sg, data[p + 2] - sb);
      if (mag[i] < 10 && colorDist > 48) continue;
      if (mag[i] >= 10 || colorDist < 36) mask[i] = 255;
    }
  }
  growMask(mask, width, height, 1);
  return mask;
}

export function buildWatermarkMask(
  image: ImageData,
  preset: MarkPreset,
): { mask: Uint8Array; rects: MarkRect[]; count: number } {
  const { width, height } = image;
  const { lift, luma } = overlayLiftMap(image);
  const boxes = searchBoxes(preset, width, height);
  const blobs = collectBlobs(lift, luma, width, height, boxes, preset);
  const coarse = emptyMask(width, height);
  if (blobs.length) {
    for (const blob of blobs) {
      for (const i of blob.pixels) coarse[i] = 255;
    }
    growMask(coarse, width, height, 1);
  } else {
    const box = boxes[0];
    if (box) {
      for (let y = box.y; y < box.y + box.h; y += 1) {
        for (let x = box.x; x < box.x + box.w; x += 1) {
          if (x >= 0 && y >= 0 && x < width && y < height) coarse[y * width + x] = 255;
        }
      }
    }
  }
  const mask = tightenToOverlay(image, coarse, 12);
  let count = 0;
  for (let i = 0; i < mask.length; i += 1) if (mask[i]) count += 1;
  const rects: MarkRect[] = blobs.map((blob) => ({
    x: blob.x0,
    y: blob.y0,
    w: blob.x1 - blob.x0 + 1,
    h: blob.y1 - blob.y0 + 1,
    score: blob.score,
  }));
  if (!rects.length && count) {
    rects.push({ x: boxes[0]?.x ?? 0, y: boxes[0]?.y ?? 0, w: boxes[0]?.w ?? 0, h: boxes[0]?.h ?? 0, score: 1 });
  }
  return { mask, rects, count };
}

export function rectsToMask(rects: MarkRect[], width: number, height: number): Uint8Array {
  const mask = emptyMask(width, height);
  for (const rect of rects) {
    const x0 = clamp(Math.floor(rect.x), 0, width - 1);
    const y0 = clamp(Math.floor(rect.y), 0, height - 1);
    const x1 = clamp(Math.ceil(rect.x + rect.w), 0, width);
    const y1 = clamp(Math.ceil(rect.y + rect.h), 0, height);
    for (let y = y0; y < y1; y += 1) {
      for (let x = x0; x < x1; x += 1) mask[y * width + x] = 255;
    }
  }
  return mask;
}

export function orMask(target: Uint8Array, extra: Uint8Array): void {
  const n = Math.min(target.length, extra.length);
  for (let i = 0; i < n; i += 1) if (extra[i]) target[i] = 255;
}
