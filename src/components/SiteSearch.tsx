"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { SearchPopular } from "@/components/SearchPopular";
import { searchKindLabel, searchSite, type SearchHit } from "@/lib/search-index";

const KIND_ORDER = ["country", "finance", "tool", "region", "page"] as const;

export function SiteSearch({
  open,
  onClose,
  initial = "",
}: {
  open: boolean;
  onClose: () => void;
  initial?: string;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(initial);

  useEffect(() => {
    if (open) {
      setQuery(initial);
      requestAnimationFrame(() => input.current?.focus());
    }
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const hits = useMemo(() => searchSite(query, 36), [query]);
  const grouped = useMemo(() => {
    const map = new Map<string, SearchHit[]>();
    for (const hit of hits) {
      const list = map.get(hit.kind) ?? [];
      list.push(hit);
      map.set(hit.kind, list);
    }
    return KIND_ORDER.map((kind) => ({ kind, items: map.get(kind) ?? [] })).filter((row) => row.items.length);
  }, [hits]);

  if (!open) return null;

  function go(href: string) {
    onClose();
    router.push(href);
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-[#221F1F] text-[#F5F5F1]"
      role="dialog"
      aria-modal="true"
      aria-label="Search the site"
    >
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#F5F5F1]/15 px-5">
        <p className="text-sm tracking-[0.16em] uppercase">Search</p>
        <button type="button" className="btn btn-dark px-4" onClick={onClose}>
          Close
        </button>
      </div>
      <form
        className="container-page w-full shrink-0 py-4"
        onSubmit={(event) => {
          event.preventDefault();
          const q = query.trim();
          if (q) go(`/search?q=${encodeURIComponent(q)}`);
        }}
      >
        <input
          ref={input}
          className="field bg-[#221F1F] text-[#F5F5F1]"
          value={query}
          placeholder="50KB, EMI, QR, speed test, wheel, India…"
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") onClose();
          }}
        />
        <p className="mt-3 text-sm text-[#F5F5F1]/60">
          {query.trim()
            ? `${hits.length} result${hits.length === 1 ? "" : "s"} · Enter for full page`
            : "Tools, calculators, countries, and regions. Ctrl+K anytime."}
        </p>
      </form>
      <div className="min-h-0 flex-1 overflow-y-auto pb-12">
        <div className="container-page grid gap-8">
          {!query.trim() ? <SearchPopular onPick={onClose} /> : null}
          {grouped.map(({ kind, items }) => (
            <section key={kind}>
              <p className="label mb-3 text-[#F2013F]">{searchKindLabel(kind)}</p>
              <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((hit) => (
                  <li key={hit.id}>
                    <Link
                      href={hit.href}
                      className="block rounded-xl border border-[#F5F5F1]/15 px-4 py-3 text-[#F5F5F1] no-underline hover:border-[#F2013F] hover:bg-[#F2013F]"
                      onClick={onClose}
                    >
                      <span className="block text-base tracking-tight">{hit.title}</span>
                      <span className="mt-1 block text-xs leading-5 text-[#F5F5F1]/70">
                        {hit.group}
                        {hit.lede ? ` · ${hit.lede.slice(0, 70)}${hit.lede.length > 70 ? "…" : ""}` : ""}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {query.trim() && !hits.length ? (
            <p className="text-[#F5F5F1]/70">No matches for “{query}”. Try EMI, GST, India, or 50KB.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
