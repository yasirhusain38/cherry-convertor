"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ToolCard } from "@/components/ToolCard";
import type { FinanceTool } from "@/data/finance-tools";
import type { PhotoSpec } from "@/data/photo-specs";
import type { ToolDef } from "@/lib/tools";

export function CountryCatalog({
  countryName,
  specs,
  photos,
  finance,
  banking,
  supporting,
}: {
  countryName: string;
  specs: PhotoSpec[];
  photos: ToolDef[];
  finance: FinanceTool[];
  banking: ToolDef[];
  supporting: ToolDef[];
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const match = (parts: string[]) => !q || parts.join(" ").toLowerCase().includes(q);

  const specHits = useMemo(() => specs.filter((spec) => match([spec.document, spec.id, spec.backgroundLabel])), [specs, q]);
  const photoHits = useMemo(
    () => photos.filter((tool) => match([tool.name, tool.lede, tool.slug, ...tool.keywords])),
    [photos, q],
  );
  const financeHits = useMemo(
    () => finance.filter((tool) => match([tool.name, tool.lede, tool.slug, tool.kicker, ...tool.keywords])),
    [finance, q],
  );
  const bankHits = useMemo(
    () => banking.filter((tool) => match([tool.name, tool.lede, tool.slug, ...tool.keywords])),
    [banking, q],
  );
  const civilHits = useMemo(
    () => supporting.filter((tool) => match([tool.name, tool.lede, tool.slug, ...tool.keywords])),
    [supporting, q],
  );

  const total = specHits.length + photoHits.length + financeHits.length + bankHits.length + civilHits.length;

  return (
    <>
      <div className="container-page py-8">
        <label className="grid gap-2 text-sm">
          Search {countryName}
          <input
            className="field"
            value={query}
            placeholder={`Passport, EMI, payslip, ${countryName} tax…`}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        {q ? (
          <p className="mt-3 text-sm text-[var(--ink-soft)]">
            {total} match{total === 1 ? "" : "es"} on this hub
          </p>
        ) : null}
      </div>

      {specHits.length ? (
        <section className="container-page py-6">
          <p className="label">Official sizes</p>
          <h2 className="display mt-2 text-3xl">Photo specs for {countryName}</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="label text-[var(--ink-faint)]">
                <tr>
                  <th className="py-3 pr-4">Document</th>
                  <th className="py-3 pr-4">mm</th>
                  <th className="py-3 pr-4">Pixels</th>
                  <th className="py-3 pr-4">Cap</th>
                  <th className="py-3">Background</th>
                </tr>
              </thead>
              <tbody>
                {specHits.map((spec) => (
                  <tr key={spec.id} className="border-t border-[var(--line)]">
                    <td className="py-3 pr-4">{spec.document}</td>
                    <td className="py-3 pr-4">
                      {spec.widthMm} × {spec.heightMm}
                    </td>
                    <td className="py-3 pr-4">
                      {spec.widthPx ?? "—"} × {spec.heightPx ?? "—"}
                    </td>
                    <td className="py-3 pr-4">{spec.maxKB ? `${spec.maxKB} KB` : "—"}</td>
                    <td className="py-3">{spec.backgroundLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {photoHits.length ? (
        <section className="container-page pb-12">
          <p className="label">Photo tools</p>
          <h2 className="display mt-2 text-3xl">{countryName} photos</h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--ink-soft)]">
            Only {countryName} photo sizes. Other countries live on their own hubs.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {photoHits.map((tool, index) => (
              <ToolCard key={tool.slug} tool={tool} index={index} />
            ))}
          </div>
        </section>
      ) : null}

      {financeHits.length ? (
        <section className="container-page pb-12">
          <p className="label">Finance calculators</p>
          <h2 className="display mt-2 text-3xl">{countryName} calculators</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {financeHits.map((tool) => (
              <Link key={tool.slug} href={`/finance/${tool.slug}`} className="card card-hover p-6 no-underline">
                <p className="label">{tool.kicker}</p>
                <h3 className="mt-3 text-xl tracking-tight">{tool.name}</h3>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">{tool.lede}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {bankHits.length ? (
        <section className="container-page pb-12">
          <p className="label">Banking, tax &amp; accounts</p>
          <h2 className="display mt-2 text-3xl">{countryName} finance documents</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {bankHits.map((tool, index) => (
              <ToolCard key={tool.slug} tool={tool} index={index} />
            ))}
          </div>
        </section>
      ) : null}

      {civilHits.length ? (
        <section className="container-page pb-12">
          <p className="label">Civil &amp; academic PDFs</p>
          <h2 className="display mt-2 text-3xl">Other {countryName} documents</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {civilHits.map((tool, index) => (
              <ToolCard key={tool.slug} tool={tool} index={index} />
            ))}
          </div>
        </section>
      ) : null}

      {q && total === 0 ? (
        <p className="container-page pb-16 text-[var(--ink-soft)]">
          Nothing on the {countryName} hub for “{query}”. Try the{" "}
          <Link href={`/search?q=${encodeURIComponent(query)}`} className="text-brand">
            site search
          </Link>
          .
        </p>
      ) : null}
    </>
  );
}
