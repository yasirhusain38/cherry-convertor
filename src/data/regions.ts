import { COUNTRIES, type CountryHub } from "./countries";

export type RegionHub = {
  slug: string;
  name: string;
  blurb: string;
};

export const REGIONS: RegionHub[] = [
  {
    slug: "north-america",
    name: "North America",
    blurb: "US 2×2, DS-160 240KB, Canada 50×70, Mexico INE.",
  },
  {
    slug: "europe",
    name: "Europe",
    blurb: "UK, Schengen, Germany, France, and national ID photos at 35×45 mm.",
  },
  {
    slug: "middle-east",
    name: "Middle East",
    blurb: "Emirates ID, Iqama, Qatar, Kuwait, and GCC resident photos.",
  },
  {
    slug: "south-asia",
    name: "South Asia",
    blurb: "Aadhaar, PAN, CNIC, NID, NIC, and 20–50 KB form uploads.",
  },
  {
    slug: "east-southeast-asia",
    name: "East & Southeast Asia",
    blurb: "Japan 35×45, K-ETA 700×700, MyKad, NRIC, KTP, PhilID, China 33×48.",
  },
  {
    slug: "africa",
    name: "Africa",
    blurb: "NIN, Ghana Card, Smart ID, Kenyan ID, and passport photos.",
  },
  {
    slug: "latin-america",
    name: "Latin America",
    blurb: "INE, RG/CNH 3×4, cédula and DNI portraits.",
  },
  {
    slug: "oceania",
    name: "Oceania",
    blurb: "Australia, New Zealand, Fiji, PNG, and Samoa 35×45 mm photos.",
  },
];

export function getRegion(slug: string): RegionHub | undefined {
  return REGIONS.find((item) => item.slug === slug);
}

export function regionSlugFromName(name: string): string | undefined {
  return REGIONS.find((item) => item.name === name)?.slug;
}

export function countriesInRegion(regionName: string): CountryHub[] {
  return COUNTRIES.filter((country) => country.region === regionName);
}
