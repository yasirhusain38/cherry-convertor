"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CountryHub } from "@/data/countries";

export function RegionCountries({ countries }: { countries: CountryHub[] }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const hits = useMemo(() => {
    if (!q) return countries;
    return countries.filter((country) =>
      [country.name, country.slug, country.blurb].join(" ").toLowerCase().includes(q),
    );
  }, [countries, q]);

  return (
    <>
      <div className="container-page py-8">
        <label className="grid gap-2 text-sm">
          Search this region
          <input
            className="field"
            value={query}
            placeholder="Country name…"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>
      <section className="container-page grid gap-4 pb-16 md:grid-cols-2 lg:grid-cols-3">
        {hits.map((country) => (
          <Link key={country.slug} href={`/countries/${country.slug}`} className="card card-hover p-6 no-underline">
            <p className="label">{country.region}</p>
            <h2 className="mt-3 text-2xl tracking-tight">{country.name}</h2>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">{country.blurb}</p>
          </Link>
        ))}
      </section>
    </>
  );
}
