import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "Cherry Converter is a free, privacy-first image tools studio. Compress, resize, and prepare Indian document photos entirely in the browser.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <article className="container-page prose-site max-w-3xl py-16">
      <p className="label">Studio</p>
      <h1 className="display mt-3 text-5xl">About Cherry Converter</h1>
      <p className="mt-6">
        {SITE.name} is a free image-tools studio built for people who need a 50 KB
        JPEG at 11 p.m. before a form closes — and who would rather not upload a
        face photo to a random server to get it.
      </p>
      <h2>What we believe</h2>
      <ul>
        <li>Photos of people are not marketing data.</li>
        <li>Indian document sizes deserve dedicated pages, not a hidden dropdown.</li>
        <li>A tool should load fast, speak plainly, and get out of the way.</li>
      </ul>
      <h2>How it works</h2>
      <p>
        Almost every tool uses the HTML5 Canvas API and the File API. HEIC files
        are decoded with a lightweight in-browser library (heic2any / libheif).
        PDFs are assembled with jsPDF. ZIPs are packed with JSZip. None of those
        steps require a Cherry Converter server.
      </p>
      <h2>What is next</h2>
      <p>
        A journal for SEO explainers, an optional on-device AI background model,
        and more exam-board presets. The privacy contract does not change: if a
        feature cannot run locally, it will be labelled as such.
      </p>
      <p>
        Questions — <Link href="/contact">contact the desk</Link>.
      </p>
    </article>
  );
}
