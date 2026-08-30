import type { Metadata } from "next";
import { PageIntro } from "@/components/PageIntro";
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
      <PageIntro
        kicker="Regions"
        title="Tools by region"
        lede="Country hubs for passport, visa, licence, and ID photos — grouped so you can find the right millimetres."
      />
      <RegionsExplorer />
    </>
  );
}
