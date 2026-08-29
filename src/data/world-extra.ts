import type { CountryHub } from "./countries";
import type { PhotoSpec } from "./photo-specs";
import type { ToolDef } from "@/lib/tools";

const AF = "Africa";
const EU = "Europe";
const LA = "Latin America";
const OC = "Oceania";
const CA = "Central Asia";
const ME = "Middle East";
const NA = "North America";
const SA = "South Asia";
const EA = "East & Southeast Asia";

type Extra = [string, string, string, string, number, number, string];

/** Missing UN members + Holy See + Palestine. Default ICAO 35×45 mm unless noted. */
const EXTRA: Extra[] = [
  ["andorra", "Andorra", EU, "Andorran passport photos at 35×45 mm.", 35, 45, "#D8D8D8"],
  ["antigua-and-barbuda", "Antigua and Barbuda", NA, "Passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["bahamas", "Bahamas", NA, "Passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["barbados", "Barbados", NA, "Passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["belize", "Belize", LA, "Passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["benin", "Benin", AF, "CEDEAO / passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["burkina-faso", "Burkina Faso", AF, "CNIB / passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["burundi", "Burundi", AF, "National ID and passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["cabo-verde", "Cabo Verde", AF, "Passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["central-african-republic", "Central African Republic", AF, "Passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["chad", "Chad", AF, "Passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["comoros", "Comoros", AF, "Passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["congo", "Congo", AF, "Passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["djibouti", "Djibouti", AF, "Passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["dominica", "Dominica", NA, "Passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["equatorial-guinea", "Equatorial Guinea", AF, "Passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["eritrea", "Eritrea", AF, "Passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["eswatini", "Eswatini", AF, "Passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["gabon", "Gabon", AF, "Passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["gambia", "Gambia", AF, "Passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["grenada", "Grenada", NA, "Passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["guinea", "Guinea", AF, "Passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["guinea-bissau", "Guinea-Bissau", AF, "Passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["guyana", "Guyana", LA, "Passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["holy-see", "Holy See", EU, "Vatican passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["kiribati", "Kiribati", OC, "Passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["lesotho", "Lesotho", AF, "Passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["liberia", "Liberia", AF, "Passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["liechtenstein", "Liechtenstein", EU, "Passport photos at 35×45 mm. Light grey.", 35, 45, "#D8D8D8"],
  ["mali", "Mali", AF, "NINA / passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["marshall-islands", "Marshall Islands", OC, "Passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["mauritania", "Mauritania", AF, "Passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["micronesia", "Micronesia", OC, "Passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["monaco", "Monaco", EU, "Carte d’identité photos at 35×45 mm.", 35, 45, "#D8D8D8"],
  ["nauru", "Nauru", OC, "Passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["niger", "Niger", AF, "Passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["north-korea", "North Korea", EA, "Passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["palau", "Palau", OC, "Passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["palestine", "Palestine", ME, "Passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["saint-kitts-and-nevis", "Saint Kitts and Nevis", NA, "Passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["saint-lucia", "Saint Lucia", NA, "Passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["saint-vincent-and-the-grenadines", "Saint Vincent and the Grenadines", NA, "Passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["san-marino", "San Marino", EU, "Passport photos at 35×45 mm.", 35, 45, "#D8D8D8"],
  ["sao-tome-and-principe", "Sao Tome and Principe", AF, "Passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["seychelles", "Seychelles", AF, "Passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["sierra-leone", "Sierra Leone", AF, "Passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["solomon-islands", "Solomon Islands", OC, "Passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["somalia", "Somalia", AF, "Passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["south-sudan", "South Sudan", AF, "Passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["suriname", "Suriname", LA, "Passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["syria", "Syria", ME, "Passport photos at 4×6 cm.", 40, 60, "#FFFFFF"],
  ["togo", "Togo", AF, "Passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["tonga", "Tonga", OC, "Passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["turkmenistan", "Turkmenistan", CA, "Passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["tuvalu", "Tuvalu", OC, "Passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
  ["vanuatu", "Vanuatu", OC, "Passport photos at 35×45 mm.", 35, 45, "#FFFFFF"],
];

function hubFrom(row: Extra): CountryHub {
  return {
    slug: row[0],
    name: row[1],
    region: row[2],
    blurb: row[3],
    toolSlugs: ["compress-pdf"],
  };
}

export const EXTRA_COUNTRIES: CountryHub[] = EXTRA.map(hubFrom);

export const EXTRA_PHOTO_SPECS: PhotoSpec[] = EXTRA.map((row) => ({
  id: `${row[0]}-passport`,
  country: row[1],
  countrySlug: row[0],
  document: "Passport",
  label: `${row[1]} Passport`,
  widthMm: row[4],
  heightMm: row[5],
  dpi: 300,
  widthPx: Math.round((row[4] / 25.4) * 300),
  heightPx: Math.round((row[5] / 25.4) * 300),
  maxKB: 240,
  background: row[6],
  backgroundLabel: row[6] === "#FFFFFF" ? "White" : "Light grey",
  notes: `${row[1]} passport-style ${row[4]}×${row[5]} mm. Confirm the current embassy leaflet. Processed on this device.`,
}));

export const EXTRA_PHOTO_TOOLS: ToolDef[] = EXTRA.map((row) => ({
  slug: `${row[0]}-passport-photo`,
  name: `${row[1]} Passport Photo Maker`,
  category: "documents",
  mode: "photo",
  kicker: `${row[1]}  /  Passport`,
  h1: `${row[1]} passport photo (${row[4]}×${row[5]} mm)`,
  lede: `${row[3]} Crop on this device. File never uploaded.`,
  metaTitle: `${row[1]} Passport Photo ${row[4]}x${row[5]}mm Free – Cherry Converter`,
  metaDescription: `Make a ${row[4]}×${row[5]} mm ${row[1]} passport photo in your browser. No upload.`,
  keywords: [`${row[1].toLowerCase()} passport photo`, `${row[1].toLowerCase()} visa photo`],
  photoPreset: `${row[0]}-passport`,
  faqs: [
    {
      q: "Is this the official size?",
      a: "It follows the common ICAO 35×45 mm (or the mm listed). Embassies update leaflets — confirm before you print.",
    },
    {
      q: "Is my photo uploaded?",
      a: "No. Canvas crop runs in this tab.",
    },
  ],
  related: ["passport-photo-maker", "exif-metadata-remover", "compress-pdf"],
}));
