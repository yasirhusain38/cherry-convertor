import type { PhotoSpec } from "@/data/photo-specs";
import { photoPixels } from "@/data/photo-specs";
import { detectFaces, type NormRect } from "./image-fx";

export type FaceAdvice = {
  found: boolean;
  facePct: number | null;
  zoom: number;
  offsetX: number;
  offsetY: number;
  tiltWarning: boolean;
  note: string;
};

/** ICAO-ish: head ~70–80% of height; US 2×2 wants face (chin to crown) 50–69%. */
export function targetFacePct(spec: PhotoSpec): { min: number; max: number; aim: number } {
  if (spec.countrySlug === "united-states") return { min: 50, max: 69, aim: 58 };
  return { min: 70, max: 80, aim: 74 };
}

export async function adviceFromBitmap(bitmap: ImageBitmap, spec: PhotoSpec): Promise<FaceAdvice> {
  const faces = await detectFaces(bitmap);
  if (!faces.length) {
    return {
      found: false,
      facePct: null,
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
      tiltWarning: false,
      note: "No FaceDetector in this browser, or no face found. Drag zoom yourself. Chrome often supports auto-detect.",
    };
  }
  const face = faces.reduce((a, b) => (a.w * a.h > b.w * b.h ? a : b));
  const aim = targetFacePct(spec).aim / 100;
  const zoom = Math.min(2.4, Math.max(1, aim / Math.max(0.08, face.h)));
  const cx = face.x + face.w / 2;
  const cy = face.y + face.h / 2;
  const offsetX = clamp((0.5 - cx) * 2, -1, 1);
  const offsetY = clamp((0.42 - cy) * 2, -1, 1);
  const tiltWarning = face.w / Math.max(face.h, 0.01) > 0.95;
  return {
    found: true,
    facePct: Math.round(face.h * 100),
    zoom,
    offsetX,
    offsetY,
    tiltWarning,
    note: tiltWarning
      ? "Face box is wide — head may be tilted. Recrop or retake."
      : `Face ~${Math.round(face.h * zoom * 100)}% of the frame after auto crop.`,
  };
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export function checkCompliance(options: {
  spec: PhotoSpec;
  width: number;
  height: number;
  bytes: number;
  mime: string;
  facePct: number | null;
  cornerRgb: Array<{ r: number; g: number; b: number }>;
}): Array<{ label: string; pass: boolean; detail: string }> {
  const px = photoPixels(options.spec);
  const kb = options.bytes / 1024;
  const face = targetFacePct(options.spec);
  const bg = hexRgb(options.spec.background);
  const cornersOk = options.cornerRgb.every((c) => colorDist(c, bg) < 48);
  const rows = [
    {
      label: "Pixels",
      pass: options.width === px.width && options.height === px.height,
      detail: `${options.width}×${options.height} (need ${px.width}×${px.height})`,
    },
    {
      label: "File size",
      pass:
        (options.spec.minKB ? kb >= options.spec.minKB - 0.5 : true) &&
        (options.spec.maxKB ? kb <= options.spec.maxKB + 0.5 : true),
      detail: `${kb.toFixed(1)} KB${options.spec.maxKB ? ` (cap ${options.spec.minKB ?? 0}–${options.spec.maxKB} KB)` : ""}`,
    },
    {
      label: "Format",
      pass: options.mime.includes("jpeg") || options.mime.includes("jpg"),
      detail: options.mime,
    },
    {
      label: "Background corners",
      pass: cornersOk,
      detail: cornersOk ? options.spec.backgroundLabel : "Corners are not close to the official background.",
    },
  ];
  if (options.facePct != null) {
    rows.push({
      label: "Face height",
      pass: options.facePct >= face.min && options.facePct <= face.max,
      detail: `${options.facePct}% (aim ${face.min}–${face.max}%)`,
    });
  } else {
    rows.push({
      label: "Face height",
      pass: false,
      detail: "Not measured — auto-detect unavailable. Check against the spec notes.",
    });
  }
  return rows;
}

function hexRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}

function colorDist(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }) {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

export function sampleCorners(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];
  const { width, height } = canvas;
  const pts = [
    [2, 2],
    [width - 3, 2],
    [2, height - 3],
    [width - 3, height - 3],
  ];
  return pts.map(([x, y]) => {
    const d = ctx.getImageData(x, y, 1, 1).data;
    return { r: d[0], g: d[1], b: d[2] };
  });
}
