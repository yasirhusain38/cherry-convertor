import type { Metadata } from "next";
import { FinanceExplorer } from "@/components/FinanceExplorer";

export const metadata: Metadata = {
  title: "Finance Calculators by Country",
  description:
    "Live currency converter plus EMI, SIP, GST, income tax, mortgage, stamp duty, VAT, and take-home salary calculators for India, USA, UK, and 50+ other countries. Run in your browser. No upload.",
  alternates: { canonical: "/finance" },
};

export default function FinanceIndexPage() {
  return (
    <>
      <section className="border-b border-[var(--line)]">
        <div className="container-page py-14">
          <p className="label">Finance</p>
          <h1 className="display mt-3 text-5xl md:text-6xl">Calculators by country</h1>
          <p className="mt-4 max-w-2xl text-[var(--ink-soft)]">
            EMI, tax, GST/VAT, mortgage, stamp duty, and retirement maths — on this device. Tax slabs are
            estimates; confirm before you file.
          </p>
        </div>
      </section>
      <FinanceExplorer />
    </>
  );
}
