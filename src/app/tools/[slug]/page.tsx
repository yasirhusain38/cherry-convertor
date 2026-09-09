import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { faqJsonLd } from "@/components/Faq";
import { ToolPageView } from "@/components/ToolPageView";
import { getLandingCopy } from "@/data/tool-landing-copy";
import { absoluteUrl } from "@/lib/site";
import { TOOLS, getTool } from "@/lib/tools";

export function generateStaticParams() {
  return TOOLS.map((tool) => ({ slug: tool.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) return {};
  const url = `/tools/${tool.slug}`;
  return {
    title: tool.metaTitle.replace(" – Cherry Converter", ""),
    description: tool.metaDescription,
    keywords: tool.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: tool.metaTitle,
      description: tool.metaDescription,
      url: absoluteUrl(url),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: tool.metaTitle,
      description: tool.metaDescription,
    },
  };
}

export default async function ToolSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();

  const copy = getLandingCopy(tool.slug);
  const howTo = copy?.howTo ?? [
    "The file stays in this browser tab.",
    tool.mode === "photo" ? "Confirm millimetres, background, and KB cap." : "Set the cap or preset.",
    "Download from this device. Nothing is uploaded.",
  ];
  const jsonLd = [
    faqJsonLd(tool.faqs),
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: tool.name,
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Web",
      offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
      description: tool.metaDescription,
      url: absoluteUrl(`/tools/${tool.slug}`),
    },
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: tool.h1,
      description: tool.lede,
      step: howTo.map((text, index) => ({
        "@type": "HowToStep",
        name: ["Drop", "Set the spec", "Download"][index] ?? "Step",
        text,
      })),
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ToolPageView tool={tool} />
    </>
  );
}
