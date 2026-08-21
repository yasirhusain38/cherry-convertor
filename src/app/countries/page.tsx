import type { Metadata } from "next";
import Link from "next/link";
import { countriesInRegion, REGIONS } from "@/data/regions";

export const metadata: Metadata = {
  title: "Document Photo Tools by Country",
  description:
    "US, UK, UAE, India, Canada, Australia, and country-by-country passport, visa, and ID photo tools. Processed in your browser. No upload.",
  alternates: { canonical: "/countries" },
};

export default function CountriesPage() {
  return (
    <>
      <section className="border-b border-[var(--line)]">
        <div className="container-page py-14">
          <p className="label">Countries</p>
          <h1 className="display mt-3 text-5xl md:text-6xl">Tools by country</h1>
          <p className="mt-4 max-w-2xl text-[var(--ink-soft)]">
            Official millimetre sizes and file caps for passports, visas, and national IDs. Nothing is uploaded.
          </p>
          <p className="mt-6 text-sm">
            <Link href="/regions" className="text-brand">
              Browse by region
            </Link>
          </p>
        </div>
      </section>
      {REGIONS.map((region) => {
        const countries = countriesInRegion(region.name);
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
                  <Link
                    key={country.slug}
                    href={`/countries/${country.slug}`}
                    className="card card-hover p-6 no-underline"
                  >
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
    </>
  );
}
