"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Logo } from "./Logo";
import { CATEGORIES, TOOLS } from "@/lib/tools";

const NAV = [
  { href: "/tools/compress-image", label: "Compress" },
  { href: "/tools/resize-image", label: "Resize" },
  { href: "/tools/convert", label: "Convert" },
  { href: "/tools/passport-photo-maker", label: "Documents" },
  { href: "/tools", label: "All tools" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const home = pathname === "/";

  useEffect(() => {
    setOpen(false);
    setQuery("");
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TOOLS.filter((tool) => {
      if (!q) return true;
      return [tool.name, tool.slug, tool.lede, ...tool.keywords].join(" ").toLowerCase().includes(q);
    });
  }, [query]);

  return (
    <header
      className={`sticky top-0 z-50 border-b text-[#F5F5F1] ${
        home
          ? "border-[#B81D24] bg-[#F2013F]"
          : "border-[var(--line)] bg-[#221F1F]"
      }`}
    >
      {home ? null : <div className="h-1 bg-[#F2013F]" aria-hidden />}
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <Logo inverted />
        <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`label no-underline transition-colors ${
                home
                  ? "label-light hover:opacity-100 opacity-90"
                  : "text-[#F5F5F1]/70 hover:text-[#F5F5F1]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          className="btn btn-dark px-4"
          aria-expanded={open}
          aria-controls="site-menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open ? (
        <div
          id="site-menu"
          className="fixed inset-0 z-[60] flex flex-col bg-[#221F1F] text-[#F5F5F1]"
          role="dialog"
          aria-modal="true"
          aria-label="Choose a tool"
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#F5F5F1]/15 px-5">
            <p className="text-sm tracking-[0.16em] uppercase">Choose a tool</p>
            <button type="button" className="btn btn-dark px-4" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
          <div className="container-page w-full shrink-0 py-4">
            <input
              className="field bg-[#221F1F] text-[#F5F5F1]"
              value={query}
              placeholder="Search compress, 50KB, watermark, Aadhaar…"
              autoFocus
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto pb-10">
            <div className="container-page grid gap-8">
              {CATEGORIES.map((category) => {
                const tools = filtered.filter((tool) => tool.category === category.id);
                if (!tools.length) return null;
                return (
                  <section key={category.id}>
                    <p className="label mb-3 text-[#F2013F]">{category.label}</p>
                    <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                      {tools.map((tool) => (
                        <li key={tool.slug}>
                          <Link
                            href={`/tools/${tool.slug}`}
                            className="block rounded-xl border border-[#F5F5F1]/15 px-4 py-3 text-[#F5F5F1] no-underline hover:border-[#F2013F] hover:bg-[#F2013F]"
                          >
                            <span className="block text-base tracking-tight">{tool.name}</span>
                            <span className="mt-1 block text-xs leading-5 text-[#F5F5F1]/70">
                              {tool.lede.slice(0, 72)}
                              {tool.lede.length > 72 ? "…" : ""}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
              <section className="border-t border-[#F5F5F1]/15 pt-6">
                <p className="label mb-3 text-[#F2013F]">Site</p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/about" className="btn btn-ghost text-[#F5F5F1]">
                    About
                  </Link>
                  <Link href="/privacy" className="btn btn-ghost text-[#F5F5F1]">
                    Privacy
                  </Link>
                  <Link href="/contact" className="btn btn-ghost text-[#F5F5F1]">
                    Contact
                  </Link>
                </div>
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
