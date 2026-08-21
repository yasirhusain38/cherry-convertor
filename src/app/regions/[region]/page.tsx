import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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
          <h1 className="display mt-3 text-5xl md:text-6xl">{region.name}</h1>
          <p className="mt-4 max-w-2xl text-[var(--ink-soft)]">{region.blurb}</p>
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
      <section className="container-page grid gap-4 py-14 md:grid-cols-2 lg:grid-cols-3">
        {countries.map((country) => (
          <Link key={country.slug} href={`/countries/${country.slug}`} className="card card-hover p-6 no-underline">
            <p className="label">{country.region}</p>
            <h2 className="mt-4 text-2xl tracking-tight">{country.name}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{country.blurb}</p>
          </Link>
        ))}
      </section>
    </>
  );
}
