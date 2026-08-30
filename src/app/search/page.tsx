import type { Metadata } from "next";
import { Suspense } from "react";
import { PageIntro } from "@/components/PageIntro";
import { SearchResults } from "@/components/SearchResults";

export const metadata: Metadata = {
  title: "Search",
  description: "Search Cherry Converter: image tools, finance calculators, country hubs, and regions.",
  alternates: { canonical: "/search" },
};

export default function SearchPage() {
  return (
    <>
      <PageIntro
        kicker="Search"
        title="Find a tool"
        lede="Image tools, EMI and tax calculators, and country photo hubs — one search."
      />
      <Suspense fallback={<p className="container-page py-10 text-sm text-[var(--ink-soft)]">Loading search…</p>}>
        <SearchResults />
      </Suspense>
    </>
  );
}
