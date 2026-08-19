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

export const PHOTO_PRESETS: PhotoPreset[] = [
  {
    id: "in-passport",
    label: "India Passport / OCI",
    region: "India",
    widthMm: 51,
    heightMm: 51,
    dpi: 300,
    background: "#FFFFFF",
    notes: "51×51 mm (2×2 in). White background. Typical upload 10–50 KB.",
  },
  {
    id: "in-visa",
    label: "India Visa",
    region: "India",
    widthMm: 51,
    heightMm: 51,
    dpi: 300,
    background: "#FFFFFF",
    notes: "Square 51×51 mm, white background, recent colour photo.",
  },
  {
    id: "in-aadhaar",
    label: "Aadhaar / UIDAI",
    region: "India",
    widthMm: 35,
    heightMm: 45,
    dpi: 300,
    background: "#FFFFFF",
    notes: "3.5×4.5 cm portrait. Most portals accept 20–50 KB JPEG.",
  },
  {
    id: "in-pan",
    label: "PAN Card",
    region: "India",
    widthMm: 25,
    heightMm: 35,
    dpi: 300,
    background: "#FFFFFF",
    notes: "2.5×3.5 cm. Keep file under 50 KB for NSDL / Protean uploads.",
  },
  {
    id: "in-exam",
    label: "Exam / SSC / UPSC / NEET",
    region: "India",
    widthMm: 35,
    heightMm: 45,
    dpi: 200,
    background: "#FFFFFF",
    notes: "Stamp-size 3.5×4.5 cm. Many forms cap at 10–100 KB.",
  },
  {
    id: "in-college",
    label: "College Admission",
    region: "India",
    widthMm: 35,
    heightMm: 45,
    dpi: 300,
    background: "#FFFFFF",
    notes: "Standard Indian application photo, usually 10–50 KB JPEG.",
  },
  {
    id: "in-govt",
    label: "Government Form",
    region: "India",
    widthMm: 35,
    heightMm: 45,
    dpi: 200,
    background: "#FFFFFF",
    notes: "Generic Indian e-governance photo. Target 20–50 KB.",
  },
  {
    id: "us-passport",
    label: "US Passport",
    region: "United States",
    widthMm: 50.8,
    heightMm: 50.8,
    dpi: 300,
    background: "#FFFFFF",
    notes: "2×2 inch, white background, face 1–1.375 in from chin to crown.",
  },
  {
    id: "uk-passport",
    label: "UK / Schengen",
    region: "UK / EU",
    widthMm: 35,
    heightMm: 45,
    dpi: 300,
    background: "#FFFFFF",
    notes: "35×45 mm. Light grey or white background depending on country.",
  },
  {
    id: "ca-passport",
    label: "Canada Passport",
    region: "Canada",
    widthMm: 50,
    heightMm: 70,
    dpi: 300,
    background: "#FFFFFF",
    notes: "50×70 mm. Neutral expression, face centred.",
  },
];

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
