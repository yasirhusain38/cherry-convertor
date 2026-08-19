import Link from "next/link";
import { ToolCard } from "@/components/ToolCard";
import { SITE } from "@/lib/site";
import { CATEGORIES, popularTools } from "@/lib/tools";

const STATS = [
  { k: "36+", v: "Dedicated tools" },
  { k: "40+", v: "Searchable formats" },
  { k: "0", v: "Server uploads" },
  { k: "IN+", v: "Global + Indian specs" },
];

export default function Home() {
  const popular = popularTools();

  return (
    <>
      <section className="relative overflow-hidden bg-[#F2013F] text-[#F5F5F1]">
        <div className="hero-grid pointer-events-none absolute inset-0" />
        <div className="container-page relative py-20 md:py-28">
          <p className="label label-light">Cherry Converter  /  zero uplink</p>
          <h1 className="display mt-6 max-w-5xl text-5xl sm:text-7xl md:text-[88px]">
            Free image tools.
            <br />
            Zero uploads.
          </h1>
          <p className="mt-8 max-w-xl text-base leading-7 text-[#F5F5F1]/80 md:text-lg">
            Compress to any KB, search any output format, watermark, rotate, or
            make an Indian passport photo — entirely in the browser. {SITE.name}{" "}
            never sees the file.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/tools/resize-image-to-50kb" className="btn btn-dark">
              Resize to 50KB
            </Link>
            <Link href="/tools" className="btn border border-[#F5F5F1]/40 text-[#F5F5F1]">
              View all tools
            </Link>
          </div>
        </div>
        <div className="relative border-t border-[#B81D24]">
          <dl className="container-page grid grid-cols-2 md:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.v} className="border-[#B81D24] py-6 md:border-l md:px-8 md:first:border-l-0 md:first:pl-0">
                <dt className="label label-light">{stat.v}</dt>
                <dd className="stat mt-2 text-3xl text-[#F5F5F1]">{stat.k}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="container-page py-16">
        <p className="label">On every tool</p>
        <div className="mt-8 grid gap-6 md:grid-cols-4">
          {[
            { t: "World formats", d: "Search JPG, PDF, ICO, SVG, HTML, JSON, MP4… Encode what the browser can." },
            { t: "Type any size", d: "37 KB, 80 KB, 1.5 MB. The compressor hunts until it fits." },
            { t: "Enhance", d: "Rotate, flip, B&W, invert, brightness, contrast, watermark." },
            { t: "Copy or download", d: "One click to save or copy. Still never uploaded." },
          ].map((item) => (
            <article key={item.t} className="card p-6">
              <h3 className="text-xl tracking-tight">{item.t}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{item.d}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container-page py-20">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="label">01  /  Capabilities</p>
            <h2 className="display mt-3 text-4xl md:text-5xl">Popular tools</h2>
          </div>
          <Link href="/tools" className="label text-brand no-underline">
            Full inventory →
          </Link>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {popular.map((tool, index) => (
            <ToolCard key={tool.slug} tool={tool} index={index} />
          ))}
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-[#221F1F]">
        <div className="container-page py-20">
          <p className="label">02  /  Why browser-side</p>
          <h2 className="display mt-3 max-w-3xl text-4xl md:text-5xl">
            Why Cherry Converter
          </h2>
          <div className="mt-12 grid gap-10 md:grid-cols-3">
            {[
              {
                t: "Privacy by architecture",
                d: "There is no upload pipeline to disable. Photos are decoded, drawn, and encoded with the Canvas API on your machine.",
              },
              {
                t: "Built for Indian forms",
                d: "50KB, 20KB, Aadhaar, PAN, passport, exam, and signature sizes are dedicated pages — not buried presets.",
              },
              {
                t: "Quiet, fast interface",
                d: "No account wall, no watermark, no clutter. A SpaceX-grade layout so the work stays in the foreground.",
              },
            ].map((item, index) => (
              <article key={item.t}>
                <p className="label">{String(index + 1).padStart(2, "0")}</p>
                <h3 className="mt-3 text-2xl tracking-tight">{item.t}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">{item.d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-20">
        <p className="label">03  /  Document stack</p>
        <h2 className="display mt-3 text-4xl">India + international</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/tools/passport-photo-maker", t: "Passport", d: "51×51 mm and global sizes" },
            { href: "/tools/aadhaar-photo-resizer", t: "Aadhaar", d: "3.5×4.5 cm, 20–50 KB" },
            { href: "/tools/pan-card-photo-resizer", t: "PAN", d: "2.5×3.5 cm + signature" },
            { href: "/tools/exam-form-photo-resizer", t: "Exam / visa", d: "SSC, NEET, Schengen" },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="card card-hover p-6 no-underline">
              <p className="label">Spec</p>
              <h3 className="mt-4 text-2xl tracking-tight">{item.t}</h3>
              <p className="mt-2 text-sm text-[var(--ink-soft)]">{item.d}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-[#B81D24] bg-[#F2013F] text-[#F5F5F1]">
        <div className="container-page flex flex-col items-start justify-between gap-8 py-20 md:flex-row md:items-center">
          <div>
            <p className="label label-light">04  /  Launch</p>
            <h2 className="display mt-3 text-4xl md:text-5xl">Start with the 50KB tool.</h2>
          </div>
          <Link href="/tools/resize-image-to-50kb" className="btn btn-dark">
            Open compressor
          </Link>
        </div>
      </section>

      <section className="container-page py-16">
        <p className="label">Browse by family</p>
        <div className="mt-6 flex flex-wrap gap-3">
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
