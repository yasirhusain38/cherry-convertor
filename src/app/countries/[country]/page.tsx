import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ToolCard } from "@/components/ToolCard";
import { COUNTRIES, getCountry } from "@/data/countries";
import { specsForCountry } from "@/data/photo-specs";
import { regionSlugFromName } from "@/data/regions";
import { getRelated } from "@/lib/tools";

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
  const tools = getRelated(country.toolSlugs);
  const specs = specsForCountry(country.slug);
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
      {specs.length ? (
        <section className="container-page py-10">
          <p className="label">Official sizes</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="label text-[var(--ink-faint)]">
                <tr>
                  <th className="py-3 pr-4">Document</th>
                  <th className="py-3 pr-4">mm</th>
                  <th className="py-3 pr-4">Pixels</th>
                  <th className="py-3 pr-4">Cap</th>
                  <th className="py-3">Background</th>
                </tr>
              </thead>
              <tbody>
                {specs.map((spec) => (
                  <tr key={spec.id} className="border-t border-[var(--line)]">
                    <td className="py-3 pr-4">{spec.document}</td>
                    <td className="py-3 pr-4">
                      {spec.widthMm} × {spec.heightMm}
                    </td>
                    <td className="py-3 pr-4">
                      {spec.widthPx ?? "—"} × {spec.heightPx ?? "—"}
                    </td>
                    <td className="py-3 pr-4">{spec.maxKB ? `${spec.maxKB} KB` : "—"}</td>
                    <td className="py-3">{spec.backgroundLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
      <section className="container-page grid gap-4 pb-16 md:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool, index) => (
          <ToolCard key={tool.slug} tool={tool} index={index} />
        ))}
      </section>
    </>
  );
}
