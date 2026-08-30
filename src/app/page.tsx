import Link from "next/link";
import { Marquee } from "@/components/Marquee";
import { CountUp } from "@/components/motion/CountUp";
import { Magnetic } from "@/components/motion/Magnetic";
import { Reveal } from "@/components/motion/Reveal";
import { ToolCard } from "@/components/ToolCard";
import { SITE } from "@/lib/site";
import { CATEGORIES, popularTools } from "@/lib/tools";

const STATS = [
  { k: "730+", v: "Dedicated tools" },
  { k: "140+", v: "Country hubs" },
  { k: "300+", v: "Finance calculators" },
  { k: "0", v: "Server uploads" },
];

export default function Home() {
  const popular = popularTools();

  return (
    <>
      <section className="relative overflow-x-hidden bg-[#F2013F] text-[#F5F5F1]">
        <div className="hero-grid pointer-events-none absolute inset-0" />
        <div className="container-page relative py-20 md:py-28">
          <p className="label label-light hero-copy">Cherry Converter  /  zero uplink</p>
          <h1 className="display mt-6 max-w-none text-5xl leading-[1.08] sm:text-6xl md:text-7xl lg:text-[5.5rem]">
            Free image tools.
            <br />
            100% Privacy.
          </h1>
          <p className="hero-copy-delay mt-8 max-w-xl text-base leading-7 text-[#F5F5F1]/80 md:text-lg">
            Compress to any KB, merge PDFs, generate a QR code, run OCR, or make an Indian passport photo — entirely
            in the browser. {SITE.name} never sees the file.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Magnetic>
              <Link href="/tools/resize-image-to-50kb" className="btn btn-dark">
                Resize to 50KB
              </Link>
            </Magnetic>
            <Magnetic>
              <Link href="/tools" className="btn border border-[#F5F5F1]/40 text-[#F5F5F1]">
                View all tools
              </Link>
            </Magnetic>
          </div>
        </div>
        <div className="relative border-t border-[#B81D24]">
          <dl className="container-page grid grid-cols-2 md:grid-cols-4">
            {STATS.map((stat) => {
              const bits = stat.k.match(/^(\d+)(.*)$/);
              return (
                <div key={stat.v} className="border-[#B81D24] py-6 md:border-l md:px-8 md:first:border-l-0 md:first:pl-0">
                  <dt className="label label-light">{stat.v}</dt>
                  <dd className="stat mt-2 text-3xl text-[#F5F5F1]">
                    {bits ? <CountUp value={Number(bits[1])} suffix={bits[2] ?? ""} /> : stat.k}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      </section>

      <Marquee />

      <section className="container-page py-24">
        <p className="label">On every tool</p>
        <h2 className="display mt-3 max-w-3xl text-4xl md:text-6xl">The work stays on this machine.</h2>
        <div className="mt-12 grid gap-px bg-[var(--line)] md:grid-cols-4">
          {[
            { n: "01", t: "World formats", d: "JPG, PDF, ICO, SVG, HTML, JSON, MP4. Encode what the browser can." },
            { n: "02", t: "Type any size", d: "37 KB, 80 KB, 1.5 MB. The compressor hunts until it fits." },
            { n: "03", t: "Enhance", d: "Rotate, flip, B&W, invert, brightness, contrast, watermark." },
            { n: "04", t: "Copy or download", d: "One click to save or copy. Still never uploaded." },
          ].map((item) => (
            <article key={item.t} className="bg-[#221F1F] p-6 md:p-8">
              <p className="label">{item.n}</p>
              <h3 className="mt-8 text-xl tracking-tight">{item.t}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">{item.d}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container-page py-24">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="label">01  /  Capabilities</p>
            <h2 className="display mt-3 text-4xl md:text-6xl">Popular tools</h2>
          </div>
          <Link href="/tools" className="label text-brand no-underline">
            Full inventory →
          </Link>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {popular.map((tool, index) => (
            <ToolCard key={tool.slug} tool={tool} index={index} />
          ))}
        </div>
      </section>

      <section className="border-y border-[var(--line)]">
        <div className="container-page py-24">
          <p className="label">02  /  Why browser-side</p>
          <h2 className="display mt-3 max-w-4xl text-4xl md:text-6xl">
            No upload pipeline.
            <span className="display-italic"> By architecture.</span>
          </h2>
          <div className="mt-16 grid gap-12 md:grid-cols-3">
            {[
              {
                t: "Privacy",
                d: "Photos are decoded, drawn, and encoded with the Canvas API on your machine. There is nothing to disable.",
              },
              {
                t: "Places",
                d: "Aadhaar and PAN. US 2×2. DS-160 240KB. UK 35×45. Emirates ID. 2MB PDFs.",
              },
              {
                t: "Quiet",
                d: "No account wall. No watermark. The work stays in the foreground.",
              },
            ].map((item, index) => (
              <Reveal key={item.t} delay={index * 80}>
                <article>
                  <p className="label">{String(index + 1).padStart(2, "0")}</p>
                  <h3 className="display mt-4 text-3xl">{item.t}</h3>
                  <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">{item.d}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-24">
        <p className="label">03  /  Document stack</p>
        <h2 className="display mt-3 text-4xl md:text-6xl">India + international</h2>
        <p className="mt-14 label">Photo sizes</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/tools/us-passport-photo", place: "United States", t: "2 × 2 in", d: "Passport, DS-160, Green Card" },
            { href: "/tools/uk-passport-photo", place: "UK / Schengen", t: "35 × 45 mm", d: "Biometric visa and passport" },
            { href: "/tools/emirates-id-photo", place: "United Arab Emirates", t: "Emirates ID", d: "ID photo and 100 KB visa" },
            { href: "/tools/aadhaar-photo-resizer", place: "India", t: "Aadhaar + PAN", d: "20–50 KB document photos" },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="card card-hover flex h-full flex-col p-6 no-underline">
              <p className="label">{item.place}</p>
              <h3 className="display mt-8 text-3xl">{item.t}</h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-[var(--ink-soft)]">{item.d}</p>
              <p className="mt-8 text-xs tracking-[0.16em] text-brand uppercase">Open tool →</p>
            </Link>
          ))}
        </div>
        <p className="mt-16 label">Money</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/finance/india-emi-calculator", place: "India", t: "EMI", d: "Home, car, and personal loans" },
            { href: "/finance/us-401k-calculator", place: "United States", t: "401(k)", d: "Retirement math in this tab" },
            { href: "/finance/uk-stamp-duty-calculator", place: "United Kingdom", t: "Stamp duty", d: "England and Northern Ireland SDLT" },
            { href: "/finance", place: "World", t: "GST, VAT, tax", d: "Calculators by country" },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="card card-hover flex h-full flex-col p-6 no-underline">
              <p className="label">{item.place}</p>
              <h3 className="display mt-8 text-3xl">{item.t}</h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-[var(--ink-soft)]">{item.d}</p>
              <p className="mt-8 text-xs tracking-[0.16em] text-brand uppercase">Open calculator →</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-[#F2013F] text-[#F5F5F1]">
        <div className="container-page flex flex-col items-start justify-between gap-10 py-24 md:flex-row md:items-end">
          <div>
            <p className="label label-light">04  /  Launch</p>
            <h2 className="display mt-4 text-4xl md:text-7xl">
              Start with
              <br />
              <span className="display-italic">fifty kilobytes.</span>
            </h2>
          </div>
          <Magnetic>
            <Link href="/tools/resize-image-to-50kb" className="btn btn-dark">
              Open compressor
            </Link>
          </Magnetic>
        </div>
      </section>

      <section className="container-page py-20">
        <p className="label">Browse by family</p>
        <div className="mt-8 flex flex-wrap gap-3">
          {CATEGORIES.map((category) => (
            <Link
              key={category.id}
              href={`/tools#${category.id}`}
              className="rounded-full border border-[#F2013F] px-4 py-2 text-xs tracking-[0.16em] text-[#F2013F] uppercase no-underline hover:bg-[#F2013F] hover:text-[#F5F5F1]"
            >
              {category.label}
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
