import type { Metadata } from "next";
import Link from "next/link";
import { COUNTRIES } from "@/data/countries";
import { FINANCE_TOOLS } from "@/data/finance-tools";

export const metadata: Metadata = {
  title: "Finance Calculators by Country",
  description:
    "Live currency converter plus EMI, SIP, GST, income tax, mortgage, stamp duty, VAT, and take-home salary calculators for India, USA, UK, and 50+ other countries. Run in your browser. No upload.",
  alternates: { canonical: "/finance" },
};

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

function groupedSections() {
  const byCountry = new Map<string, typeof FINANCE_TOOLS>();
  for (const tool of FINANCE_TOOLS) {
    const list = byCountry.get(tool.country) ?? [];
    list.push(tool);
    byCountry.set(tool.country, list);
  }
  const regionOf = new Map(COUNTRIES.map((country) => [country.name, country.region]));
  const used = new Set<string>();
  const sections: Array<{ title: string; tools: typeof FINANCE_TOOLS }> = [];
  for (const name of FEATURED) {
    const tools = byCountry.get(name);
    if (!tools) continue;
    sections.push({ title: name, tools });
    used.add(name);
  }
  const rest = new Map<string, Array<{ country: string; tools: typeof FINANCE_TOOLS }>>();
  for (const [country, tools] of byCountry) {
    if (used.has(country)) continue;
    const region = regionOf.get(country) ?? "Other";
    const list = rest.get(region) ?? [];
    list.push({ country, tools });
    rest.set(region, list);
  }
  for (const region of REGION_ORDER) {
    const list = rest.get(region);
    if (!list) continue;
    list.sort((a, b) => a.country.localeCompare(b.country));
    for (const item of list) sections.push({ title: item.country, tools: item.tools });
  }
  return sections;
}

export default function FinanceIndexPage() {
  const sections = groupedSections();

  return (
    <>
      <section className="border-b border-[var(--line)]">
        <div className="container-page py-14">
          <p className="label">Finance</p>
          <h1 className="display mt-3 text-5xl md:text-6xl">Calculators by country</h1>
          <p className="mt-4 max-w-2xl text-[var(--ink-soft)]">
            EMI, tax, GST/VAT, mortgage, stamp duty, and retirement maths — on this device. Tax slabs are
            estimates; confirm before you file.
          </p>
        </div>
      </section>
      {sections.map(({ title, tools }) => (
        <section key={title} className="border-b border-[var(--line)] last:border-b-0">
          <div className="container-page py-12">
            <p className="label">{title === "Global" ? "Every country" : title}</p>
            <h2 className="display mt-2 text-3xl">{title}</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool) => (
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
    </>
  );
}
