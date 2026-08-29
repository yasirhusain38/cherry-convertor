import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { faqJsonLd } from "@/components/Faq";
import { ToolPageView } from "@/components/ToolPageView";
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

  const jsonLd = [
    faqJsonLd(tool.faqs),
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
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
      step: [
        { "@type": "HowToStep", name: "Open this page", text: "The file or value stays in this browser tab." },
        { "@type": "HowToStep", name: "Set the spec", text: tool.mode === "photo" ? "Confirm millimetres, background, and KB cap in the table." : "Adjust the controls for this tool." },
        { "@type": "HowToStep", name: "Download", text: "Save the result from this device. Nothing is uploaded." },
      ],
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
