import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Faq, faqJsonLd } from "@/components/Faq";
import { FinanceTool } from "@/components/tools/FinanceTool";
import { FINANCE_TOOLS, getFinanceTool } from "@/data/finance-tools";
import { absoluteUrl } from "@/lib/site";

export function generateStaticParams() {
  return FINANCE_TOOLS.map((tool) => ({ slug: tool.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = getFinanceTool(slug);
  if (!tool) return {};
  return {
    title: tool.metaTitle.replace(" – Cherry Converter", ""),
    description: tool.metaDescription,
    keywords: tool.keywords,
    alternates: { canonical: `/finance/${tool.slug}` },
    openGraph: {
      title: tool.metaTitle,
      description: tool.metaDescription,
      url: absoluteUrl(`/finance/${tool.slug}`),
      type: "website",
    },
  };
}

export default async function FinanceSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = getFinanceTool(slug);
  if (!tool) notFound();
  const related = tool.related.map((item) => getFinanceTool(item)).filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            faqJsonLd(tool.faqs),
            {
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: tool.name,
              applicationCategory: "FinanceApplication",
              operatingSystem: "Web",
              offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
              description: tool.metaDescription,
              url: absoluteUrl(`/finance/${tool.slug}`),
            },
          ]),
        }}
      />
      <section className="border-b border-[var(--line)]">
        <div className="container-page py-12 md:py-16">
          <p className="label">{tool.kicker}</p>
          <h1 className="display mt-4 max-w-4xl text-4xl md:text-6xl">{tool.h1}</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--ink-soft)]">{tool.lede}</p>
          <p className="mt-6 inline-flex items-center gap-3 rounded-full bg-[#F2013F] px-4 py-2 text-xs tracking-[0.16em] text-[#F5F5F1] uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-[#F5F5F1]" />
            {tool.engine === "currency"
              ? "Live mid-market rates · amount never uploaded"
              : "Maths in this browser · never uploaded"}
          </p>
        </div>
      </section>
      <section className="container-page py-10 md:py-14">
        <FinanceTool tool={tool} />
      </section>
      <Faq items={tool.faqs} />
      {related.length ? (
        <section className="container-page pb-16">
          <p className="label">Related calculators</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {related.map((item) => (
              <Link key={item.slug} href={`/finance/${item.slug}`} className="card card-hover p-6 no-underline">
                <p className="label">{item.kicker}</p>
                <h2 className="mt-3 text-2xl tracking-tight">{item.name}</h2>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
