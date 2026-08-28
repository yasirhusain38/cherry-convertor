import { clamp } from "./format";
import { emptyMask, healImageData, peelOverlay, tightenToOverlay, type Rect } from "./heal";

export type KnownStamp = Rect & {
  id: "gemini" | "grok";
  label: string;
  sizeLabel: string;
  marginRight: number;
  marginBottom: number;
  coveragePct: number;
  note: string;
};

/** Gemini / Nano Banana visible sparkle: documented chip + margin. */
export function geminiStamp(width: number, height: number): KnownStamp {
  const large = width > 1024 && height > 1024;
  const size = large ? 96 : 48;
  const margin = large ? 64 : 32;
  const x = Math.max(0, width - margin - size);
  const y = Math.max(0, height - margin - size);
  return {
    id: "gemini",
    label: "Gemini / Nano Banana sparkle",
    sizeLabel: `${size}×${size} px`,
    x,
    y,
    w: size,
    h: size,
    marginRight: margin,
    marginBottom: margin,
    coveragePct: (size * size) / Math.max(1, width * height) * 100,
    note: large
      ? "Both sides over 1024px → 96×96 sparkle, 64px from the right and bottom edges."
      : "Shorter side ≤1024px → 48×48 sparkle, 32px from the right and bottom edges.",
  };
}

/** Grok Imagine visible logo: bottom-right, small low-opacity wordmark. */
export function grokStamp(width: number, height: number): KnownStamp {
  const large = width > 1024 && height > 1024;
  const h = large ? 72 : 44;
  const w = large ? 132 : 80;
  const margin = large ? 36 : 20;
  const x = Math.max(0, width - margin - w);
  const y = Math.max(0, height - margin - h);
  return {
    id: "grok",
    label: "Grok Imagine logo",
    sizeLabel: `${w}×${h} px`,
    x,
    y,
    w,
    h,
    marginRight: margin,
    marginBottom: margin,
    coveragePct: (w * h) / Math.max(1, width * height) * 100,
    note: large
      ? "Bottom-right Grok wordmark ≈132×72 px, 36px inset from the right and bottom."
      : "Bottom-right Grok wordmark ≈80×44 px, 20px inset from the right and bottom.",
  };
}

function sparkleAlpha(size: number): Float32Array {
  const alpha = new Float32Array(size * size);
  const c = (size - 1) / 2;
  const peak = size >= 80 ? 0.5 : 0.38;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = (x - c) / c;
      const dy = (y - c) / c;
      const r = Math.hypot(dx, dy);
      if (r > 1.02) continue;
      const ang = Math.atan2(dy, dx);
      const spike = Math.pow(Math.abs(Math.cos(2 * ang)), 2.6);
      const disc = Math.max(0, 1 - r);
      const core = Math.max(0, 1 - r * 3.1);
      const v = Math.min(1, disc * spike * 1.2 + core * 0.5);
      alpha[y * size + x] = v * peak;
    }
  }
  return alpha;
}

export function stampMask(width: number, height: number, stamp: KnownStamp): Uint8Array {
  const mask = emptyMask(width, height);
  if (stamp.id === "gemini") {
    const alpha = sparkleAlpha(stamp.w);
    for (let y = 0; y < stamp.h; y += 1) {
      for (let x = 0; x < stamp.w; x += 1) {
        if (alpha[y * stamp.w + x] < 0.03) continue;
        const px = stamp.x + x;
        const py = stamp.y + y;
        if (px >= 0 && py >= 0 && px < width && py < height) mask[py * width + px] = 255;
      }
    }
    return mask;
  }
  for (let y = stamp.y; y < stamp.y + stamp.h; y += 1) {
    for (let x = stamp.x; x < stamp.x + stamp.w; x += 1) {
      if (x >= 0 && y >= 0 && x < width && y < height) mask[y * width + x] = 255;
    }
  }
  return mask;
}

/** Reverse overlay, then reconstruct leftover glow/arms inside the chip only. */
export function reconstructUnderStamp(image: ImageData, stamp: KnownStamp): void {
  const mask = stampMask(image.width, image.height, stamp);
  if (stamp.id === "gemini") reverseGeminiSparkle(image, stamp);
  peelOverlay(image, mask, 9);
  const leftover = tightenToOverlay(image, mask, 8);
  let n = 0;
  for (let i = 0; i < leftover.length; i += 1) if (leftover[i]) n += 1;
  if (n > 6) healImageData(image, leftover, 5, "object");
}

/** Reverse Gemini alpha composite: original = (I - α·white) / (1-α). */
export function reverseGeminiSparkle(image: ImageData, stamp: KnownStamp): void {
  const { data, width, height } = image;
  const alpha = sparkleAlpha(stamp.w);
  for (let y = 0; y < stamp.h; y += 1) {
    for (let x = 0; x < stamp.w; x += 1) {
      const a = alpha[y * stamp.w + x];
      if (a < 0.02 || a >= 0.97) continue;
      const px = stamp.x + x;
      const py = stamp.y + y;
      if (px < 0 || py < 0 || px >= width || py >= height) continue;
      const i = (py * width + px) * 4;
      const inv = 1 - a;
      for (let c = 0; c < 3; c += 1) {
        const recovered = (data[i + c] - a * 255) / inv;
        data[i + c] = clamp(Math.round(recovered), 0, 255);
      }
    }
  }
}

