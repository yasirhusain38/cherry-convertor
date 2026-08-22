import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchResults } from "@/components/SearchResults";

export const metadata: Metadata = {
  title: "Search",
  description: "Search Cherry Converter: image tools, finance calculators, country hubs, and regions.",
  alternates: { canonical: "/search" },
};

export default function SearchPage() {
  return (
    <>
      <section className="border-b border-[var(--line)]">
        <div className="container-page py-14">
          <p className="label">Search</p>
          <h1 className="display mt-3 text-5xl md:text-6xl">Find a tool</h1>
          <p className="mt-4 max-w-2xl text-[var(--ink-soft)]">
            Image tools, EMI and tax calculators, and country photo hubs — one search.
          </p>
        </div>
      </section>
      <Suspense fallback={<p className="container-page py-10 text-sm text-[var(--ink-soft)]">Loading search…</p>}>
        <SearchResults />
      </Suspense>
    </>
  );
}
