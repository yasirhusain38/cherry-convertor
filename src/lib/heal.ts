import { clamp } from "./format";

export type Rect = { x: number; y: number; w: number; h: number };

export function emptyMask(width: number, height: number): Uint8Array {
  return new Uint8Array(width * height);
}

export function paintBrush(
  mask: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number,
  radius: number,
  value = 255,
): void {
  const r = Math.max(1, Math.round(radius));
  const x0 = clamp(Math.round(x) - r, 0, width - 1);
  const x1 = clamp(Math.round(x) + r, 0, width - 1);
  const y0 = clamp(Math.round(y) - r, 0, height - 1);
  const y1 = clamp(Math.round(y) + r, 0, height - 1);
  const r2 = r * r;
  const cx = Math.round(x);
  const cy = Math.round(y);
  for (let py = y0; py <= y1; py += 1) {
    for (let px = x0; px <= x1; px += 1) {
      const dx = px - cx;
      const dy = py - cy;
      if (dx * dx + dy * dy <= r2) mask[py * width + px] = value;
    }
  }
}

export function paintRect(
  mask: Uint8Array,
  width: number,
  height: number,
  rect: Rect,
  value = 255,
): void {
  const x0 = clamp(Math.floor(rect.x), 0, width - 1);
  const y0 = clamp(Math.floor(rect.y), 0, height - 1);
  const x1 = clamp(Math.ceil(rect.x + rect.w), 0, width);
  const y1 = clamp(Math.ceil(rect.y + rect.h), 0, height);
  for (let y = y0; y < y1; y += 1) {
    const row = y * width;
    for (let x = x0; x < x1; x += 1) mask[row + x] = value;
  }
}

export function maskBounds(mask: Uint8Array, width: number, height: number): Rect | null {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    const row = y * width;
    for (let x = 0; x < width; x += 1) {
      if (!mask[row + x]) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

export function maskHasPaint(mask: Uint8Array): boolean {
  for (let i = 0; i < mask.length; i += 1) {
    if (mask[i]) return true;
  }
  return false;
}

export function cloneMask(mask: Uint8Array): Uint8Array {
  return new Uint8Array(mask);
}

export function wandSelect(
  image: ImageData,
  mask: Uint8Array,
  x: number,
  y: number,
  tolerance: number,
  additive = true,
): void {
  const { data, width, height } = image;
  const sx = clamp(Math.round(x), 0, width - 1);
  const sy = clamp(Math.round(y), 0, height - 1);
  const seed = (sy * width + sx) * 4;
  const kr = data[seed];
  const kg = data[seed + 1];
  const kb = data[seed + 2];
  const seen = new Uint8Array(width * height);
  const qx = new Int32Array(width * height);
  const qy = new Int32Array(width * height);
  let head = 0;
  let tail = 0;
  seen[sy * width + sx] = 1;
  qx[0] = sx;
  qy[0] = sy;
  tail = 1;
  const tol = Math.max(4, tolerance);
  if (!additive) mask.fill(0);

  while (head < tail) {
    const px = qx[head];
    const py = qy[head];
    head += 1;
    const i = py * width + px;
    const p = i * 4;
    const dist = Math.hypot(data[p] - kr, data[p + 1] - kg, data[p + 2] - kb);
    if (dist > tol) continue;
    mask[i] = 255;
    if (px > 0 && !seen[i - 1]) {
      seen[i - 1] = 1;
      qx[tail] = px - 1;
      qy[tail] = py;
      tail += 1;
    }
    if (px + 1 < width && !seen[i + 1]) {
      seen[i + 1] = 1;
      qx[tail] = px + 1;
      qy[tail] = py;
      tail += 1;
    }
    if (py > 0 && !seen[i - width]) {
      seen[i - width] = 1;
      qx[tail] = px;
      qy[tail] = py - 1;
      tail += 1;
    }
    if (py + 1 < height && !seen[i + width]) {
      seen[i + width] = 1;
      qx[tail] = px;
      qy[tail] = py + 1;
      tail += 1;
    }
  }
}

export function growMask(mask: Uint8Array, width: number, height: number, radius = 2): void {
  const copy = new Uint8Array(mask);
  const r = Math.max(1, Math.round(radius));
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!copy[y * width + x]) continue;
      const x0 = Math.max(0, x - r);
      const x1 = Math.min(width - 1, x + r);
      const y0 = Math.max(0, y - r);
      const y1 = Math.min(height - 1, y + r);
      for (let py = y0; py <= y1; py += 1) {
        for (let px = x0; px <= x1; px += 1) mask[py * width + px] = 255;
      }
    }
  }
}

function maskArea(mask: Uint8Array): number {
  let n = 0;
  for (let i = 0; i < mask.length; i += 1) if (mask[i]) n += 1;
  return n;
}

