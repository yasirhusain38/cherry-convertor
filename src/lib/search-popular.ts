export type SearchChip = { href: string; label: string };

export type SearchBrowse = {
  slot: string;
  clock: string;
  now: SearchChip[];
  frequent: SearchChip[];
  more: SearchChip[];
};

function uniqueChips(items: SearchChip[]): SearchChip[] {
  const seen = new Set<string>();
  const out: SearchChip[] = [];
  for (const item of items) {
    if (seen.has(item.href)) continue;
    seen.add(item.href);
    out.push(item);
  }
  return out;
}

function rotate(items: SearchChip[], take: number, offset: number): SearchChip[] {
  const list = uniqueChips(items);
  if (!list.length) return [];
  const n = list.length;
  const start = ((offset % n) + n) % n;
  const count = Math.min(take, n);
  const out: SearchChip[] = [];
  for (let i = 0; i < count; i += 1) out.push(list[(start + i) % n]!);
  return uniqueChips(out);
}

const MORNING: SearchChip[] = [
  { href: "/tools/resize-image-to-50kb", label: "50KB photo" },
  { href: "/tools/compress-image", label: "Compress" },
  { href: "/tools/heic-to-jpg", label: "HEIC to JPG" },
  { href: "/tools/aadhaar-photo-resizer", label: "Aadhaar photo" },
  { href: "/tools/passport-photo-maker", label: "Passport photo" },
  { href: "/tools/us-visa-photo-ds-160", label: "DS-160" },
  { href: "/finance/india-emi-calculator", label: "India EMI" },
  { href: "/finance/gst-calculator-india", label: "GST" },
  { href: "/tools/compress-pdf-to-2mb", label: "PDF to 2MB" },
  { href: "/finance/india-take-home-salary", label: "Take-home" },
  { href: "/tools/jpg-to-pdf", label: "JPG to PDF" },
  { href: "/countries/india", label: "India" },
];

const MIDDAY: SearchChip[] = [
  { href: "/finance/currency-converter", label: "Currency" },
  { href: "/tools/time-zone-converter", label: "EST to GMT" },
  { href: "/tools/meeting-planner", label: "Meeting planner" },
  { href: "/tools/world-clock", label: "World clock" },
  { href: "/tools/qr-code-generator", label: "QR code" },
  { href: "/tools/pdf-merger", label: "Merge PDF" },
  { href: "/tools/compress-image", label: "Compress" },
  { href: "/tools/ocr-image-to-text", label: "OCR" },
  { href: "/tools/word-counter", label: "Word count" },
  { href: "/finance/loan-emi-calculator", label: "EMI" },
  { href: "/tools/wifi-speed-test", label: "Speed test" },
  { href: "/countries/uae", label: "UAE" },
];

const AFTERNOON: SearchChip[] = [
  { href: "/tools/compress-bank-statement", label: "Bank statement" },
  { href: "/tools/pdf-to-word", label: "PDF to Word" },
  { href: "/tools/exif-metadata-remover", label: "Strip EXIF" },
  { href: "/tools/json-formatter", label: "JSON" },
  { href: "/tools/contrast-checker", label: "WCAG contrast" },
  { href: "/tools/color-picker", label: "Color picker" },
  { href: "/tools/hex-to-rgb", label: "HEX to RGB" },
  { href: "/tools/ocr-image-to-text", label: "OCR" },
  { href: "/tools/background-remover", label: "Background" },
  { href: "/tools/us-passport-photo", label: "US 2×2" },
  { href: "/tools/uk-passport-photo", label: "UK 35×45" },
  { href: "/finance/currency-converter", label: "Currency" },
];

const EVENING: SearchChip[] = [
  { href: "/tools/wifi-speed-test", label: "Speed test" },
  { href: "/tools/qr-code-generator", label: "QR code" },
  { href: "/tools/spin-the-wheel", label: "Spin the wheel" },
  { href: "/tools/coin-toss", label: "Coin toss" },
  { href: "/tools/mouse-checker", label: "Mouse checker" },
  { href: "/tools/photo-editor", label: "Photo editor" },
  { href: "/tools/meme-generator", label: "Meme" },
  { href: "/tools/collage-maker", label: "Collage" },
  { href: "/tools/color-palette-from-image", label: "Palette" },
  { href: "/tools/resize-image-to-50kb", label: "50KB" },
  { href: "/tools/pdf-merger", label: "Merge PDF" },
  { href: "/tools/server-down-checker", label: "Server down?" },
];

