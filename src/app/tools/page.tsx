import type { Metadata } from "next";
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
      <section className="border-b border-[var(--line)]">
        <div className="container-page py-14">
          <p className="label">Inventory</p>
          <h1 className="display mt-3 text-5xl md:text-6xl">All tools</h1>
          <p className="mt-4 max-w-2xl text-[var(--ink-soft)]">
            {TOOLS.length} dedicated pages. Searchable output formats on every
            workspace. Images stay on this device.
          </p>
        </div>
      </section>
      <ToolsExplorer />
    </>
  );
}
