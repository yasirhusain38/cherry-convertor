export const SITE = {
  name: "Cherry Converter",
  shortName: "Cherry",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://cherryconverter.com",
  locale: "en_IN",
  tagline: "Free tools. Processed in your browser.",
  description:
    "Compress images, merge PDFs, run OCR, generate QR codes, and prepare Indian document photos entirely in your browser. Cherry Converter never uploads your files.",
  email: "hello@cherryconverter.com",
  twitter: "@cherryconverter",
  keywords: [
    "image compressor",
    "resize image to 50kb",
    "jpg to pdf",
    "passport photo maker",
    "aadhaar photo resizer",
    "pan card photo",
    "heic to jpg",
    "free image tools",
  ],
} as const;

export const ACCEPT_IMAGES =
  "image/jpeg,image/jpg,image/png,image/webp,image/gif,image/bmp,image/heic,image/heif,.heic,.heif,.jpg,.jpeg,.png,.webp,.gif,.bmp";

export const ACCEPT_VIDEO =
  "video/mp4,video/webm,video/quicktime,video/x-m4v,.mp4,.webm,.mov,.m4v,.mkv";

export const ACCEPT_PDF = "application/pdf,.pdf";

export const ACCEPT_PDF_OR_IMAGES = `${ACCEPT_PDF},${ACCEPT_IMAGES}`;

export function absoluteUrl(path = "/") {
  const base = SITE.url.replace(/\/$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}
