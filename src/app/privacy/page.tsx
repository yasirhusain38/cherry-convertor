import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Cherry Converter processes images in your browser. We do not upload, store, or sell your photos. Read the full privacy policy.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <article className="container-page prose-site max-w-3xl py-16">
      <p className="label">Legal</p>
      <h1 className="display mt-3 text-5xl">Privacy policy</h1>
      <p className="mt-6">Last updated 29 August 2026.</p>
      <h2>Images never leave your browser</h2>
      <p>
        Compress, resize, convert, crop, DPI, document photo, signature, and PDF
        tools run on your device. {SITE.name} does not receive the binary contents
        of those files. Closing the tab discards them.
      </p>
      <h2>What we may collect</h2>
      <ul>
        <li>
          Anonymous page analytics via Google Analytics (measurement ID
          G-G6QNRC4QBL): pages viewed, device type, and approximate location.
          This does not include your photos.
        </li>
        <li>Whatever you choose to send to {SITE.email} by email.</li>
      </ul>
      <h2>Cookies</h2>
      <p>
        Google Analytics may set cookies such as <code>_ga</code> to distinguish
        browsers. Image tools still run on your device; those cookies are not
        used to upload or store photographs.
      </p>
      <h2>Third-party code</h2>
      <p>
        HEIC decoding uses heic2any. PDF export uses jsPDF. PDF merge/split uses
        pdf-lib. ZIP export uses JSZip. OCR uses Tesseract.js in WebAssembly and
        may download a public English language model; your photo or PDF is not
        uploaded. QR/barcode tools use qrcode, jsQR, JsBarcode, and ZXing in
        this tab. Those libraries execute in your browser. They are not a
        file-upload API.
      </p>
      <h2>Children</h2>
      <p>
        The site is a utility, not a social network. Do not upload photographs of
        minors to any future feature that leaves the device. Current tools do not
        transmit images.
      </p>
      <h2>Contact</h2>
      <p>
        Privacy questions: {SITE.email}
      </p>
    </article>
  );
}
