/** Client-only color math. No network. */

export type RGB = { r: number; g: number; b: number };
export type HSL = { h: number; s: number; l: number };
export type HSV = { h: number; s: number; v: number };
export type CMYK = { c: number; m: number; y: number; k: number };
export type OKLCH = { l: number; c: number; h: number };

export function clamp(n: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, n));
}

export function hexToRgb(hex: string): RGB {
  const raw = hex.replace("#", "").trim();
  const h =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error("Not a hex color.");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }: RGB): string {
  const to = (n: number) =>
    Math.round(clamp(n, 0, 255))
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

export function rgbToHsl({ r, g, b }: RGB): HSL {
  const R = r / 255;
  const G = g / 255;
  const B = b / 255;
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === R) h = ((G - B) / d + (G < B ? 6 : 0)) / 6;
  else if (max === G) h = ((B - R) / d + 2) / 6;
  else h = ((R - G) / d + 4) / 6;
  return { h: h * 360, s, l };
}

export function hslToRgb({ h, s, l }: HSL): RGB {
  const H = ((h % 360) + 360) % 360;
  const C = (1 - Math.abs(2 * l - 1)) * s;
  const X = C * (1 - Math.abs(((H / 60) % 2) - 1));
  const m = l - C / 2;
  let rp = 0;
  let gp = 0;
  let bp = 0;
  if (H < 60) [rp, gp, bp] = [C, X, 0];
  else if (H < 120) [rp, gp, bp] = [X, C, 0];
  else if (H < 180) [rp, gp, bp] = [0, C, X];
  else if (H < 240) [rp, gp, bp] = [0, X, C];
  else if (H < 300) [rp, gp, bp] = [X, 0, C];
  else [rp, gp, bp] = [C, 0, X];
  return {
    r: Math.round((rp + m) * 255),
    g: Math.round((gp + m) * 255),
    b: Math.round((bp + m) * 255),
  };
}

export function rgbToHsv({ r, g, b }: RGB): HSV {
  const R = r / 255;
  const G = g / 255;
  const B = b / 255;
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const d = max - min;
  const s = max === 0 ? 0 : d / max;
  let h = 0;
  if (d !== 0) {
    if (max === R) h = ((G - B) / d + (G < B ? 6 : 0)) / 6;
    else if (max === G) h = ((B - R) / d + 2) / 6;
    else h = ((R - G) / d + 4) / 6;
  }
  return { h: h * 360, s, v: max };
}

export function rgbToCmyk({ r, g, b }: RGB): CMYK {
  const R = r / 255;
  const G = g / 255;
  const B = b / 255;
  const k = 1 - Math.max(R, G, B);
  if (k >= 0.999) return { c: 0, m: 0, y: 0, k: 1 };
  return {
    c: (1 - R - k) / (1 - k),
    m: (1 - G - k) / (1 - k),
    y: (1 - B - k) / (1 - k),
    k,
  };
}

function srgbToLinear(c: number): number {
  const x = c / 255;
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance({ r, g, b }: RGB): number {
  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export function contrastRatio(a: RGB, b: RGB): number {
  const L1 = relativeLuminance(a);
  const L2 = relativeLuminance(b);
  const light = Math.max(L1, L2);
  const dark = Math.min(L1, L2);
  return (light + 0.05) / (dark + 0.05);
}

export type WcagLevel = "fail" | "AA" | "AAA";

export function wcagText(ratio: number, large: boolean): WcagLevel {
  if (large) {
    if (ratio >= 7) return "AAA";
    if (ratio >= 3) return "AA";
    return "fail";
  }
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  return "fail";
}

export function wcagUi(ratio: number): WcagLevel {
  return ratio >= 3 ? "AA" : "fail";
}

/** Nudge the foreground until WCAG AA for normal text against bg. */
export function suggestPassingColor(fg: RGB, bg: RGB, target = 4.5): RGB {
  if (contrastRatio(fg, bg) >= target) return fg;
  const hsl = rgbToHsl(fg);
  const bgL = relativeLuminance(bg);
  const dir = bgL > 0.5 ? -1 : 1;
  for (let i = 0; i <= 100; i += 1) {
    const l = clamp(hsl.l + dir * (i / 100));
    const next = hslToRgb({ ...hsl, l });
    if (contrastRatio(next, bg) >= target) return next;
  }
  return bgL > 0.5 ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 };
}

function linearToOklab(r: number, g: number, b: number): { L: number; a: number; b: number } {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);
  return {
    L: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  };
}

