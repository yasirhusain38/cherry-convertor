import type { Metadata } from "next";
import Link from "next/link";
import { countriesInRegion, REGIONS } from "@/data/regions";

export const metadata: Metadata = {
  title: "Document Photo Tools by Region",
  description:
    "Passport, visa, and ID photo tools grouped by region: North America, Europe, Middle East, South Asia, East & Southeast Asia, Central Asia, Africa, Latin America, and Oceania. Processed in your browser.",
  alternates: { canonical: "/regions" },
};

export default function RegionsPage() {
  return (
    <>
      <section className="border-b border-[var(--line)]">
        <div className="container-page py-14">
          <p className="label">Regions</p>
          <h1 className="display mt-3 text-5xl md:text-6xl">Tools by region</h1>
          <p className="mt-4 max-w-2xl text-[var(--ink-soft)]">
            Country hubs for passport, visa, licence, and ID photos — grouped so you can find the right millimetres
            without scrolling the whole world list.
          </p>
        </div>
      </section>
      <section className="container-page grid gap-4 py-14 md:grid-cols-2 lg:grid-cols-4">
        {REGIONS.map((region) => {
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
