"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Logo } from "./Logo";
import { NavDropdown } from "./NavDropdown";
import { SearchPopular } from "./SearchPopular";
import { SiteSearch } from "./SiteSearch";
import { FINANCE_TOOLS } from "@/data/finance-tools";
import { NAV_GROUPS } from "@/lib/nav";
import { searchSite } from "@/lib/search-index";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [desk, setDesk] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const home = pathname === "/";

  useEffect(() => {
    setOpen(false);
    setSearchOpen(false);
    setDesk(null);
    setQuery("");
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(false);
        setSearchOpen(true);
      }
      if (event.key === "/" && !typing && !open && !searchOpen) {
        event.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, searchOpen]);

  const siteHits = useMemo(() => (query.trim() ? searchSite(query, 24) : []), [query]);

  const financeHits = useMemo(() => {
    const q = query.trim().toLowerCase();
    const featured = [
      "india-emi-calculator",
      "india-sip-calculator",
      "gst-calculator-india",
      "us-mortgage-calculator",
      "us-401k-calculator",
      "uk-stamp-duty-calculator",
    ];
    const list = q
      ? FINANCE_TOOLS.filter((tool) =>
          [tool.name, tool.slug, tool.lede, tool.country, ...tool.keywords].join(" ").toLowerCase().includes(q),
        )
      : featured
          .map((slug) => FINANCE_TOOLS.find((tool) => tool.slug === slug))
          .filter((tool): tool is (typeof FINANCE_TOOLS)[number] => Boolean(tool));
    return list.slice(0, 18);
  }, [query]);

  const linkClass = home
    ? "label-light hover:opacity-100 opacity-90"
    : "text-[#F5F5F1]/70 hover:text-[#F5F5F1]";

  return (
    <header
      className={`sticky top-0 z-50 border-b text-[#F5F5F1] ${
        home ? "border-[#B81D24] bg-[#F2013F]" : "border-[var(--line)] bg-[#221F1F]"
      }`}
    >
      {home ? null : <div className="h-1 bg-[#F2013F]" aria-hidden />}
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo inverted />
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary">
          {NAV_GROUPS.map((group) => (
            <NavDropdown
              key={group.id}
              group={group}
              open={desk === group.id}
              onOpen={() => setDesk(group.id)}
              onClose={() => setDesk((id) => (id === group.id ? null : id))}
              linkClass={linkClass}
            />
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn btn-dark px-4"
            onClick={() => {
              setOpen(false);
              setSearchOpen(true);
            }}
          >
            Search
          </button>
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
      </div>

      <SiteSearch open={searchOpen} onClose={() => setSearchOpen(false)} />

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
              placeholder="Search EMI, GST, India, 50KB, UAE…"
              autoFocus
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto pb-10">
            <div className="container-page grid gap-8">
              {query.trim() ? (
                <>
                  {siteHits.length ? (
                    <section>
                      <p className="label mb-3 text-[#F2013F]">All matches</p>
                      <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                        {siteHits.map((hit) => (
                          <li key={hit.id}>
                            <Link
                              href={hit.href}
                              className="block rounded-xl border border-[#F5F5F1]/15 px-4 py-3 text-[#F5F5F1] no-underline hover:border-[#F2013F] hover:bg-[#F2013F]"
                            >
                              <span className="block text-base tracking-tight">{hit.title}</span>
                              <span className="mt-1 block text-xs leading-5 text-[#F5F5F1]/70">
                                {hit.group} · {hit.lede.slice(0, 64)}
                                {hit.lede.length > 64 ? "…" : ""}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <Link
                        href={`/search?q=${encodeURIComponent(query.trim())}`}
                        className="mt-3 inline-block text-sm text-[#F2013F] no-underline"
                      >
                        Open full search →
                      </Link>
                    </section>
                  ) : (
                    <p className="text-[#F5F5F1]/70">No matches. Try India, EMI, or 50KB.</p>
                  )}
                </>
              ) : (
                <>
                  <SearchPopular onPick={() => setOpen(false)} />
                  {NAV_GROUPS.map((group) => (
                    <section key={group.id}>
                      <p className="label mb-3 text-[#F2013F]">{group.label}</p>
                      <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                        {group.items.map((item) => (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              className="block rounded-xl border border-[#F5F5F1]/15 px-4 py-3 text-[#F5F5F1] no-underline hover:border-[#F2013F] hover:bg-[#F2013F]"
                              onClick={() => setOpen(false)}
                            >
                              <span className="block text-base tracking-tight">{item.label}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                  {financeHits.length ? (
                    <section>
                      <p className="label mb-3 text-[#F2013F]">Finance</p>
                      <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                        {financeHits.map((tool) => (
                          <li key={tool.slug}>
                            <Link
                              href={`/finance/${tool.slug}`}
                              className="block rounded-xl border border-[#F5F5F1]/15 px-4 py-3 text-[#F5F5F1] no-underline hover:border-[#F2013F] hover:bg-[#F2013F]"
                            >
                              <span className="block text-base tracking-tight">{tool.name}</span>
                              <span className="mt-1 block text-xs leading-5 text-[#F5F5F1]/70">{tool.country}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}
                </>
              )}
              <section className="border-t border-[#F5F5F1]/15 pt-6">
                <p className="label mb-3 text-[#F2013F]">Site</p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/search" className="btn btn-ghost text-[#F5F5F1]">
                    Search
                  </Link>
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