export function rgbToOklch(rgb: RGB): OKLCH {
  const lab = linearToOklab(srgbToLinear(rgb.r), srgbToLinear(rgb.g), srgbToLinear(rgb.b));
  const c = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
  let h = (Math.atan2(lab.b, lab.a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l: lab.L, c, h };
}

export function complementary(hex: string): string {
  const hsl = rgbToHsl(hexToRgb(hex));
  return rgbToHex(hslToRgb({ ...hsl, h: (hsl.h + 180) % 360 }));
}

export function analogous(hex: string): [string, string, string] {
  const hsl = rgbToHsl(hexToRgb(hex));
  return [
    rgbToHex(hslToRgb({ ...hsl, h: (hsl.h + 330) % 360 })),
    rgbToHex(hexToRgb(hex)),
    rgbToHex(hslToRgb({ ...hsl, h: (hsl.h + 30) % 360 })),
  ];
}

export function monochromeScale(hex: string, steps = 9): string[] {
  const hsl = rgbToHsl(hexToRgb(hex));
  return Array.from({ length: steps }, (_, i) => {
    const l = 0.08 + (0.84 * i) / (steps - 1);
    return rgbToHex(hslToRgb({ ...hsl, l }));
  });
}

export function tailwindLike(hex: string): Record<string, string> {
  const keys = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  const scale = monochromeScale(hex, keys.length);
  return Object.fromEntries(keys.map((k, i) => [String(k), scale[i]]));
}

const BLIND: Record<string, number[][]> = {
  protanopia: [
    [0.56667, 0.43333, 0],
    [0.55833, 0.44167, 0],
    [0, 0.24167, 0.75833],
  ],
  deuteranopia: [
    [0.625, 0.375, 0],
    [0.7, 0.3, 0],
    [0, 0.3, 0.7],
  ],
  tritanopia: [
    [0.95, 0.05, 0],
    [0, 0.43333, 0.56667],
    [0, 0.475, 0.525],
  ],
};

export function simulateBlindness(rgb: RGB, kind: keyof typeof BLIND): RGB {
  const m = BLIND[kind];
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  return {
    r: Math.round(clamp(m[0][0] * r + m[0][1] * g + m[0][2] * b) * 255),
    g: Math.round(clamp(m[1][0] * r + m[1][1] * g + m[1][2] * b) * 255),
    b: Math.round(clamp(m[2][0] * r + m[2][1] * g + m[2][2] * b) * 255),
  };
}

export function paletteFromImageData(data: Uint8ClampedArray, count = 5): string[] {
  const samples: RGB[] = [];
  const step = Math.max(4, Math.floor(data.length / 4 / 4000) * 4);
  for (let i = 0; i < data.length; i += step) {
    samples.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
  }
  if (!samples.length) return ["#221F1F"];
  const buckets = new Map<string, { rgb: RGB; n: number }>();
  for (const s of samples) {
    const key = `${s.r >> 4}-${s.g >> 4}-${s.b >> 4}`;
    const prev = buckets.get(key);
    if (prev) prev.n += 1;
    else buckets.set(key, { rgb: s, n: 1 });
  }
  return [...buckets.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, count)
    .map((b) => rgbToHex(b.rgb));
}

export function cssVars(hex: string): string {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb);
  return `--color: ${hex};\n--color-rgb: ${rgb.r} ${rgb.g} ${rgb.b};\n--color-hsl: ${Math.round(hsl.h)} ${Math.round(hsl.s * 100)}% ${Math.round(hsl.l * 100)}%;`;
}

export function swiftColor(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  return `UIColor(red: ${(r / 255).toFixed(3)}, green: ${(g / 255).toFixed(3)}, blue: ${(b / 255).toFixed(3)}, alpha: 1)`;
}

export function androidHex(hex: string): string {
  return `0xFF${hex.replace("#", "").toUpperCase()}`;
}

export function parseColor(input: string): RGB {
  const t = input.trim();
  if (t.startsWith("#") || /^[0-9a-fA-F]{3,6}$/.test(t)) return hexToRgb(t.startsWith("#") ? t : `#${t}`);
  const rgb = t.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgb) return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) };
  const hsl = t.match(/hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%/i);
  if (hsl) return hslToRgb({ h: Number(hsl[1]), s: Number(hsl[2]) / 100, l: Number(hsl[3]) / 100 });
  throw new Error("Could not parse that color.");
}
