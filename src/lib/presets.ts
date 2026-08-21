import { PHOTO_SPECS } from "@/data/photo-specs";

export type PhotoPreset = {
  id: string;
  label: string;
  region: string;
  widthMm: number;
  heightMm: number;
  dpi: number;
  background: string;
  notes: string;
};

export const PHOTO_PRESETS: PhotoPreset[] = PHOTO_SPECS.map((spec) => ({
  id: spec.id,
  label: spec.label,
  region: spec.country,
  widthMm: spec.widthMm,
  heightMm: spec.heightMm,
  dpi: spec.dpi,
  background: spec.background,
  notes: spec.notes,
}));

export const SIGNATURE_PRESETS = [
  {
    id: "std-6x2",
    label: "Standard 6 × 2 cm",
    widthMm: 60,
    heightMm: 20,
    dpi: 200,
    targetKB: 20,
  },
  {
    id: "compact",
    label: "Compact 140 × 60 px",
    widthMm: 18,
    heightMm: 8,
    dpi: 200,
    targetKB: 10,
  },
  {
    id: "pan-sign",
    label: "PAN / form signature",
    widthMm: 50,
    heightMm: 20,
    dpi: 200,
    targetKB: 20,
  },
] as const;

export function mmToPx(mm: number, dpi: number): number {
  return Math.round((mm / 25.4) * dpi);
}

export function presetPixels(preset: Pick<PhotoPreset, "widthMm" | "heightMm" | "dpi">) {
  return {
    width: mmToPx(preset.widthMm, preset.dpi),
    height: mmToPx(preset.heightMm, preset.dpi),
  };
}

export function getPreset(id: string): PhotoPreset {
  return PHOTO_PRESETS.find((p) => p.id === id) ?? PHOTO_PRESETS[0];
}
