import { clamp } from "./format";

export type GradeSettings = {
  exposure: number;
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;
  temperature: number;
  tint: number;
  vibrance: number;
  fade: number;
  grain: number;
  vignette: number;
  sharpen: number;
  lift: number;
  gamma: number;
  gain: number;
  splitShadowHue: number;
  splitShadowSat: number;
  splitHighlightHue: number;
  splitHighlightSat: number;
};

export const DEFAULT_GRADE: GradeSettings = {
  exposure: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  temperature: 0,
  tint: 0,
  vibrance: 0,
  fade: 0,
  grain: 0,
  vignette: 0,
  sharpen: 0,
  lift: 0,
  gamma: 1,
  gain: 1,
  splitShadowHue: 210,
  splitShadowSat: 0,
  splitHighlightHue: 32,
  splitHighlightSat: 0,
};

export type LookPreset = {
  id: string;
  label: string;
  note: string;
  contrast?: number;
  saturation?: number;
  brightness?: number;
  grayscale?: boolean;
  sepia?: number;
  grade: GradeSettings;
};

function look(partial: Partial<GradeSettings>): GradeSettings {
  return { ...DEFAULT_GRADE, ...partial };
}

export const LOOKS: LookPreset[] = [
  {
    id: "neutral",
    label: "Neutral",
    note: "Reset wheels",
    grade: look({}),
  },
  {
    id: "cinematic",
    label: "Cinematic",
    note: "Teal shadows, warm skin, mild fade",
    contrast: 108,
    saturation: 92,
    grade: look({
      temperature: -8,
      tint: 6,
      shadows: -12,
      highlights: -10,
      fade: 10,
      vignette: 24,
      splitShadowHue: 188,
      splitShadowSat: 26,
      splitHighlightHue: 28,
      splitHighlightSat: 18,
      gamma: 1.05,
      lift: 4,
    }),
  },
  {
    id: "teal-orange",
    label: "Teal & orange",
    note: "Blockbuster split-tone",
    contrast: 112,
    saturation: 108,
    grade: look({
      temperature: 6,
      vibrance: 12,
      vignette: 16,
      splitShadowHue: 186,
      splitShadowSat: 34,
      splitHighlightHue: 28,
      splitHighlightSat: 28,
      highlights: -6,
    }),
  },
  {
    id: "portrait",
    label: "Portrait",
    note: "Warm skin, open shadows",
    contrast: 96,
    saturation: 104,
    grade: look({
      exposure: 0.12,
      temperature: 14,
      tint: 4,
      shadows: 16,
      highlights: -8,
      vibrance: 8,
      lift: 6,
      gamma: 0.96,
    }),
  },
  {
    id: "landscape",
    label: "Landscape",
    note: "Punchy skies and foliage",
    contrast: 110,
    saturation: 112,
    grade: look({
      temperature: -6,
      vibrance: 22,
      highlights: -8,
      shadows: -6,
      sharpen: 18,
      vignette: 12,
    }),
  },
  {
    id: "night",
    label: "Night",
    note: "Cool, crushed blacks, grain",
    contrast: 118,
    saturation: 90,
    brightness: 92,
    grade: look({
      exposure: -0.25,
      temperature: -18,
      shadows: -18,
      blacks: -12,
      grain: 16,
      vignette: 32,
      splitShadowHue: 220,
      splitShadowSat: 18,
    }),
  },
  {
    id: "vintage",
    label: "Vintage",
    note: "Faded print, warm, grain",
    contrast: 92,
    saturation: 88,
    sepia: 18,
    grade: look({
      temperature: 18,
      fade: 22,
      grain: 14,
      vignette: 28,
      lift: 10,
      gain: 0.92,
      splitHighlightHue: 36,
      splitHighlightSat: 12,
    }),
  },
  {
    id: "bleach",
    label: "Bleach bypass",
    note: "Silver contrast, low colour",
    contrast: 128,
    saturation: 58,
    grade: look({
      highlights: 12,
      shadows: -16,
      sharpen: 22,
      fade: 6,
      vignette: 10,
    }),
  },
  {
    id: "high-key",
    label: "High key",
    note: "Open, bright, fashion",
    contrast: 90,
    brightness: 112,
    grade: look({
      exposure: 0.35,
      shadows: 22,
      whites: 10,
      fade: 8,
      lift: 8,
    }),
  },
  {
    id: "low-key",
    label: "Low key",
    note: "Mood, crushed, vignette",
    contrast: 120,
    brightness: 88,
    grade: look({
      exposure: -0.35,
      shadows: -22,
      blacks: -16,
      vignette: 42,
      grain: 8,
    }),
  },
  {
    id: "film",
    label: "Film print",
    note: "Mild curve, grain, warm highlights",
    contrast: 106,
    saturation: 96,
    grade: look({
      gamma: 1.08,
      lift: 5,
      gain: 0.97,
      temperature: 8,
      fade: 8,
      grain: 10,
      splitHighlightHue: 40,
      splitHighlightSat: 10,
    }),
  },
  {
    id: "bw-drama",
    label: "B&W drama",
    note: "Greyscale with bite",
    grayscale: true,
    contrast: 124,
    grade: look({
      highlights: -8,
      shadows: -10,
      sharpen: 16,
      vignette: 22,
      grain: 8,
    }),
  },
];

