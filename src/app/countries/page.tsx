import type { Metadata } from "next";
import Link from "next/link";
import { CountriesExplorer } from "@/components/CountriesExplorer";
import { PageIntro } from "@/components/PageIntro";

export const metadata: Metadata = {
  title: "Document Photo Tools by Country",
  description:
    "US, UK, UAE, India, Canada, Australia, and country-by-country passport, visa, and ID photo tools. Processed in your browser. No upload.",
  alternates: { canonical: "/countries" },
};

export default function CountriesPage() {
  return (
    <>
      <PageIntro
        kicker="Countries"
        title="Tools by country"
        lede="Official millimetre sizes and file caps for passports, visas, and national IDs."
      >
        <p className="mt-8 text-sm">
          <Link href="/regions" className="text-brand">
            Browse by region →
          </Link>
        </p>
      </PageIntro>
      <CountriesExplorer />
    </>
  );
}
