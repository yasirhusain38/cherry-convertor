import { COUNTRIES } from "@/data/countries";
import { FINANCE_TOOLS } from "@/data/finance-tools";
import { PHOTO_SPECS } from "@/data/photo-specs";
import { REGIONS } from "@/data/regions";
import { CATEGORIES, TOOLS } from "@/lib/tools";

export type SearchKind = "tool" | "finance" | "country" | "region" | "page";

export type SearchHit = {
  id: string;
  href: string;
  title: string;
  lede: string;
  kind: SearchKind;
  group: string;
  haystack: string;
};

const PAGES: Array<{ href: string; title: string; lede: string; keywords: string }> = [
  { href: "/", title: "Home", lede: "Free image tools. 100% Privacy.", keywords: "cherry converter compress resize" },
  { href: "/tools", title: "All tools", lede: "Compress, PDF, OCR, QR, color, time zones, UUID, document photos.", keywords: "inventory tools pdf ocr qr wcag est gmt uuid" },
  { href: "/finance", title: "Finance calculators", lede: "EMI, tax, GST, VAT, mortgage, currency.", keywords: "calculators money" },
  { href: "/countries", title: "Tools by country", lede: "Passport, visa, and ID photo hubs.", keywords: "india usa uk uae" },
  { href: "/regions", title: "Tools by region", lede: "Nine world regions.", keywords: "europe asia africa" },
  { href: "/search", title: "Search", lede: "Find any tool, country, or calculator.", keywords: "find lookup" },
  { href: "/about", title: "About", lede: "Cherry Converter — browser-side image tools.", keywords: "about" },
  { href: "/privacy", title: "Privacy", lede: "No uploads. Processing stays on your device.", keywords: "privacy gdpr" },
  { href: "/contact", title: "Contact", lede: "Get in touch.", keywords: "email support" },
  { href: "/blog", title: "Journal", lede: "Notes from the project.", keywords: "blog journal" },
];

const categoryLabel = new Map(CATEGORIES.map((item) => [item.id, item.label]));

const specsHay = new Map<string, string>();
for (const spec of PHOTO_SPECS) {
  const prev = specsHay.get(spec.countrySlug) ?? "";
  specsHay.set(spec.countrySlug, `${prev} ${spec.document} ${spec.id}`);
}

function pack(
  id: string,
  href: string,
  title: string,
  lede: string,
  kind: SearchKind,
  group: string,
  extra: string,
): SearchHit {
  return {
    id,
    href,
    title,
    lede,
    kind,
    group,
    haystack: `${title} ${lede} ${extra} ${href}`.toLowerCase(),
  };
}

export const SEARCH_INDEX: SearchHit[] = [
  ...TOOLS.map((tool) =>
    pack(
      `tool:${tool.slug}`,
      `/tools/${tool.slug}`,
      tool.name,
      tool.lede,
      "tool",
      categoryLabel.get(tool.category) ?? "Tools",
      `${tool.slug} ${tool.h1} ${tool.keywords.join(" ")} ${tool.kicker}`,
    ),
  ),
  ...FINANCE_TOOLS.map((tool) =>
    pack(
      `finance:${tool.slug}`,
      `/finance/${tool.slug}`,
      tool.name,
      tool.lede,
      "finance",
      tool.country,
      `${tool.slug} ${tool.keywords.join(" ")} ${tool.kicker} ${tool.country} calculator tax emi`,
    ),
  ),
  ...COUNTRIES.map((country) =>
    pack(
      `country:${country.slug}`,
      `/countries/${country.slug}`,
      country.name,
      country.blurb,
      "country",
      country.region,
      `${country.slug} ${country.region} ${specsHay.get(country.slug) ?? ""} passport visa id photo`,
    ),
  ),
  ...REGIONS.map((region) =>
    pack(
      `region:${region.slug}`,
      `/regions/${region.slug}`,
      region.name,
      region.blurb,
      "region",
      "Regions",
      `${region.slug} countries hubs`,
    ),
  ),
  ...PAGES.map((page) => pack(`page:${page.href}`, page.href, page.title, page.lede, "page", "Site", page.keywords)),
];

function score(hit: SearchHit, query: string, terms: string[]): number {
  const title = hit.title.toLowerCase();
  if (title === query) return 200;
  if (title.startsWith(query)) return 140;
  let points = 0;
  if (title.includes(query)) points += 80;
  if (hit.haystack.includes(query)) points += 30;
  let matched = 0;
  for (const term of terms) {
    if (title.includes(term)) {
      points += 25;
      matched += 1;
    } else if (hit.haystack.includes(term)) {
      points += 10;
      matched += 1;
    }
  }
  if (matched === terms.length) points += 20;
  return points;
}

export function searchSite(query: string, limit = 48): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (q.length < 1) return [];
  const terms = q.split(/\s+/).filter((term) => term.length > 0);
  return SEARCH_INDEX.map((hit) => ({ hit, points: score(hit, q, terms) }))
    .filter((row) => row.points > 0)
    .sort((a, b) => b.points - a.points || a.hit.title.localeCompare(b.hit.title))
    .slice(0, limit)
    .map((row) => row.hit);
}

export function searchKindLabel(kind: SearchKind): string {
  if (kind === "tool") return "Image tool";
  if (kind === "finance") return "Calculator";
  if (kind === "country") return "Country";
  if (kind === "region") return "Region";
  return "Page";
}