export function cloneGrade(grade: Partial<GradeSettings> = DEFAULT_GRADE): GradeSettings {
  return { ...DEFAULT_GRADE, ...grade };
}

export function isIdentityGrade(grade: GradeSettings): boolean {
  const g = { ...DEFAULT_GRADE, ...grade };
  return (
    g.exposure === 0 &&
    g.highlights === 0 &&
    g.shadows === 0 &&
    g.whites === 0 &&
    g.blacks === 0 &&
    g.temperature === 0 &&
    g.tint === 0 &&
    g.vibrance === 0 &&
    g.fade === 0 &&
    g.grain === 0 &&
    g.vignette === 0 &&
    g.sharpen === 0 &&
    g.lift === 0 &&
    g.gamma === 1 &&
    g.gain === 1 &&
    g.splitShadowSat === 0 &&
    g.splitHighlightSat === 0
  );
}

export type Histogram = {
  r: Float32Array;
  g: Float32Array;
  b: Float32Array;
  y: Float32Array;
};

export function emptyHistogram(): Histogram {
  return {
    r: new Float32Array(256),
    g: new Float32Array(256),
    b: new Float32Array(256),
    y: new Float32Array(256),
  };
}

export function computeHistogram(image: ImageData): Histogram {
  const hist = emptyHistogram();
  const { data } = image;
  const step = data.length > 4_000_000 ? 16 : data.length > 1_000_000 ? 8 : 4;
  for (let i = 0; i < data.length; i += step) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a < 8) continue;
    hist.r[r] += 1;
    hist.g[g] += 1;
    hist.b[b] += 1;
    hist.y[clamp(Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b), 0, 255)] += 1;
  }
  return hist;
}

function hueToRgb(p: number, q: number, t: number): number {
  let h = t;
  if (h < 0) h += 1;
  if (h > 1) h -= 1;
  if (h < 1 / 6) return p + (q - p) * 6 * h;
  if (h < 1 / 2) return q;
  if (h < 2 / 3) return p + (q - p) * (2 / 3 - h) * 6;
  return p;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s <= 0) return [l, l, l];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [hueToRgb(p, q, h + 1 / 3), hueToRgb(p, q, h), hueToRgb(p, q, h - 1 / 3)];
}

