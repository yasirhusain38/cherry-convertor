export const SITE = {
  name: "Cherry Convertor",
  shortName: "Cherry",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://cherryconvertor.com",
  locale: "en_IN",
  tagline: "Free image tools. Processed in your browser.",
  description:
    "Compress, resize, convert, and prepare Indian document photos entirely in your browser. Cherry Convertor never uploads your images.",
  email: "hello@cherryconvertor.com",
  twitter: "@cherryconvertor",
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

export function absoluteUrl(path = "/") {
  const base = SITE.url.replace(/\/$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}