export function cropStamp(
  canvas: HTMLCanvasElement,
  stamp: KnownStamp,
  pad = 28,
): { canvas: HTMLCanvasElement; x: number; y: number; w: number; h: number } {
  const x = Math.max(0, stamp.x - pad);
  const y = Math.max(0, stamp.y - pad);
  const w = Math.min(canvas.width - x, stamp.w + pad * 2);
  const h = Math.min(canvas.height - y, stamp.h + pad * 2);
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  out.getContext("2d")?.drawImage(canvas, x, y, w, h, 0, 0, w, h);
  return { canvas: out, x, y, w, h };
}

export function pasteCrop(
  target: HTMLCanvasElement,
  source: CanvasImageSource,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const ctx = target.getContext("2d");
  if (!ctx) return;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, x, y, w, h);
}

/** Composite the AI crop only over the stamp, feathered — rest of the photo is original pixels. */
export function pasteStampFeathered(
  target: HTMLCanvasElement,
  source: CanvasImageSource,
  cropX: number,
  cropY: number,
  cropW: number,
  cropH: number,
  stamp: KnownStamp,
  feather = 18,
): void {
  const layer = document.createElement("canvas");
  layer.width = cropW;
  layer.height = cropH;
  const lctx = layer.getContext("2d");
  if (!lctx) return;
  lctx.drawImage(source, 0, 0, cropW, cropH);
  const veil = document.createElement("canvas");
  veil.width = cropW;
  veil.height = cropH;
  const vctx = veil.getContext("2d");
  if (!vctx) return;
  const cx = stamp.x - cropX + stamp.w / 2;
  const cy = stamp.y - cropY + stamp.h / 2;
  const inner = Math.max(stamp.w, stamp.h) * 0.42;
  const outer = Math.max(stamp.w, stamp.h) * 0.55 + feather;
  const grad = vctx.createRadialGradient(cx, cy, inner, cx, cy, outer);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  vctx.fillStyle = grad;
  vctx.fillRect(0, 0, cropW, cropH);
  lctx.globalCompositeOperation = "destination-in";
  lctx.drawImage(veil, 0, 0);
  lctx.globalCompositeOperation = "source-over";
  const ctx = target.getContext("2d");
  if (!ctx) return;
  ctx.drawImage(layer, cropX, cropY);
}

export const FORENSIC_PROMPT = `You are doing forensic-quality visible watermark and overlay removal.

Remove only the small AI badge in this crop: Gemini / Nano Banana four-point sparkle or Grok / xAI corner logo, including glow, outline, and shadow.

HINT: SURGICAL — remove only that bottom-right stamp. Touch nothing else.

Rebuild the exact surface under the mark. Match local lighting, color temperature, contrast, saturation, grain, compression, and sharpness. Continue textures, edges, perspective, and reflections. If the mark sat on text or a hard edge, rebuild that text/edge — do not smear it.

No blur patch, smudge, cloned stamp, repeating tile, color blob, halo, or dark/light ring.
Do not restyle, crop, reframe, recolor, sharpen the whole crop, beautify, or add objects.
Do not change faces, bodies, products, or composition.
Do not replace a watermark with another watermark.`;

export const VERIFY_PROMPT = `Second pass. Faint star-arm, glow, letter ghost, or color mismatch still visible in the bottom-right stamp area. Remove the remnant and match grain. Do not touch the rest.`;

export function sparkleConfidence(image: ImageData, stamp: KnownStamp): number {
  const { data, width, height } = image;
  const alpha = sparkleAlpha(stamp.w);
  let weighted = 0;
  let mass = 0;
  for (let y = 0; y < stamp.h; y += 1) {
    for (let x = 0; x < stamp.w; x += 1) {
      const a = alpha[y * stamp.w + x];
      if (a < 0.08) continue;
      const px = stamp.x + x;
      const py = stamp.y + y;
      if (px < 0 || py < 0 || px >= width || py >= height) continue;
      const i = (py * width + px) * 4;
      const luma = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      weighted += (luma / 255) * a;
      mass += a;
    }
  }
  return mass > 0 ? weighted / mass : 0;
}

export function pickKnownStamp(
  width: number,
  height: number,
  image?: ImageData,
  preset?: string,
): KnownStamp {
  if (preset === "grok") return grokStamp(width, height);
  if (preset === "gemini" || preset === "imagen") return geminiStamp(width, height);
  const gem = geminiStamp(width, height);
  if (image && sparkleConfidence(image, gem) > 0.62) return gem;
  return grokStamp(width, height);
}
