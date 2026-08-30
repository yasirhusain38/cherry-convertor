import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "Cherry Converter is a free, privacy-first tools studio. Compress images, merge PDFs, run OCR, and prepare Indian document photos entirely in the browser.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <article>
      <section className="border-b border-[var(--line)]">
        <div className="container-page py-16 md:py-20">
          <p className="label">Studio</p>
          <h1 className="display mt-4 max-w-4xl text-5xl md:text-7xl">
            Tools that never leave <span className="display-italic">this device.</span>
          </h1>
          <p className="mt-8 max-w-xl text-base leading-7 text-[var(--ink-soft)]">
            {SITE.name} is built for people who need a 50 KB JPEG at 11 p.m. before a form closes — and who would
            rather not upload a face photo to a random server to get it.
          </p>
        </div>
      </section>
      <section className="container-page grid gap-16 py-20 md:grid-cols-3">
        {[
          { n: "01", t: "People are not data", d: "Photos of faces are not marketing. They stay in the tab." },
          { n: "02", t: "Named sizes", d: "Indian document frames deserve dedicated pages, not a hidden dropdown." },
          { n: "03", t: "Get out of the way", d: "Load fast, speak plainly, finish the file." },
        ].map((item) => (
          <div key={item.n}>
            <p className="label">{item.n}</p>
            <h2 className="display mt-4 text-3xl">{item.t}</h2>
            <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">{item.d}</p>
          </div>
        ))}
      </section>
      <section className="container-page max-w-3xl pb-24">
        <p className="label">How it works</p>
        <p className="mt-6 text-base leading-7 text-[var(--ink-soft)]">
          Almost every tool uses the HTML5 Canvas API and the File API. HEIC files are decoded in this tab. PDFs are
          assembled with jsPDF and merged with pdf-lib. OCR uses Tesseract.js. ZIPs are packed with JSZip. None of
          those steps require a Cherry Converter server.
        </p>
        <p className="mt-8 text-base leading-7 text-[var(--ink-soft)]">
          Questions — <Link href="/contact" className="text-brand">contact the desk</Link>.
        </p>
      </section>
    </article>
  );
}