export function applyGradeToImageData(image: ImageData, grade: GradeSettings): void {
  const g = { ...DEFAULT_GRADE, ...grade };
  if (isIdentityGrade(g)) return;

  const { data, width, height } = image;
  const exposureMul = Math.pow(2, g.exposure);
  const temp = g.temperature / 100;
  const tint = g.tint / 100;
  const hi = g.highlights / 100;
  const sh = g.shadows / 100;
  const whites = g.whites / 100;
  const blacks = g.blacks / 100;
  const vibrance = g.vibrance / 100;
  const fade = g.fade / 100;
  const grainAmt = g.grain / 100;
  const vig = g.vignette / 100;
  const lift = g.lift / 255;
  const gamma = g.gamma <= 0 ? 1 : g.gamma;
  const invGamma = 1 / gamma;
  const gain = g.gain;
  const splitS = g.splitShadowSat / 100;
  const splitH = g.splitHighlightSat / 100;
  const [ssR, ssG, ssB] = hslToRgb(g.splitShadowHue / 360, 1, 0.5);
  const [shR, shG, shB] = hslToRgb(g.splitHighlightHue / 360, 1, 0.5);
  const cx = width / 2;
  const cy = height / 2;
  const maxD = Math.sqrt(cx * cx + cy * cy) || 1;

  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    if (data[i + 3] < 1) continue;
    let r = data[i] / 255;
    let gc = data[i + 1] / 255;
    let b = data[i + 2] / 255;

    r *= exposureMul;
    gc *= exposureMul;
    b *= exposureMul;

    r += temp * 0.08;
    b -= temp * 0.08;
    gc += tint * 0.07;
    r -= tint * 0.035;
    b -= tint * 0.035;

    r = Math.pow(Math.max(r, 0), invGamma) * gain + lift;
    gc = Math.pow(Math.max(gc, 0), invGamma) * gain + lift;
    b = Math.pow(Math.max(b, 0), invGamma) * gain + lift;

    let y = 0.2126 * r + 0.7152 * gc + 0.0722 * b;
    const hiW = smoothstep(0.45, 1, y);
    const shW = 1 - smoothstep(0, 0.55, y);
    r += hi * hiW * 0.22 + sh * shW * 0.22;
    gc += hi * hiW * 0.22 + sh * shW * 0.22;
    b += hi * hiW * 0.22 + sh * shW * 0.22;
    r += whites * hiW * 0.16 + blacks * shW * 0.16;
    gc += whites * hiW * 0.16 + blacks * shW * 0.16;
    b += whites * hiW * 0.16 + blacks * shW * 0.16;

    y = 0.2126 * r + 0.7152 * gc + 0.0722 * b;
    if (vibrance !== 0) {
      const mx = Math.max(r, gc, b);
      const mn = Math.min(r, gc, b);
      const sat = mx < 1e-5 ? 0 : (mx - mn) / mx;
      const boost = vibrance * (1 - sat);
      r = y + (r - y) * (1 + boost);
      gc = y + (gc - y) * (1 + boost);
      b = y + (b - y) * (1 + boost);
    }

    if (splitS > 0 || splitH > 0) {
      const tw = smoothstep(0.35, 0.72, y);
      const sw = 1 - tw;
      r += (ssR - 0.5) * splitS * sw * 0.45 + (shR - 0.5) * splitH * tw * 0.45;
      gc += (ssG - 0.5) * splitS * sw * 0.45 + (shG - 0.5) * splitH * tw * 0.45;
      b += (ssB - 0.5) * splitS * sw * 0.45 + (shB - 0.5) * splitH * tw * 0.45;
    }

    if (fade > 0) {
      const liftFade = fade * 0.28 * (1 - y);
      r = r * (1 - fade * 0.18) + 0.5 * fade * 0.18 + liftFade;
      gc = gc * (1 - fade * 0.18) + 0.5 * fade * 0.18 + liftFade;
      b = b * (1 - fade * 0.18) + 0.5 * fade * 0.18 + liftFade;
    }

    if (vig > 0) {
      const x = (p % width) - cx;
      const yy = Math.floor(p / width) - cy;
      const d = Math.sqrt(x * x + yy * yy) / maxD;
      const dark = vig * Math.pow(Math.max(0, d - 0.28) / 0.72, 1.6);
      r *= 1 - dark;
      gc *= 1 - dark;
      b *= 1 - dark;
    }

    if (grainAmt > 0) {
      const n = hashNoise(p) * 2 - 1;
      const amt = grainAmt * 0.08 * (0.55 + y);
      r += n * amt;
      gc += n * amt;
      b += n * amt;
    }

    data[i] = clamp(Math.round(r * 255), 0, 255);
    data[i + 1] = clamp(Math.round(gc * 255), 0, 255);
    data[i + 2] = clamp(Math.round(b * 255), 0, 255);
  }

  if (g.sharpen > 0) unsharp(image, g.sharpen / 100);
}

export type ColorStats = {
  mean: [number, number, number];
  std: [number, number, number];
};

export type ColorMatch = {
  source: ColorStats;
  reference: ColorStats;
  amount: number;
};

export function computeColorStats(image: ImageData): ColorStats {
  const { data } = image;
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  const step = data.length > 4_000_000 ? 32 : data.length > 1_000_000 ? 16 : 8;
  for (let i = 0; i < data.length; i += step) {
    if (data[i + 3] < 8) continue;
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    n += 1;
  }
  if (!n) return { mean: [128, 128, 128], std: [40, 40, 40] };
  const mean: [number, number, number] = [r / n, g / n, b / n];
  let vr = 0;
  let vg = 0;
  let vb = 0;
  for (let i = 0; i < data.length; i += step) {
    if (data[i + 3] < 8) continue;
    vr += (data[i] - mean[0]) ** 2;
    vg += (data[i + 1] - mean[1]) ** 2;
    vb += (data[i + 2] - mean[2]) ** 2;
  }
  return {
    mean,
    std: [Math.sqrt(vr / n) || 1, Math.sqrt(vg / n) || 1, Math.sqrt(vb / n) || 1],
  };
}

