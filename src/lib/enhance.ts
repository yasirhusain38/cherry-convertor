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
  rotate: 0 | 90 | 180 | 270;
  flipH: boolean;
  flipV: boolean;
  grayscale: boolean;
  invert: boolean;
  brightness: number;
  contrast: number;
  watermark: string;
  watermarkPosition: WatermarkPosition;
  watermarkSize: number;
  watermarkOpacity: number;
  watermarkColor: string;
};

export const DEFAULT_ENHANCE: EnhanceSettings = {
  rotate: 0,
  flipH: false,
  flipV: false,
  grayscale: false,
  invert: false,
  brightness: 100,
  contrast: 100,
  watermark: "",
  watermarkPosition: "br",
  watermarkSize: 28,
  watermarkOpacity: 70,
  watermarkColor: "#F5F5F1",
};

export function enhanceForSlug(slug: string): EnhanceSettings {
  if (slug === "black-and-white") return { ...DEFAULT_ENHANCE, grayscale: true };
  if (slug === "rotate-image") return { ...DEFAULT_ENHANCE, rotate: 90 };
  if (slug === "flip-image") return { ...DEFAULT_ENHANCE, flipH: true };
  return { ...DEFAULT_ENHANCE };
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

export function applyEnhance(
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  enhance: EnhanceSettings,
): HTMLCanvasElement {
  const quarter = enhance.rotate === 90 || enhance.rotate === 270;
  const width = quarter ? srcH : srcW;
  const height = quarter ? srcW : srcH;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const filters = [
    enhance.grayscale ? "grayscale(1)" : "",
    enhance.invert ? "invert(1)" : "",
    `brightness(${enhance.brightness}%)`,
    `contrast(${enhance.contrast}%)`,
  ]
    .filter(Boolean)
    .join(" ");
  ctx.filter = filters || "none";
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((enhance.rotate * Math.PI) / 180);
  ctx.scale(enhance.flipH ? -1 : 1, enhance.flipV ? -1 : 1);
  ctx.drawImage(source, -srcW / 2, -srcH / 2, srcW, srcH);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.filter = "none";
  drawWatermark(ctx, canvas, enhance);
  return canvas;
}
