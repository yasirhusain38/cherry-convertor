import {
  applyColorMatch,
  applyGradeToCanvas,
  cloneGrade,
  isIdentityGrade,
  type ColorMatch,
  type GradeSettings,
} from "./grade";

export type WatermarkPosition =
  | "tl"
  | "tc"
  | "tr"
  | "cl"
  | "cc"
  | "cr"
  | "bl"
  | "bc"
  | "br"
  | "tile";

export type EnhanceSettings = {
  rotate: number;
  flipH: boolean;
  flipV: boolean;
  grayscale: boolean;
  invert: boolean;
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  sepia: number;
  blur: number;
  watermark: string;
  watermarkPosition: WatermarkPosition;
  watermarkSize: number;
  watermarkOpacity: number;
  watermarkColor: string;
  grade: GradeSettings;
};

export const DEFAULT_ENHANCE: EnhanceSettings = {
  rotate: 0,
  flipH: false,
  flipV: false,
  grayscale: false,
  invert: false,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  hue: 0,
  sepia: 0,
  blur: 0,
  watermark: "",
  watermarkPosition: "br",
  watermarkSize: 28,
  watermarkOpacity: 70,
  watermarkColor: "#F5F5F1",
  grade: cloneGrade(),
};

export function cloneEnhance(settings: EnhanceSettings = DEFAULT_ENHANCE): EnhanceSettings {
  return { ...DEFAULT_ENHANCE, ...settings, grade: cloneGrade(settings.grade) };
}

export function enhanceForSlug(slug: string): EnhanceSettings {
  const base = cloneEnhance();
  if (
    slug === "black-and-white" ||
    slug.includes("black-and-white") ||
    slug.includes("grayscale")
  ) {
    return { ...base, grayscale: true };
  }
  if (slug === "rotate-image") return { ...base, rotate: 90 };
  if (slug === "flip-image") return { ...base, flipH: true };
  if (slug === "vintage-photo") {
    return {
      ...base,
      contrast: 92,
      saturation: 88,
      sepia: 18,
      grade: cloneGrade({
        temperature: 18,
        fade: 22,
        grain: 14,
        vignette: 28,
        lift: 10,
        gain: 0.92,
        splitHighlightHue: 36,
        splitHighlightSat: 12,
      }),
    };
  }
  return base;
}

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace("#", "");
  const full = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw;
  const n = Number.parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function drawWatermark(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, enhance: EnhanceSettings) {
  const text = enhance.watermark.trim();
  if (!text) return;
  const size = Math.max(12, Math.round(canvas.width * (enhance.watermarkSize / 100) * 0.18));
  ctx.font = `600 ${size}px Inter, system-ui, sans-serif`;
  ctx.fillStyle = hexToRgba(enhance.watermarkColor, enhance.watermarkOpacity / 100);

  if (enhance.watermarkPosition === "tile") {
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-0.32);
    const gapX = ctx.measureText(text).width + size * 2.4;
    const gapY = size * 3.2;
    for (let y = -canvas.height; y < canvas.height; y += gapY) {
      for (let x = -canvas.width; x < canvas.width; x += gapX) {
        ctx.fillText(text, x, y);
      }
    }
    ctx.restore();
    return;
  }

  const pad = Math.max(12, Math.round(canvas.width * 0.03));
  const col = enhance.watermarkPosition[1];
  const row = enhance.watermarkPosition[0];
  ctx.textAlign = col === "l" ? "left" : col === "r" ? "right" : "center";
  ctx.textBaseline = row === "t" ? "top" : row === "b" ? "bottom" : "middle";
  const x = col === "l" ? pad : col === "r" ? canvas.width - pad : canvas.width / 2;
  const y = row === "t" ? pad : row === "b" ? canvas.height - pad : canvas.height / 2;
  ctx.fillText(text, x, y);
}

export function cssEnhanceFilter(enhance: EnhanceSettings): string {
  const saturation = enhance.saturation ?? 100;
  const hue = enhance.hue ?? 0;
  const sepia = enhance.sepia ?? 0;
  const blur = enhance.blur ?? 0;
  return [
    enhance.grayscale ? "grayscale(1)" : "",
    enhance.invert ? "invert(1)" : "",
    sepia ? `sepia(${sepia}%)` : "",
    `brightness(${enhance.brightness}%)`,
    `contrast(${enhance.contrast}%)`,
    `saturate(${saturation}%)`,
    hue ? `hue-rotate(${hue}deg)` : "",
    blur ? `blur(${blur}px)` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function rotatedBox(srcW: number, srcH: number, degrees: number): { width: number; height: number } {
  const r = ((degrees % 360) + 360) % 360;
  if (r === 0 || r === 180) return { width: srcW, height: srcH };
  if (r === 90 || r === 270) return { width: srcH, height: srcW };
  const rad = (r * Math.PI) / 180;
  const c = Math.abs(Math.cos(rad));
  const s = Math.abs(Math.sin(rad));
  return {
    width: Math.max(1, Math.round(srcW * c + srcH * s)),
    height: Math.max(1, Math.round(srcW * s + srcH * c)),
  };
}

export function applyEnhance(
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  enhance: EnhanceSettings,
  match?: ColorMatch | null,
): HTMLCanvasElement {
  const settings = {
    ...DEFAULT_ENHANCE,
    ...enhance,
    grade: cloneGrade(enhance.grade),
  };
  const box = rotatedBox(srcW, srcH, settings.rotate);
  const canvas = document.createElement("canvas");
  canvas.width = box.width;
  canvas.height = box.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.filter = cssEnhanceFilter(settings) || "none";
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((settings.rotate * Math.PI) / 180);
  ctx.scale(settings.flipH ? -1 : 1, settings.flipV ? -1 : 1);
  ctx.drawImage(source, -srcW / 2, -srcH / 2, srcW, srcH);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.filter = "none";

  if (match && match.amount > 0) {
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    applyColorMatch(image, match);
    ctx.putImageData(image, 0, 0);
  }

  if (!isIdentityGrade(settings.grade)) {
    applyGradeToCanvas(canvas, settings.grade);
  }
  drawWatermark(ctx, canvas, settings);
  return canvas;
}
