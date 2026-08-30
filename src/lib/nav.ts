export type NavLink = { href: string; label: string };

export type NavGroup = {
  id: string;
  label: string;
  href: string;
  items: NavLink[];
};

/** Top bar + mobile menu. Short lists, high-intent links only. */
export const NAV_GROUPS: NavGroup[] = [
  {
    id: "tools",
    label: "Tools",
    href: "/tools",
    items: [
      { href: "/tools/compress-image", label: "Compress image" },
      { href: "/tools/resize-image-to-50kb", label: "Resize to 50KB" },
      { href: "/tools/convert", label: "Convert" },
      { href: "/tools/heic-to-jpg", label: "HEIC to JPG" },
      { href: "/tools/jpg-to-pdf", label: "JPG to PDF" },
      { href: "/tools/qr-code-generator", label: "QR code" },
      { href: "/tools/color-picker", label: "Color picker" },
      { href: "/tools/ocr-image-to-text", label: "OCR" },
      { href: "/tools/url-media-downloader", label: "URL downloader" },
      { href: "/tools", label: "All tools" },
    ],
  },
  {
    id: "pdf",
    label: "PDF",
    href: "/tools/pdf-merger",
    items: [
      { href: "/tools/pdf-merger", label: "Merge PDF" },
      { href: "/tools/pdf-splitter", label: "Split PDF" },
      { href: "/tools/pdf-to-word", label: "PDF to Word" },
      { href: "/tools/pdf-to-png", label: "PDF to PNG" },
      { href: "/tools/compress-pdf-to-2mb", label: "Compress to 2MB" },
      { href: "/tools/pdf-metadata-remover", label: "Strip metadata" },
      { href: "/tools/pdf-to-text", label: "PDF to text" },
    ],
  },
  {
    id: "photos",
    label: "Photos",
    href: "/tools/passport-photo-maker",
    items: [
      { href: "/tools/passport-photo-maker", label: "Passport photo" },
      { href: "/tools/us-passport-photo", label: "US 2×2" },
      { href: "/tools/us-visa-photo-ds-160", label: "DS-160" },
      { href: "/tools/uk-passport-photo", label: "UK 35×45" },
      { href: "/tools/aadhaar-photo-resizer", label: "Aadhaar" },
      { href: "/tools/emirates-id-photo", label: "Emirates ID" },
      { href: "/countries", label: "All countries" },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    href: "/finance",
    items: [
      { href: "/finance/currency-converter", label: "Currency" },
      { href: "/finance/loan-emi-calculator", label: "EMI" },
      { href: "/finance/gst-calculator-india", label: "GST" },
      { href: "/finance/india-sip-calculator", label: "SIP" },
      { href: "/finance/india-income-tax-calculator", label: "India tax" },
      { href: "/finance/us-mortgage-calculator", label: "US mortgage" },
      { href: "/finance", label: "All calculators" },
    ],
  },
  {
    id: "more",
    label: "More",
    href: "/tools",
    items: [
      { href: "/tools/wifi-speed-test", label: "Speed test" },
      { href: "/tools/time-zone-converter", label: "Time zones" },
      { href: "/tools/spin-the-wheel", label: "Spin the wheel" },
      { href: "/tools/coin-toss", label: "Coin toss" },
      { href: "/tools/mouse-checker", label: "Mouse checker" },
      { href: "/tools/server-down-checker", label: "Server down" },
      { href: "/tools/uuid-generator", label: "UUID" },
      { href: "/regions", label: "Regions" },
    ],
  },
];
