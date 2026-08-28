import Link from "next/link";
import { CATEGORIES, TOOLS } from "@/lib/tools";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[#B81D24] bg-[#221F1F]">
      <div className="bg-[#F2013F] text-[#F5F5F1]">
        <div className="container-page flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="label label-light">Privacy</p>
          <p className="text-sm tracking-tight">
            Files are processed in your browser — we never upload your photos or PDFs.
          </p>
        </div>
      </div>
      <div className="container-page grid gap-12 py-16 md:grid-cols-12">
        <div className="md:col-span-4">
          <Logo inverted />
          <p className="mt-4 max-w-xs text-sm leading-6 text-[var(--ink-soft)]">
            Free image tools for the open web. Compress, resize, convert, and
            prepare Indian document photos without a server in the loop.
          </p>
        </div>
        {CATEGORIES.slice(0, 4).map((category) => (
          <div key={category.id} className="md:col-span-2">
            <p className="label mb-4">{category.label}</p>
            <ul className="grid gap-2 text-sm text-[var(--ink-soft)]">
              {TOOLS.filter((tool) => tool.category === category.id)
                .slice(0, 5)
                .map((tool) => (
                  <li key={tool.slug}>
                    <Link href={`/tools/${tool.slug}`} className="hover:text-brand">
                      {tool.name}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-[var(--line)]">
        <div className="container-page flex flex-col gap-3 py-5 text-xs tracking-[0.12em] text-[var(--ink-faint)] uppercase sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Cherry Converter</p>
          <div className="flex flex-wrap gap-5">
            <Link href="/about">About</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/blog">Journal</Link>
            <Link href="/search">Search</Link>
            <Link href="/countries">Countries</Link>
            <Link href="/finance">Finance</Link>
            <Link href="/regions">Regions</Link>
            <Link href="/tools">All tools</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
