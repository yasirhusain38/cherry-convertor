import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ToolCard } from "@/components/ToolCard";
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
import type { ToolDef } from "@/lib/tools";

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

function ToolGrid({ tools }: { tools: ToolDef[] }) {
  if (!tools.length) return null;
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {tools.map((tool, index) => (
        <ToolCard key={tool.slug} tool={tool} index={index} />
      ))}
    </div>
  );
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
      {specs.length ? (
        <section className="container-page py-10">
          <p className="label">Official sizes</p>
          <h2 className="display mt-2 text-3xl">Photo specs for {country.name}</h2>
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
      {photos.length ? (
        <section className="container-page pb-12">
          <p className="label">Photo tools</p>
          <h2 className="display mt-2 text-3xl">{country.name} photos</h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--ink-soft)]">
            Only {country.name} photo sizes. Other countries live on their own hubs.
          </p>
          <ToolGrid tools={photos} />
        </section>
      ) : null}
      {finance.length ? (
        <section className="container-page pb-12">
          <p className="label">Finance calculators</p>
          <h2 className="display mt-2 text-3xl">{country.name} calculators</h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--ink-soft)]">
            EMI, tax, VAT/GST, and retirement maths for {country.name}. Runs in this browser.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {finance.map((tool) => (
              <Link key={tool.slug} href={`/finance/${tool.slug}`} className="card card-hover p-6 no-underline">
                <p className="label">{tool.kicker}</p>
                <h3 className="mt-3 text-xl tracking-tight">{tool.name}</h3>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">{tool.lede}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
      {banking.length ? (
        <section className="container-page pb-12">
          <p className="label">Banking, tax &amp; accounts</p>
          <h2 className="display mt-2 text-3xl">{country.name} finance documents</h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--ink-soft)]">
            No portrait. Bank statements, payslips, tax certificates, and KYC scans — rebuilt in this browser.
          </p>
          <ToolGrid tools={banking} />
        </section>
      ) : null}
      {supporting.length ? (
        <section className="container-page pb-12">
          <p className="label">Civil &amp; academic PDFs</p>
          <h2 className="display mt-2 text-3xl">Other {country.name} documents</h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--ink-soft)]">
            Birth and marriage certificates, PCC, marksheets, tenancy, and utility bills. No photo required.
          </p>
          <ToolGrid tools={supporting} />
        </section>
      ) : null}
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