function downsample(image: ImageData, mask: Uint8Array, scale: number): {
  image: ImageData;
  mask: Uint8Array;
} {
  const w = Math.max(2, Math.round(image.width / scale));
  const h = Math.max(2, Math.round(image.height / scale));
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { image, mask };
  ctx.putImageData(image, 0, 0);
  const small = document.createElement("canvas");
  small.width = w;
  small.height = h;
  const sctx = small.getContext("2d");
  if (!sctx) return { image, mask };
  sctx.imageSmoothingEnabled = true;
  sctx.drawImage(canvas, 0, 0, w, h);
  const nextImage = sctx.getImageData(0, 0, w, h);
  const nextMask = emptyMask(w, h);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const sx = Math.min(image.width - 1, Math.round(x * scale));
      const sy = Math.min(image.height - 1, Math.round(y * scale));
      if (mask[sy * image.width + sx]) nextMask[y * w + x] = 255;
    }
  }
  return { image: nextImage, mask: nextMask };
}

function upsampleFill(small: ImageData, image: ImageData, mask: Uint8Array): void {
  const canvas = document.createElement("canvas");
  canvas.width = small.width;
  canvas.height = small.height;
  canvas.getContext("2d")?.putImageData(small, 0, 0);
  const big = document.createElement("canvas");
  big.width = image.width;
  big.height = image.height;
  const ctx = big.getContext("2d");
  if (!ctx) return;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(canvas, 0, 0, image.width, image.height);
  const up = ctx.getImageData(0, 0, image.width, image.height);
  for (let i = 0; i < mask.length; i += 1) {
    if (!mask[i]) continue;
    const p = i * 4;
    image.data[p] = up.data[p];
    image.data[p + 1] = up.data[p + 1];
    image.data[p + 2] = up.data[p + 2];
    image.data[p + 3] = up.data[p + 3];
  }
}

/** Telea-style fill: process the hole from the boundary inward. */
function telea(image: ImageData, mask: Uint8Array, radius: number): void {
  const { data, width, height } = image;
  const known = new Uint8Array(width * height);
  for (let i = 0; i < mask.length; i += 1) known[i] = mask[i] ? 0 : 1;

  const dist = new Int32Array(width * height);
  dist.fill(1_000_000);
  const q: number[] = [];
  for (let i = 0; i < known.length; i += 1) {
    if (!known[i]) continue;
    dist[i] = 0;
    q.push(i);
  }
  const step = (i: number, ni: number) => {
    if (ni < 0 || ni >= dist.length) return;
    if (dist[i] + 1 < dist[ni]) {
      dist[ni] = dist[i] + 1;
      q.push(ni);
    }
  };
  for (let qi = 0; qi < q.length; qi += 1) {
    const i = q[qi];
    const x = i % width;
    if (x > 0) step(i, i - 1);
    if (x + 1 < width) step(i, i + 1);
    if (i >= width) step(i, i - width);
    if (i + width < dist.length) step(i, i + width);
  }

  const holes: number[] = [];
  for (let i = 0; i < mask.length; i += 1) if (mask[i]) holes.push(i);
  holes.sort((a, b) => dist[a] - dist[b]);

  const r = Math.max(3, Math.round(radius));
  const r2 = r * r;
  for (const i of holes) {
    const x = i % width;
    const y = (i - x) / width;
    let wr = 0;
    let wg = 0;
    let wb = 0;
    let wa = 0;
    let ws = 0;
    const x0 = Math.max(0, x - r);
    const x1 = Math.min(width - 1, x + r);
    const y0 = Math.max(0, y - r);
    const y1 = Math.min(height - 1, y + r);
    for (let py = y0; py <= y1; py += 1) {
      for (let px = x0; px <= x1; px += 1) {
        const d2 = (px - x) * (px - x) + (py - y) * (py - y);
        if (d2 === 0 || d2 > r2) continue;
        const ni = py * width + px;
        if (!known[ni]) continue;
        const w = (1 / d2) * (1 / (1 + dist[ni]));
        const pi = ni * 4;
        wr += data[pi] * w;
        wg += data[pi + 1] * w;
        wb += data[pi + 2] * w;
        wa += data[pi + 3] * w;
        ws += w;
      }
    }
    const pi = i * 4;
    if (ws > 0) {
      data[pi] = wr / ws;
      data[pi + 1] = wg / ws;
      data[pi + 2] = wb / ws;
      data[pi + 3] = wa / ws;
    }
    known[i] = 1;
  }
}

function softenHole(image: ImageData, mask: Uint8Array): void {
  const { data, width, height } = image;
  const copy = new Uint8ClampedArray(data);
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const i = y * width + x;
      if (!mask[i]) continue;
      const p = i * 4;
      for (let c = 0; c < 3; c += 1) {
        let s = 0;
        let n = 0;
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            s += copy[((y + dy) * width + (x + dx)) * 4 + c];
            n += 1;
          }
        }
        data[p + c] = s / n;
      }
    }
  }
}

const OVERLAY_DIRS: Array<[number, number]> = Array.from({ length: 20 }, (_, k) => {
  const a = (k / 20) * Math.PI * 2;
  return [Math.cos(a), Math.sin(a)] as [number, number];
});
const OVERLAY_DISTANCES = [5, 10, 16, 24, 34, 48, 64, 88];

function median(values: number[]): number {
  if (!values.length) return 0;
  values.sort((a, b) => a - b);
  return values[values.length >> 1];
}

