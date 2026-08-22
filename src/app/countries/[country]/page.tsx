import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CountryCatalog } from "@/components/CountryCatalog";
import { COUNTRIES, getCountry } from "@/data/countries";
import { specsForCountry } from "@/data/photo-specs";
import { regionSlugFromName } from "@/data/regions";
import { financeToolsForCountry } from "@/data/finance-tools";
import {
  bankingToolsForCountry,
  nearbyCountries,
  photoToolsForCountry,
  supportingToolsForCountry,
} from "@/lib/country-tools";

export function generateStaticParams() {
  return COUNTRIES.map((country) => ({ country: country.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string }>;
}): Promise<Metadata> {
  const { country: slug } = await params;
  const country = getCountry(slug);
  if (!country) return {};
  return {
    title: `${country.name} Document Photo Tools Free`,
    description: country.blurb,
    alternates: { canonical: `/countries/${country.slug}` },
  };
}

export default async function CountryPage({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country: slug } = await params;
  const country = getCountry(slug);
  if (!country) notFound();
  const photos = photoToolsForCountry(country.slug);
  const banking = bankingToolsForCountry(country);
  const supporting = supportingToolsForCountry(country);
  const finance = financeToolsForCountry(country.slug);
  const specs = [...specsForCountry(country.slug)].sort((a, b) => a.document.localeCompare(b.document));
  const nearby = nearbyCountries(country);
  const regionSlug = regionSlugFromName(country.region);

  return (
    <>
      <section className="border-b border-[var(--line)]">
        <div className="container-page py-14">
          <p className="label">
            {regionSlug ? (
              <Link href={`/regions/${regionSlug}`} className="text-brand no-underline">
                {country.region}
              </Link>
            ) : (
              country.region
            )}
          </p>
          <h1 className="display mt-3 text-5xl md:text-6xl">{country.name} document tools</h1>
          <p className="mt-4 max-w-2xl text-[var(--ink-soft)]">{country.blurb}</p>
          <p className="mt-6 flex flex-wrap gap-5 text-sm">
            <Link href="/countries" className="text-brand">
              All countries
            </Link>
            {regionSlug ? (
              <Link href={`/regions/${regionSlug}`} className="text-brand">
                {country.region}
              </Link>
            ) : null}
          </p>
        </div>
      </section>
      <CountryCatalog
        countryName={country.name}
        specs={specs}
        photos={photos}
        finance={finance}
        banking={banking}
        supporting={supporting}
      />
      {nearby.length ? (
        <section className="border-t border-[var(--line)]">
          <div className="container-page py-12">
            <p className="label">{country.region}</p>
            <h2 className="display mt-2 text-3xl">Other countries in {country.region}</h2>
            <p className="mt-2 max-w-2xl text-sm text-[var(--ink-soft)]">
              Each hub lists only that country’s photo sizes.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {nearby.map((item) => (
                <Link
                  key={item.slug}
                  href={`/countries/${item.slug}`}
                  className="rounded-full border border-[var(--line)] px-4 py-2 text-sm no-underline hover:border-brand hover:text-brand"
                >
                  {item.name}
                </Link>
              ))}
            </div>
            {regionSlug ? (
              <p className="mt-6 text-sm">
                <Link href={`/regions/${regionSlug}`} className="text-brand">
                  All of {country.region} →
                </Link>
              </p>
            ) : null}
          </div>
        </section>
      ) : null}
    </>
  );
}
