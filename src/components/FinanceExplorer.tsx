"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { COUNTRIES } from "@/data/countries";
import { FINANCE_TOOLS } from "@/data/finance-tools";

const FEATURED = [
  "Global",
  "India",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "United Arab Emirates",
  "Singapore",
  "Germany",
];

const REGION_ORDER = [
  "North America",
  "Europe",
  "Middle East",
  "South Asia",
  "East & Southeast Asia",
  "Africa",
  "Latin America",
  "Oceania",
  "Central Asia",
];

function grouped(tools: typeof FINANCE_TOOLS) {
  const byCountry = new Map<string, typeof FINANCE_TOOLS>();
  for (const tool of tools) {
    const list = byCountry.get(tool.country) ?? [];
    list.push(tool);
    byCountry.set(tool.country, list);
  }
  const regionOf = new Map(COUNTRIES.map((country) => [country.name, country.region]));
  const used = new Set<string>();
  const sections: Array<{ title: string; tools: typeof FINANCE_TOOLS }> = [];
  for (const name of FEATURED) {
    const list = byCountry.get(name);
    if (!list) continue;
    sections.push({ title: name, tools: list });
    used.add(name);
  }
  const rest = new Map<string, Array<{ country: string; tools: typeof FINANCE_TOOLS }>>();
  for (const [country, list] of byCountry) {
    if (used.has(country)) continue;
    const region = regionOf.get(country) ?? "Other";
    const bucket = rest.get(region) ?? [];
    bucket.push({ country, tools: list });
    rest.set(region, bucket);
  }
  for (const region of REGION_ORDER) {
    const bucket = rest.get(region);
    if (!bucket) continue;
    bucket.sort((a, b) => a.country.localeCompare(b.country));
    for (const item of bucket) sections.push({ title: item.country, tools: item.tools });
  }
  return sections;
}

export function FinanceExplorer() {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const tools = useMemo(() => {
    if (!q) return FINANCE_TOOLS;
    return FINANCE_TOOLS.filter((tool) =>
      [tool.name, tool.lede, tool.country, tool.slug, tool.kicker, ...tool.keywords].join(" ").toLowerCase().includes(q),
    );
  }, [q]);
  const sections = useMemo(() => grouped(tools), [tools]);

  return (
    <>
      <div className="container-page py-8">
        <label className="grid gap-2 text-sm">
          Search calculators
          <input
            className="field"
            value={query}
            placeholder="EMI, GST, 401k, stamp duty, INR, mortgage…"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        {q ? <p className="mt-3 text-sm text-[var(--ink-soft)]">{tools.length} calculators</p> : null}
      </div>
      {sections.map(({ title, tools: list }) => (
        <section key={title} className="border-b border-[var(--line)] last:border-b-0">
          <div className="container-page py-12">
            <p className="label">{title === "Global" ? "Every country" : title}</p>
            <h2 className="display mt-2 text-3xl">{title}</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((tool) => (
                <Link key={tool.slug} href={`/finance/${tool.slug}`} className="card card-hover p-5 no-underline">
                  <p className="label">{tool.kicker}</p>
                  <h3 className="mt-3 text-xl tracking-tight">{tool.name}</h3>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">{tool.lede}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ))}
      {q && !tools.length ? (
        <p className="container-page pb-16 text-[var(--ink-soft)]">
          No calculator matches “{query}”.{" "}
          <Link href={`/search?q=${encodeURIComponent(query)}`} className="text-brand">
            Search the whole site
          </Link>
          .
        </p>
      ) : null}
    </>
  );
}
