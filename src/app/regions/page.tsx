import type { Metadata } from "next";
import { RegionsExplorer } from "@/components/RegionsExplorer";

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
      <RegionsExplorer />
    </>
  );
}
