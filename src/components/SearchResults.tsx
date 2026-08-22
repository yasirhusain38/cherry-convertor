"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { searchKindLabel, searchSite, type SearchKind } from "@/lib/search-index";

const FILTERS: Array<{ id: SearchKind | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "tool", label: "Image tools" },
  { id: "finance", label: "Calculators" },
  { id: "country", label: "Countries" },
  { id: "region", label: "Regions" },
  { id: "page", label: "Pages" },
];

export function SearchResults() {
  const params = useSearchParams();
  const router = useRouter();
  const start = params.get("q") ?? "";
  const [query, setQuery] = useState(start);
  const [kind, setKind] = useState<SearchKind | "all">("all");

  const hits = useMemo(() => {
    const list = searchSite(query, 80);
    return kind === "all" ? list : list.filter((hit) => hit.kind === kind);
  }, [query, kind]);

  return (
    <>
      <form
        className="container-page grid gap-4 py-8 md:grid-cols-[1fr_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          const q = query.trim();
          router.replace(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
        }}
      >
        <label className="grid gap-2 text-sm">
          Search
          <input
            className="field"
            value={query}
            placeholder="India EMI, UAE passport, 50KB, GST, stamp duty…"
            autoFocus
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label className="grid gap-2 text-sm">
          Type
          <select
            className="field min-w-44"
            value={kind}
            onChange={(event) => setKind(event.target.value as SearchKind | "all")}
          >
            {FILTERS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </form>
      <p className="container-page pb-4 text-sm text-[var(--ink-soft)]">
        {query.trim() ? `${hits.length} result${hits.length === 1 ? "" : "s"}` : "Type to search the whole site."}
      </p>
      <section className="container-page grid gap-4 pb-20 md:grid-cols-2 lg:grid-cols-3">
        {hits.map((hit) => (
          <Link key={hit.id} href={hit.href} className="card card-hover p-6 no-underline">
            <p className="label">
              {searchKindLabel(hit.kind)} · {hit.group}
            </p>
            <h2 className="mt-3 text-2xl tracking-tight">{hit.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{hit.lede}</p>
          </Link>
        ))}
      </section>
    </>
  );
}