const NIGHT: SearchChip[] = [
  { href: "/tools/uuid-generator", label: "UUID" },
  { href: "/tools/regex-tester", label: "Regex" },
  { href: "/tools/json-formatter", label: "JSON" },
  { href: "/tools/sha256-hash", label: "SHA-256" },
  { href: "/tools/jwt-decoder", label: "JWT decode" },
  { href: "/tools/wifi-speed-test", label: "Speed test" },
  { href: "/tools/spin-the-wheel", label: "Spin the wheel" },
  { href: "/tools/coin-toss", label: "Coin toss" },
  { href: "/tools/compress-image", label: "Compress" },
  { href: "/tools/age-calculator", label: "Age calculator" },
  { href: "/tools/unix-timestamp-converter", label: "Unix time" },
  { href: "/tools/mouse-checker", label: "Mouse checker" },
];

const WEEKEND_EXTRA: SearchChip[] = [
  { href: "/tools/spin-the-wheel", label: "Spin the wheel" },
  { href: "/tools/coin-toss", label: "Coin toss" },
  { href: "/tools/mouse-checker", label: "Mouse checker" },
  { href: "/tools/collage-maker", label: "Collage" },
];

const FREQUENT: SearchChip[] = [
  { href: "/tools/compress-image", label: "Compress image" },
  { href: "/tools/resize-image-to-50kb", label: "50KB" },
  { href: "/tools/jpg-to-pdf", label: "JPG to PDF" },
  { href: "/tools/pdf-merger", label: "PDF merger" },
  { href: "/tools/passport-photo-maker", label: "Passport photo" },
  { href: "/tools/us-passport-photo", label: "US 2×2" },
  { href: "/tools/heic-to-jpg", label: "HEIC to JPG" },
  { href: "/finance/loan-emi-calculator", label: "EMI" },
  { href: "/finance/currency-converter", label: "Currency" },
  { href: "/tools/qr-code-generator", label: "QR code" },
  { href: "/tools/wifi-speed-test", label: "Speed test" },
  { href: "/tools/hex-to-rgb", label: "HEX to RGB" },
  { href: "/countries/india", label: "India" },
  { href: "/countries/united-states", label: "United States" },
  { href: "/tools/aadhaar-photo-resizer", label: "Aadhaar" },
  { href: "/tools/ocr-image-to-text", label: "OCR" },
];

const MORE: SearchChip[] = [
  { href: "/tools/spin-the-wheel", label: "Spin the wheel" },
  { href: "/tools/coin-toss", label: "Coin toss" },
  { href: "/tools/mouse-checker", label: "Mouse checker" },
  { href: "/tools/server-down-checker", label: "Server down" },
  { href: "/tools/word-counter", label: "Word counter" },
  { href: "/tools/json-formatter", label: "JSON formatter" },
  { href: "/tools/uuid-generator", label: "UUID" },
  { href: "/tools/contrast-checker", label: "Contrast" },
  { href: "/tools/age-calculator", label: "Age calculator" },
  { href: "/tools/meeting-planner", label: "Meeting planner" },
  { href: "/tools/exif-metadata-remover", label: "EXIF remover" },
  { href: "/tools/background-remover", label: "Background remover" },
  { href: "/tools/pdf-to-word", label: "PDF to Word" },
  { href: "/finance", label: "All finance" },
  { href: "/countries", label: "All countries" },
  { href: "/tools", label: "All tools" },
];

function slotFor(hour: number): { name: string; pool: SearchChip[] } {
  if (hour >= 5 && hour < 11) return { name: "Morning", pool: MORNING };
  if (hour >= 11 && hour < 14) return { name: "Midday", pool: MIDDAY };
  if (hour >= 14 && hour < 18) return { name: "Afternoon", pool: AFTERNOON };
  if (hour >= 18 && hour < 22) return { name: "Evening", pool: EVENING };
  return { name: "Night", pool: NIGHT };
}

export function searchBrowse(now: Date): SearchBrowse {
  const hour = now.getHours();
  const minute = now.getMinutes();
  const offset = hour * 12 + Math.floor(minute / 5);
  const weekend = now.getDay() === 0 || now.getDay() === 6;
  const slot = slotFor(hour);
  const pool = weekend ? [...WEEKEND_EXTRA, ...slot.pool] : slot.pool;
  const clock = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(now);
  return {
    slot: slot.name,
    clock,
    now: rotate(pool, 12, offset),
    frequent: rotate(FREQUENT, 12, Math.floor(offset / 3)),
    more: rotate(MORE, 14, offset + 4),
  };
}
