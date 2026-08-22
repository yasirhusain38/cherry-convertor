"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { countriesInRegion, REGIONS } from "@/data/regions";

export function RegionsExplorer() {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const regions = useMemo(() => {
    if (!q) return REGIONS;
    return REGIONS.filter((region) => [region.name, region.slug, region.blurb].join(" ").toLowerCase().includes(q));
  }, [q]);

  return (
    <>
      <div className="container-page py-8">
        <label className="grid gap-2 text-sm">
          Search regions
          <input
            className="field"
            value={query}
            placeholder="Europe, Gulf, South Asia…"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>
      <section className="container-page grid gap-4 pb-14 md:grid-cols-2 lg:grid-cols-4">
        {regions.map((region) => {
          const count = countriesInRegion(region.name).length;
          return (
            <Link key={region.slug} href={`/regions/${region.slug}`} className="card card-hover p-6 no-underline">
              <p className="label">{count} countries</p>
              <h2 className="mt-4 text-2xl tracking-tight">{region.name}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{region.blurb}</p>
            </Link>
          );
        })}
      </section>
    </>
  );
}
