import type { Metadata } from "next";
import { FinanceExplorer } from "@/components/FinanceExplorer";
import { PageIntro } from "@/components/PageIntro";

export const metadata: Metadata = {
  title: "Finance Calculators by Country",
  description:
    "Live currency converter plus EMI, SIP, GST, income tax, mortgage, stamp duty, VAT, and take-home salary calculators for India, USA, UK, and 50+ other countries. Run in your browser. No upload.",
  alternates: { canonical: "/finance" },
};

export default function FinanceIndexPage() {
  return (
    <>
      <PageIntro
        kicker="Finance"
        title="Calculators by country"
        lede="EMI, tax, GST/VAT, mortgage, stamp duty, and retirement maths — on this device. Tax slabs are estimates; confirm before you file."
      />
      <FinanceExplorer />
    </>
  );
}
