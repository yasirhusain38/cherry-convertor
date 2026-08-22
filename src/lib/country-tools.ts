import { COUNTRIES, type CountryHub } from "@/data/countries";
import { PHOTO_SPECS } from "@/data/photo-specs";
import { TOOLS, getRelated, type ToolDef } from "@/lib/tools";

const specCountry = new Map(PHOTO_SPECS.map((spec) => [spec.id, spec.countrySlug]));

/** Bank / tax / KYC compressors shown on every country hub. No portrait. */
export const GLOBAL_BANKING_SLUGS = [
  "compress-bank-statement",
  "compress-payslip",
  "compress-proof-of-funds",
  "compress-bank-reference",
  "compress-tax-certificate",
  "compress-cancelled-cheque",
  "compress-passbook",
  "compress-credit-report",
  "compress-iban-letter",
  "compress-pension-statement",
  "compress-insurance-policy",
] as const;

/** Civil / academic / address PDFs shown on every country hub. No portrait. */
export const GLOBAL_CIVIL_SLUGS = [
  "compress-pdf",
  "compress-pcc",
  "compress-birth-certificate",
  "compress-marriage-certificate",
  "compress-utility-bill",
  "compress-marksheet",
  "compress-employment-letter",
  "compress-affidavit",
] as const;

/** Country-specific tax IDs and annual statements. */
export const COUNTRY_FINANCE_SLUGS: Record<string, string[]> = {
  "united-states": ["compress-w2", "compress-1099", "compress-1040"],
  "united-kingdom": ["compress-p60", "compress-p45", "compress-sa302"],
  canada: ["compress-t4", "compress-notice-of-assessment"],
  australia: ["compress-ato-income-statement"],
  "new-zealand": ["compress-ird-summary"],
  germany: ["compress-lohnsteuerbescheinigung"],
  france: ["compress-avis-imposition"],
  spain: ["compress-certificado-renta"],
  italy: ["compress-cud"],
  netherlands: ["compress-jaaropgave"],
  india: ["compress-itr", "compress-form-16", "compress-form-26as", "compress-gst-certificate", "compress-pan-card"],
  pakistan: ["compress-ntn"],
  bangladesh: ["compress-tin-bd"],
  nigeria: ["compress-tin-ng"],
  kenya: ["compress-kra-pin"],
  "south-africa": ["compress-irp5"],
  indonesia: ["compress-npwp"],
  philippines: ["compress-tin-ph"],
  malaysia: ["compress-be-form"],
  singapore: ["compress-iras"],
  japan: ["compress-gensen"],
  "south-korea": ["compress-year-end-settlement"],
  china: ["compress-fapiao"],
  brazil: ["compress-informe-rendimentos"],
  mexico: ["compress-constancia-rfc"],
};

const BANKING_SET = new Set<string>([
  ...GLOBAL_BANKING_SLUGS,
  ...Object.values(COUNTRY_FINANCE_SLUGS).flat(),
]);

export function photoToolsForCountry(countrySlug: string): ToolDef[] {
  return TOOLS.filter((tool) => tool.photoPreset && specCountry.get(tool.photoPreset) === countrySlug);
}

export function bankingToolsForCountry(country: CountryHub): ToolDef[] {
  const slugs = [...GLOBAL_BANKING_SLUGS, ...(COUNTRY_FINANCE_SLUGS[country.slug] ?? [])];
  return getRelated([...new Set(slugs)]);
}

export function supportingToolsForCountry(country: CountryHub): ToolDef[] {
  const owned = new Set(photoToolsForCountry(country.slug).map((tool) => tool.slug));
  const extras = [...GLOBAL_CIVIL_SLUGS, ...country.toolSlugs].filter(
    (slug) => !owned.has(slug) && !BANKING_SET.has(slug),
  );
  return getRelated([...new Set(extras)]);
}

export function nearbyCountries(country: CountryHub): CountryHub[] {
  return COUNTRIES.filter((item) => item.region === country.region && item.slug !== country.slug).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}