export function statsFromCanvas(canvas: HTMLCanvasElement): ColorStats {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { mean: [128, 128, 128], std: [40, 40, 40] };
  return computeColorStats(ctx.getImageData(0, 0, canvas.width, canvas.height));
}

/** Reinhard-style RGB mean/std transfer. amount is 0–1. */
export function applyColorMatch(image: ImageData, match: ColorMatch): void {
  const t = clamp(match.amount, 0, 1);
  if (t <= 0) return;
  const { data } = image;
  const scale: [number, number, number] = [
    match.reference.std[0] / Math.max(1, match.source.std[0]),
    match.reference.std[1] / Math.max(1, match.source.std[1]),
    match.reference.std[2] / Math.max(1, match.source.std[2]),
  ];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 1) continue;
    const r = (data[i] - match.source.mean[0]) * scale[0] + match.reference.mean[0];
    const g = (data[i + 1] - match.source.mean[1]) * scale[1] + match.reference.mean[1];
    const b = (data[i + 2] - match.source.mean[2]) * scale[2] + match.reference.mean[2];
    data[i] = clamp(Math.round(data[i] * (1 - t) + r * t), 0, 255);
    data[i + 1] = clamp(Math.round(data[i + 1] * (1 - t) + g * t), 0, 255);
    data[i + 2] = clamp(Math.round(data[i + 2] * (1 - t) + b * t), 0, 255);
  }
}

export function applyGradeToCanvas(canvas: HTMLCanvasElement, grade: GradeSettings): void {
  if (isIdentityGrade(grade)) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  applyGradeToImageData(image, grade);
  ctx.putImageData(image, 0, 0);
}

export function autoWhiteBalance(image: ImageData): void {
  const { data } = image;
  let rSum = 0;
  let gSum = 0;
  let bSum = 0;
  let n = 0;
  for (let i = 0; i < data.length; i += 16) {
    if (data[i + 3] < 8) continue;
    rSum += data[i];
    gSum += data[i + 1];
    bSum += data[i + 2];
    n += 1;
  }
  if (!n) return;
  const rAvg = rSum / n;
  const gAvg = gSum / n;
  const bAvg = bSum / n;
  const gray = (rAvg + gAvg + bAvg) / 3;
  const rS = gray / Math.max(1, rAvg);
  const gS = gray / Math.max(1, gAvg);
  const bS = gray / Math.max(1, bAvg);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp(Math.round(data[i] * rS), 0, 255);
    data[i + 1] = clamp(Math.round(data[i + 1] * gS), 0, 255);
    data[i + 2] = clamp(Math.round(data[i + 2] * bS), 0, 255);
  }
}

export function autoContrast(image: ImageData): void {
  const { data } = image;
  let min = 255;
  let max = 0;
  for (let i = 0; i < data.length; i += 8) {
    if (data[i + 3] < 8) continue;
    const y = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    if (y < min) min = y;
    if (y > max) max = y;
  }
  const span = max - min;
  if (span < 8) return;
  const scale = 255 / span;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp(Math.round((data[i] - min) * scale), 0, 255);
    data[i + 1] = clamp(Math.round((data[i + 1] - min) * scale), 0, 255);
    data[i + 2] = clamp(Math.round((data[i + 2] - min) * scale), 0, 255);
  }
}

export function applyAutoToCanvas(
  canvas: HTMLCanvasElement,
  kind: "wb" | "contrast",
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  if (kind === "wb") autoWhiteBalance(image);
  else autoContrast(image);
  ctx.putImageData(image, 0, 0);
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / Math.max(1e-6, edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function hashNoise(i: number): number {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function unsharp(image: ImageData, amount: number): void {
  const { data, width, height } = image;
  const src = new Uint8ClampedArray(data);
  const k = amount * 1.35;
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
        data[i + c] = clamp(Math.round(src[i + c] + (src[i + c] - blur) * k), 0, 255);
      }
    }
  }
}
