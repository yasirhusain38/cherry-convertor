import type { Metadata } from "next";
import { PageIntro } from "@/components/PageIntro";
import { ToolsExplorer } from "@/components/ToolsExplorer";
import { TOOLS } from "@/lib/tools";

export const metadata: Metadata = {
  title: "All Tools",
  description:
    "Browse every Cherry Converter tool: compress, PDF merge/split, OCR, QR codes, text formatters, and Indian document photo makers.",
  alternates: { canonical: "/tools" },
};

export default function ToolsIndexPage() {
  return (
    <>
      <PageIntro
        kicker={`Inventory  /  ${TOOLS.length}`}
        title="All tools"
        lede="Dedicated pages. Searchable output formats on every workspace. Images stay on this device."
      />
      <ToolsExplorer />
    </>
  );
}
