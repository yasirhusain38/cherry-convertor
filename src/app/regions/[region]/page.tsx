import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RegionCountries } from "@/components/RegionCountries";
import { countriesInRegion, getRegion, REGIONS } from "@/data/regions";

export function generateStaticParams() {
  return REGIONS.map((region) => ({ region: region.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ region: string }>;
}): Promise<Metadata> {
  const { region: slug } = await params;
  const region = getRegion(slug);
  if (!region) return {};
  return {
    title: `${region.name} Document Photo Tools Free`,
    description: region.blurb,
    alternates: { canonical: `/regions/${region.slug}` },
  };
}

export default async function RegionPage({
  params,
}: {
  params: Promise<{ region: string }>;
}) {
  const { region: slug } = await params;
  const region = getRegion(slug);
  if (!region) notFound();
  const countries = countriesInRegion(region.name);

  return (
    <>
      <section className="border-b border-[var(--line)]">
        <div className="container-page py-14">
          <p className="label">Region</p>
          <h1 className="display mt-4 text-5xl md:text-7xl">{region.name}</h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-[var(--ink-soft)]">{region.blurb}</p>
          <p className="mt-6 flex flex-wrap gap-5 text-sm">
            <Link href="/regions" className="text-brand">
              All regions
            </Link>
            <Link href="/countries" className="text-brand">
              All countries
            </Link>
          </p>
        </div>
      </section>
      <RegionCountries countries={countries} />
    </>
  );
}
