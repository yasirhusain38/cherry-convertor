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

/**
 * Content-aware heal for a painted mask. Samples unmasked neighbours around
 * each marked pixel, then blends. Meant for logos, stamps, sensors, and small
 * objects — not a generative fill.
 */
export function healImageData(image: ImageData, mask: Uint8Array, radius = 12): void {
  const { data, width, height } = image;
  const bounds = maskBounds(mask, width, height);
  if (!bounds) return;

  const src = new Uint8ClampedArray(data);
  const r = Math.max(4, Math.round(radius));
  const pad = r + 2;
  const x0 = Math.max(0, bounds.x - pad);
  const y0 = Math.max(0, bounds.y - pad);
  const x1 = Math.min(width, bounds.x + bounds.w + pad);
  const y1 = Math.min(height, bounds.y + bounds.h + pad);

  const dirs: Array<[number, number]> = [];
  for (let k = 0; k < 24; k += 1) {
    const a = (k / 24) * Math.PI * 2;
    dirs.push([Math.cos(a), Math.sin(a)]);
  }

  for (let y = bounds.y; y < bounds.y + bounds.h; y += 1) {
    for (let x = bounds.x; x < bounds.x + bounds.w; x += 1) {
      const mi = y * width + x;
      if (!mask[mi]) continue;
      let rs = 0;
      let gs = 0;
      let bs = 0;
      let as = 0;
      let wsum = 0;
      for (const [dx, dy] of dirs) {
        for (const dist of [r, r * 1.6, r * 2.2]) {
          const px = Math.round(x + dx * dist);
          const py = Math.round(y + dy * dist);
          if (px < 0 || py < 0 || px >= width || py >= height) continue;
          if (mask[py * width + px]) continue;
          const pi = (py * width + px) * 4;
          const w = 1 / dist;
          rs += src[pi] * w;
          gs += src[pi + 1] * w;
          bs += src[pi + 2] * w;
          as += src[pi + 3] * w;
          wsum += w;
        }
      }
      if (wsum < 1e-4) {
        const px = clamp(x < bounds.x + bounds.w / 2 ? bounds.x - 2 : bounds.x + bounds.w + 1, 0, width - 1);
        const py = clamp(y < bounds.y + bounds.h / 2 ? bounds.y - 2 : bounds.y + bounds.h + 1, 0, height - 1);
        const pi = (py * width + px) * 4;
        rs = src[pi];
        gs = src[pi + 1];
        bs = src[pi + 2];
        as = src[pi + 3];
        wsum = 1;
      }
      const i = mi * 4;
      data[i] = rs / wsum;
      data[i + 1] = gs / wsum;
      data[i + 2] = bs / wsum;
      data[i + 3] = as / wsum;
    }
  }

  for (let pass = 0; pass < 2; pass += 1) {
    const copy = new Uint8ClampedArray(data);
    for (let y = y0 + 1; y < y1 - 1; y += 1) {
      for (let x = x0 + 1; x < x1 - 1; x += 1) {
        const mi = y * width + x;
        if (!mask[mi]) continue;
        const i = mi * 4;
        for (let c = 0; c < 4; c += 1) {
          let s = 0;
          for (let dy = -1; dy <= 1; dy += 1) {
            for (let dx = -1; dx <= 1; dx += 1) {
              s += copy[((y + dy) * width + (x + dx)) * 4 + c];
            }
          }
          data[i + c] = s / 9;
        }
      }
    }
  }
}

export function healCanvas(canvas: HTMLCanvasElement, mask: Uint8Array, radius = 12): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser.");
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  healImageData(image, mask, radius);
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