function sampleLocalBg(
  src: Uint8ClampedArray,
  mask: Uint8Array,
  x: number,
  y: number,
  width: number,
  height: number,
): [number, number, number] | null {
  const rs: number[] = [];
  const gs: number[] = [];
  const bs: number[] = [];
  const take = (px: number, py: number) => {
    if (px < 0 || py < 0 || px >= width || py >= height) return;
    if (mask[py * width + px]) return;
    const pi = (py * width + px) * 4;
    rs.push(src[pi]);
    gs.push(src[pi + 1]);
    bs.push(src[pi + 2]);
  };
  for (const [dx, dy] of OVERLAY_DIRS) {
    for (const dist of OVERLAY_DISTANCES) {
      take(Math.round(x + dx * dist), Math.round(y + dy * dist));
    }
  }
  if (rs.length < 8) {
    const limit = Math.max(width, height);
    for (const [dx, dy] of OVERLAY_DIRS) {
      for (let dist = 6; dist < limit / 2 && rs.length < 16; dist += 8) {
        take(Math.round(x + dx * dist), Math.round(y + dy * dist));
      }
    }
  }
  if (rs.length < 8) return null;
  return [median(rs), median(gs), median(bs)];
}

/**
 * Shrink a coarse mask to pixels that don't match the local photo
 * (the overlay). Faces, captions, and products in the same corner are kept.
 */
export function tightenToOverlay(image: ImageData, mask: Uint8Array, keep = 12): Uint8Array {
  const { data, width, height } = image;
  const next = emptyMask(width, height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      if (!mask[i]) continue;
      const bg = sampleLocalBg(data, mask, x, y, width, height);
      if (!bg) continue;
      const p = i * 4;
      const dr = data[p] - bg[0];
      const dg = data[p + 1] - bg[1];
      const db = data[p + 2] - bg[2];
      if (Math.sqrt(dr * dr + dg * dg + db * db) >= keep) next[i] = 255;
    }
  }
  return next;
}

/**
 * Peel a stamp without punching a hole. Pixels that already match the local
 * photo are left alone — so text/objects under a fat mask survive.
 */
export function peelOverlay(image: ImageData, mask: Uint8Array, keep = 12): void {
  const { data, width, height } = image;
  const src = new Uint8ClampedArray(data);
  const replaced = emptyMask(width, height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      if (!mask[i]) continue;
      const bg = sampleLocalBg(src, mask, x, y, width, height);
      if (!bg) continue;
      const p = i * 4;
      const dr = src[p] - bg[0];
      const dg = src[p + 1] - bg[1];
      const db = src[p + 2] - bg[2];
      if (Math.sqrt(dr * dr + dg * dg + db * db) < keep) continue;
      data[p] = bg[0];
      data[p + 1] = bg[1];
      data[p + 2] = bg[2];
      replaced[i] = 255;
    }
  }
  if (maskHasPaint(replaced)) softenHole(image, replaced);
}

export type HealMode = "object" | "overlay";

/**
 * overlay: peel a watermark off so content underneath remains.
 * object: Telea fill of a painted hole (object remover).
 */
export function healImageData(
  image: ImageData,
  mask: Uint8Array,
  radius = 8,
  mode: HealMode = "object",
): void {
  const bounds = maskBounds(mask, image.width, image.height);
  if (!bounds) return;
  if (mode === "overlay") {
    peelOverlay(image, mask);
    return;
  }
  const area = maskArea(mask);
  const adaptive = clamp(Math.round(Math.sqrt(area) * 0.22), 4, 12);
  const r = clamp(radius, 3, 14);
  const use = Math.min(adaptive, r + 2);
  if (area > 14_000 && image.width > 480) {
    const small = downsample(image, mask, 2);
    telea(small.image, small.mask, Math.max(3, Math.round(use / 2)));
    upsampleFill(small.image, image, mask);
  }
  telea(image, mask, use);
  softenHole(image, mask);
}

export function healCanvas(
  canvas: HTMLCanvasElement,
  mask: Uint8Array,
  radius = 12,
  mode: HealMode = "object",
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser.");
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  healImageData(image, mask, radius, mode);
  ctx.putImageData(image, 0, 0);
}

export function overlayMask(
  ctx: CanvasRenderingContext2D,
  mask: Uint8Array,
  width: number,
  height: number,
  color = "rgba(242,1,63,0.42)",
): void {
  const overlay = ctx.createImageData(width, height);
  const parsed = color.match(/[\d.]+/g);
  const r = parsed ? Number(parsed[0]) : 242;
  const g = parsed ? Number(parsed[1]) : 1;
  const b = parsed ? Number(parsed[2]) : 63;
  const a = parsed && parsed[3] !== undefined ? Math.round(Number(parsed[3]) * 255) : 108;
  for (let i = 0; i < mask.length; i += 1) {
    if (!mask[i]) continue;
    const p = i * 4;
    overlay.data[p] = r;
    overlay.data[p + 1] = g;
    overlay.data[p + 2] = b;
    overlay.data[p + 3] = a;
  }
  ctx.putImageData(overlay, 0, 0);
}
