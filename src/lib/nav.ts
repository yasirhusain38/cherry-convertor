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
      { href: "/tools/heic-to-jpg", label: "HEIC to JPG" },
      { href: "/tools/compress-image", label: "Compress image" },
      { href: "/tools/jpg-to-pdf", label: "JPG to PDF" },
      { href: "/tools/resize-image-to-50kb", label: "Resize to 50KB" },
      { href: "/tools/ocr-image-to-text", label: "OCR" },
      { href: "/tools/convert", label: "Convert" },
      { href: "/tools", label: "All tools" },
    ],
  },
  {
    id: "pdf",
    label: "PDF",
    href: "/tools/pdf-merger",
    items: [
      { href: "/tools/compress-pdf-to-2mb", label: "Compress to 2MB" },
      { href: "/tools/pdf-merger", label: "Merge PDF" },
      { href: "/tools/sign-pdf", label: "Sign PDF" },
      { href: "/tools/fill-pdf", label: "Fill PDF" },
      { href: "/tools/pdf-to-word", label: "PDF to Word" },
      { href: "/tools/pdf-to-excel", label: "PDF to Excel" },
      { href: "/tools/pdf-to-jpg", label: "PDF to JPG" },
      { href: "/tools/organize-pdf", label: "Organize PDF" },
    ],
  },
  {
    id: "photos",
    label: "Photos",
    href: "/tools/passport-photo-maker",
    items: [
      { href: "/tools/us-passport-photo", label: "US 2×2" },
      { href: "/tools/us-visa-photo-ds-160", label: "DS-160" },
      { href: "/tools/uk-passport-photo", label: "UK 35×45" },
      { href: "/tools/passport-photo-maker", label: "Passport photo" },
      { href: "/tools/canada-visa-photo", label: "Canada visa" },
      { href: "/passport-photo-sizes", label: "Passport sizes" },
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
      { href: "/tools/heic-to-pdf", label: "HEIC to PDF" },
      { href: "/tools/highlight-pdf", label: "Highlight PDF" },
      { href: "/tools/compare-pdf", label: "Compare PDF" },
      { href: "/tools/pdf-to-csv", label: "PDF to CSV" },
      { href: "/tools/redact-pdf", label: "Redact PDF" },
      { href: "/tools/bank-statement-to-excel", label: "Statement to Excel" },
      { href: "/tools/time-zone-converter", label: "Time zones" },
      { href: "/tools/qr-code-generator", label: "QR code" },
      { href: "/tools/wifi-speed-test", label: "Speed test" },
      { href: "/regions", label: "Regions" },
    ],
  },
];
