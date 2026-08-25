import { clamp } from "./format";

function drawExact(source: CanvasImageSource, destW: number, destH: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(destW));
  canvas.height = Math.max(1, Math.round(destH));
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) throw new Error("Canvas is not supported in this browser.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export type CutoutMode = "corners" | "wand" | "chroma";

export type CutoutOptions = {
  mode: CutoutMode;
  tolerance: number;
  feather: number;
  seedX?: number;
  seedY?: number;
  chroma?: readonly [number, number, number];
  sampleRadius?: number;
};

function canvasFromSource(source: CanvasImageSource, w: number, h: number): HTMLCanvasElement {
  if (source instanceof HTMLCanvasElement && source.width === w && source.height === h) {
    return source;
  }
  return drawExact(source, w, h);
}

function colorDist(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function sampleAverage(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
  radius: number,
): [number, number, number] {
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  const x0 = clamp(Math.round(x) - radius, 0, width - 1);
  const y0 = clamp(Math.round(y) - radius, 0, height - 1);
  const x1 = clamp(Math.round(x) + radius, 0, width - 1);
  const y1 = clamp(Math.round(y) + radius, 0, height - 1);
  for (let py = y0; py <= y1; py += 1) {
    for (let px = x0; px <= x1; px += 1) {
      const i = (py * width + px) * 4;
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      n += 1;
    }
  }
  if (!n) return [0, 0, 0];
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
}

function floodMask(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  seeds: Array<[number, number]>,
  key: readonly [number, number, number],
  tolerance: number,
): Uint8Array {
  const mask = new Uint8Array(width * height);
  const seen = new Uint8Array(width * height);
  const qx = new Int32Array(width * height);
  const qy = new Int32Array(width * height);
  let head = 0;
  let tail = 0;

  for (const [sx, sy] of seeds) {
    const x = clamp(Math.round(sx), 0, width - 1);
    const y = clamp(Math.round(sy), 0, height - 1);
    const i = y * width + x;
    if (seen[i]) continue;
    seen[i] = 1;
    qx[tail] = x;
    qy[tail] = y;
    tail += 1;
  }

  while (head < tail) {
    const x = qx[head];
    const y = qy[head];
    head += 1;
    const i = y * width + x;
    const p = i * 4;
    if (colorDist(data[p], data[p + 1], data[p + 2], key[0], key[1], key[2]) > tolerance) {
      continue;
    }
    mask[i] = 255;
    if (x > 0 && !seen[i - 1]) {
      seen[i - 1] = 1;
      qx[tail] = x - 1;
      qy[tail] = y;
      tail += 1;
    }
    if (x + 1 < width && !seen[i + 1]) {
      seen[i + 1] = 1;
      qx[tail] = x + 1;
      qy[tail] = y;
      tail += 1;
    }
    if (y > 0 && !seen[i - width]) {
      seen[i - width] = 1;
      qx[tail] = x;
      qy[tail] = y - 1;
      tail += 1;
    }
    if (y + 1 < height && !seen[i + width]) {
      seen[i + width] = 1;
      qx[tail] = x;
      qy[tail] = y + 1;
      tail += 1;
    }
  }
  return mask;
}

function chromaMask(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  key: readonly [number, number, number],
  tolerance: number,
): Uint8Array {
  const mask = new Uint8Array(width * height);
  for (let i = 0, p = 0; i < mask.length; i += 1, p += 4) {
    if (colorDist(data[p], data[p + 1], data[p + 2], key[0], key[1], key[2]) <= tolerance) {
      mask[i] = 255;
    }
  }
  return mask;
}

function featherMask(mask: Uint8Array, width: number, height: number, radius: number): Uint8ClampedArray {
  if (radius <= 0) return new Uint8ClampedArray(mask);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new Uint8ClampedArray(mask);
  const image = ctx.createImageData(width, height);
  for (let i = 0; i < mask.length; i += 1) {
    const p = i * 4;
    const v = mask[i];
    image.data[p] = v;
    image.data[p + 1] = v;
    image.data[p + 2] = v;
    image.data[p + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  const out = document.createElement("canvas");
  out.width = width;
  out.height = height;
  const octx = out.getContext("2d");
  if (!octx) return new Uint8ClampedArray(mask);
  octx.filter = `blur(${Math.max(0.5, radius)}px)`;
  octx.drawImage(canvas, 0, 0);
  octx.filter = "none";
  const blurred = octx.getImageData(0, 0, width, height).data;
  const alpha = new Uint8ClampedArray(mask.length);
  for (let i = 0; i < mask.length; i += 1) {
    alpha[i] = blurred[i * 4];
  }
  return alpha;
}

export function samplePixel(
  source: CanvasImageSource,
  width: number,
  height: number,
  x: number,
  y: number,
  radius = 2,
): [number, number, number] {
  const canvas = canvasFromSource(source, width, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) return [0, 0, 0];
  const image = ctx.getImageData(0, 0, width, height);
  return sampleAverage(image.data, width, height, x, y, radius);
}

export function cutOut(
  source: CanvasImageSource,
  width: number,
  height: number,
  options: CutoutOptions,
): HTMLCanvasElement {
  const canvas = drawExact(source, width, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser.");
  const image = ctx.getImageData(0, 0, width, height);
  const { data } = image;
  const tolerance = options.tolerance;
  const sampleR = options.sampleRadius ?? 2;

  let key: readonly [number, number, number];
  let mask: Uint8Array;

  if (options.mode === "chroma") {
    key = options.chroma ?? sampleAverage(data, width, height, 2, 2, sampleR);
    mask = chromaMask(data, width, height, key, tolerance);
  } else if (options.mode === "wand") {
    const sx = options.seedX ?? 2;
    const sy = options.seedY ?? 2;
    key = sampleAverage(data, width, height, sx, sy, sampleR);
    mask = floodMask(data, width, height, [[sx, sy]], key, tolerance);
  } else {
    const corners: Array<[number, number]> = [
      [2, 2],
      [width - 3, 2],
      [2, height - 3],
      [width - 3, height - 3],
    ];
    const samples = corners.map(([x, y]) => sampleAverage(data, width, height, x, y, sampleR));
    key = [0, 1, 2].map((c) => Math.round(samples.reduce((sum, px) => sum + px[c], 0) / samples.length)) as [
      number,
      number,
      number,
    ];
    mask = floodMask(data, width, height, corners, key, tolerance);
  }

  const alpha = featherMask(mask, width, height, options.feather);
  for (let i = 0; i < alpha.length; i += 1) {
    const kill = alpha[i] / 255;
    data[i * 4 + 3] = Math.round(data[i * 4 + 3] * (1 - kill));
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

export function replaceBackground(
  cutout: HTMLCanvasElement,
  fill: string | CanvasImageSource,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = cutout.width;
  canvas.height = cutout.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser.");
  if (typeof fill === "string") {
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.drawImage(fill, 0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(cutout, 0, 0);
  return canvas;
}

export function applyChromaToImageData(
  image: ImageData,
  key: readonly [number, number, number],
  tolerance: number,
  feather: number,
): void {
  const { data, width, height } = image;
  const mask = chromaMask(data, width, height, key, tolerance);
  const alpha = featherMask(mask, width, height, feather);
  for (let i = 0; i < alpha.length; i += 1) {
    const kill = alpha[i] / 255;
    data[i * 4 + 3] = Math.round(data[i * 4 + 3] * (1 - kill));
  }
}
