import type { Metadata } from "next";
import Link from "next/link";
import { SizeHub } from "@/components/SizeHub";
import { PHOTO_SPECS } from "@/data/photo-specs";

export const metadata: Metadata = {
  title: "Indian government document sizes 2026 — No Upload",
  description:
    "Passport 51×51 mm, Aadhaar 35×45, PAN 25×35, exam 20–50 KB, PDF caps 200 KB–2 MB. Confirm on the form. No upload.",
  alternates: { canonical: "/indian-government-document-sizes-2026" },
};

const PDF_ROWS: Array<{ job: string; cap: string; href: string }> = [
  { job: "Aadhaar PDF (KYC)", cap: "200 KB typical", href: "/tools/compress-aadhaar-pdf" },
  { job: "PAN document (NSDL / Protean)", cap: "100 KB typical", href: "/tools/compress-pan-document" },
  { job: "Passbook / cancelled cheque", cap: "500 KB typical", href: "/tools/compress-passbook" },
  { job: "Character / caste / GST / Form 16", cap: "500 KB typical", href: "/tools/compress-character-certificate" },
  { job: "Passport scan", cap: "500 KB typical", href: "/tools/compress-passport-scan" },
  { job: "Portal PDF 2 MB", cap: "2 MB", href: "/tools/compress-pdf-to-2mb" },
];

export default function IndianGovSizesPage() {
  const rows = PHOTO_SPECS.filter((spec) => spec.countrySlug === "india").sort((a, b) =>
    a.document.localeCompare(b.document),
  );
  return (
    <>
      <SizeHub
        kicker="India  /  2026"
        title="Indian government document sizes"
        lede="Passport and OCI are 51×51 mm. Aadhaar, voter, and most exams are 35×45 mm. PAN photo is 2.5×3.5 cm. IBPS/SBI portraits are 200×230 px. PDF caps are typical portal windows — confirm on the form."
        extraNote="This is not a government website. Last checked: September 2026."
        rows={rows}
      />
      <section className="container-page pb-16">
        <h2 className="display text-3xl">PDF caps (typical)</h2>
        <ul className="mt-6 divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {PDF_ROWS.map((row) => (
            <li key={row.href} className="flex flex-wrap items-baseline justify-between gap-4 py-4 text-sm">
              <span>{row.job}</span>
              <span className="text-[var(--ink-soft)]">{row.cap}</span>
              <Link href={row.href} className="text-brand no-underline">
                Open
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
