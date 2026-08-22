"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { COUNTRIES } from "@/data/countries";
import { countriesInRegion, REGIONS } from "@/data/regions";

export function CountriesExplorer() {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((country) =>
      [country.name, country.slug, country.region, country.blurb].join(" ").toLowerCase().includes(q),
    );
  }, [q]);

  return (
    <>
      <div className="container-page py-8">
        <label className="grid gap-2 text-sm">
          Search countries
          <input
            className="field"
            value={query}
            placeholder="India, UAE, Japan, Schengen, passport…"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        {q ? <p className="mt-3 text-sm text-[var(--ink-soft)]">{filtered.length} countries</p> : null}
      </div>
      {REGIONS.map((region) => {
        const countries = (q ? filtered : countriesInRegion(region.name)).filter(
          (country) => country.region === region.name,
        );
        if (!countries.length) return null;
        return (
          <section key={region.slug} className="border-b border-[var(--line)] last:border-b-0">
            <div className="container-page py-12">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
                <div>
                  <p className="label">{region.name}</p>
                  <h2 className="display mt-2 text-3xl md:text-4xl">{region.name}</h2>
                  <p className="mt-2 max-w-2xl text-sm text-[var(--ink-soft)]">{region.blurb}</p>
                </div>
                <Link href={`/regions/${region.slug}`} className="label text-brand no-underline">
                  Region hub →
                </Link>
              </div>
              <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {countries.map((country) => (
                  <Link key={country.slug} href={`/countries/${country.slug}`} className="card card-hover p-6 no-underline">
                    <p className="label">{country.region}</p>
                    <h3 className="mt-4 text-2xl tracking-tight">{country.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{country.blurb}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );
      })}
      {q && !filtered.length ? (
        <p className="container-page pb-16 text-[var(--ink-soft)]">
          No country matches “{query}”.{" "}
          <Link href={`/search?q=${encodeURIComponent(query)}`} className="text-brand">
            Search the whole site
          </Link>
          .
        </p>
      ) : null}
    </>
  );
}
