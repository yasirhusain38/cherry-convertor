import type { Metadata } from "next";
import Link from "next/link";
import { CountriesExplorer } from "@/components/CountriesExplorer";

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
      <CountriesExplorer />
    </>
  );
}
