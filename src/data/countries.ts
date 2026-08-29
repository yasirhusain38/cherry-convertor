export type CountryHub = {
  slug: string;
  name: string;
  region: string;
  blurb: string;
  /** Supporting compressors and size tools for this country only — photo tools attach from photo specs. */
  toolSlugs: string[];
};

function hub(slug: string, name: string, region: string, blurb: string, toolSlugs: string[] = ["compress-pdf"]): CountryHub {
  return { slug, name, region, blurb, toolSlugs };
}

const NA = "North America";
const EU = "Europe";
const ME = "Middle East";
const SA = "South Asia";
const EA = "East & Southeast Asia";
const AF = "Africa";
const LA = "Latin America";
const OC = "Oceania";
const CA = "Central Asia";

import { EXTRA_COUNTRIES } from "./world-extra";

export const COUNTRIES: CountryHub[] = [
  // North America
  hub(
    "canada",
    "Canada",
    NA,
    "50×70 mm passport prints and 35×45 mm IRCC visa / study / work photos — two different frames.",
    ["compress-pdf", "compress-pcc"],
  ),
  hub(
    "united-states",
    "United States",
    NA,
    "2×2 inch (600×600) photos for passports, DS-160 visas, Green Card / DV lottery, and driver’s licences — plus PDF compressors for supporting documents.",
    ["resize-image-to-240kb", "compress-pdf-to-2mb", "compress-bank-statement", "heic-to-jpg"],
  ),

  // Europe
  hub("albania", "Albania", EU, "Leternjoftim and passport photos at 35×45 mm."),
  hub("armenia", "Armenia", EU, "ID and passport photos at 35×45 mm."),
  hub(
    "austria",
    "Austria",
    EU,
    "ID, passport, and Führerschein photos at 35×45 mm.",
    ["compress-pdf"],
  ),
  hub("azerbaijan", "Azerbaijan", EU, "ID and passport photos at 35×45 mm."),
  hub("belarus", "Belarus", EU, "Passport photos at 35×45 mm."),
  hub(
    "belgium",
    "Belgium",
    EU,
    "eID, passport, and rijbewijs photos at 35×45 mm.",
    ["compress-pdf"],
  ),
  hub("bosnia-and-herzegovina", "Bosnia and Herzegovina", EU, "Lična karta and passport photos at 35×45 mm."),
  hub(
    "bulgaria",
    "Bulgaria",
    EU,
    "Лична карта, passport, and driving-licence photos at 35×45 mm.",
  ),
  hub("croatia", "Croatia", EU, "Osobna iskaznica, passport, and vozačka photos at 35×45 mm."),
  hub("cyprus", "Cyprus", EU, "ID and passport photos at 35×45 mm."),
  hub("czechia", "Czechia", EU, "Občanský průkaz and Řidičský průkaz photos at 35×45 mm."),
  hub("denmark", "Denmark", EU, "Passport and kørekort photos at 35×45 mm."),
  hub("estonia", "Estonia", EU, "ID-kaart and passport photos at 35×45 mm."),
  hub("finland", "Finland", EU, "Passport photos at 36×47 mm and ajokortti at 35×45 mm."),
  hub(
    "france",
    "France",
    EU,
    "Carte d’identité and passport photos for ANTS — 35×45 mm, light grey.",
    ["compress-pdf"],
  ),
  hub("georgia", "Georgia", EU, "ID and passport photos at 35×45 mm."),
  hub(
    "germany",
    "Germany",
    EU,
    "Personalausweis and passport photos at 35×45 mm with a light-grey biometric background.",
    ["compress-pdf-to-2mb"],
  ),
  hub("greece", "Greece", EU, "Tautotita, passport, and driving-licence photos at 35×45 mm."),
  hub("hungary", "Hungary", EU, "Személyi igazolvány and jogosítvány photos at 35×45 mm."),
  hub("iceland", "Iceland", EU, "Passport photos at 35×45 mm with a light-grey background."),
  hub("ireland", "Ireland", EU, "35×45 mm Irish passport and NDLS driving-licence photos."),
  hub("italy", "Italy", EU, "CIE / carta d’identità and driving-licence photos at 35×45 mm."),
  hub("latvia", "Latvia", EU, "eID and passport photos at 35×45 mm."),
  hub("lithuania", "Lithuania", EU, "ID and passport photos at 35×45 mm."),
  hub("luxembourg", "Luxembourg", EU, "Carte d’identité and passport photos at 35×45 mm."),
  hub("malta", "Malta", EU, "ID and passport photos at 35×45 mm."),
  hub("moldova", "Moldova", EU, "Buletin and passport photos at 35×45 mm."),
  hub("montenegro", "Montenegro", EU, "Lična karta and passport photos at 35×45 mm."),
  hub("netherlands", "Netherlands", EU, "Dutch ID, passport, and rijbewijs photos at 35×45 mm."),
  hub("north-macedonia", "North Macedonia", EU, "ID and passport photos at 35×45 mm."),
  hub("norway", "Norway", EU, "Passport and førerkort photos at 35×45 mm."),
  hub("poland", "Poland", EU, "Dowód osobisty, passport, and prawo jazdy photos at 35×45 mm."),
  hub("portugal", "Portugal", EU, "Cartão de cidadão and driving-licence photos."),
  hub("romania", "Romania", EU, "Carte de identitate and driving-licence photos at 35×45 mm."),
  hub(
    "russia",
    "Russia",
    EU,
    "35×45 mm international passport photos.",
    ["compress-pdf"],
  ),
  hub(
    "schengen",
    "Schengen Area",
    EU,
    "One 35×45 mm visa photo spec used across Germany, France, Spain, Italy, the Netherlands, and more.",
    ["compress-pdf-to-2mb"],
  ),
  hub("serbia", "Serbia", EU, "35×45 mm ID, passport, and vozačka photos."),
  hub("slovakia", "Slovakia", EU, "Občiansky preukaz and vodičský preukaz photos at 35×45 mm."),
  hub("slovenia", "Slovenia", EU, "Osebna izkaznica and passport photos at 35×45 mm."),
  hub("spain", "Spain", EU, "DNI portraits (26×32 mm) and driving-licence photos."),
  hub("sweden", "Sweden", EU, "Swedish ID, passport, and körkort photos at 35×45 mm."),
  hub("switzerland", "Switzerland", EU, "Swiss identity card and Führerausweis photos at 35×45 mm."),
  hub("turkey", "Turkey", EU, "50×60 mm T.C. kimlik, passport, and ehliyet portraits."),
  hub("ukraine", "Ukraine", EU, "35×45 mm ID, passport, and driving-licence photos."),
  hub(
    "united-kingdom",
    "United Kingdom",
    EU,
    "35×45 mm UK passport, visa, and driving-licence photos, plus document compressors for GOV.UK-style uploads.",
    ["compress-pdf", "compress-bank-statement", "compress-payslip", "compress-pcc", "compress-tenancy"],
  ),

  // Middle East
  hub("bahrain", "Bahrain", ME, "CPR and 4×6 cm passport photos."),
  hub("iran", "Iran", ME, "4×6 cm ID and passport portraits."),
  hub("iraq", "Iraq", ME, "National ID portraits."),
  hub("israel", "Israel", ME, "Teudat zehut and passport photos at 35×45 mm."),
  hub("jordan", "Jordan", ME, "National ID and passport portraits."),
  hub("kuwait", "Kuwait", ME, "PACI civil ID and 4×6 cm passport photos."),
  hub("lebanon", "Lebanon", ME, "National ID and passport portraits."),
  hub("oman", "Oman", ME, "ROP ID and 4×6 cm passport photos."),
  hub("qatar", "Qatar", ME, "Qatar ID and passport portraits for MOI-style uploads.", ["compress-payslip"]),
  hub(
    "saudi-arabia",
    "Saudi Arabia",
    ME,
    "Iqama / Absher resident photos and payslip compressors for visa and HR files.",
    ["compress-payslip", "compress-bank-statement"],
  ),
  hub(
    "uae",
    "United Arab Emirates",
    ME,
    "Emirates ID, visa, and driving-licence photos with a 100 KB cap that ICP and RTA portals often enforce.",
    [
      "compress-bank-statement",
      "compress-payslip",
      "compress-pdf-to-2mb",
      "compress-tenancy",
      "compress-pcc",
      "signature-resizer",
    ],
  ),
  hub("yemen", "Yemen", ME, "4×6 cm ID and passport portraits."),

  // South Asia
  hub("afghanistan", "Afghanistan", SA, "Tazkira / e-Tazkira portraits.", ["compress-pdf"]),
  hub(
    "bangladesh",
    "Bangladesh",
    SA,
    "NID / voter photos and marksheet compressors for local e-services.",
    ["resize-image-to-50kb", "compress-marksheet"],
  ),
  hub("bhutan", "Bhutan", SA, "Citizenship ID and passport portraits."),
  hub(
    "india",
    "India",
    SA,
    "Aadhaar, PAN, passport, voter ID, driving licence, NEET, JEE, SSC, IBPS, signature, and 20–50 KB form uploads.",
    [
      "signature-resizer",
      "compress-marksheet",
      "compress-form-16",
      "compress-itr",
      "compress-rent-agreement",
      "compress-aadhaar",
      "compress-pan-card",
      "compress-caste-certificate",
      "compress-ews-certificate",
      "compress-ration-card",
      "compress-gst-certificate",
      "compress-affidavit",
      "resize-image-to-50kb",
      "resize-image-to-20kb",
    ],
  ),
  hub("maldives", "Maldives", SA, "Passport photos at 35×45 mm with a light-grey background."),
  hub("nepal", "Nepal", SA, "Citizenship ID and e-passport photos."),
  hub(
    "pakistan",
    "Pakistan",
    SA,
    "CNIC / NADRA portraits and document compressors for e-tokens and visa packs.",
    ["resize-image-to-50kb", "compress-marksheet", "compress-bank-statement"],
  ),
  hub("sri-lanka", "Sri Lanka", SA, "NIC and passport portraits plus document compressors.", ["compress-marksheet"]),

  // East & Southeast Asia
  hub("brunei", "Brunei", EA, "IC and passport photos at 35×45 mm."),
  hub("cambodia", "Cambodia", EA, "National ID and passport portraits."),
  hub("china", "China", EA, "China visa and passport photos at 33×48 mm — not 35×45.", ["compress-pdf"]),
  hub("hong-kong", "Hong Kong", EA, "HKID and HKSAR passport photos at 40×50 mm."),
  hub("indonesia", "Indonesia", EA, "KTP photos with red or white background, plus SIM and passport sizes."),
  hub("japan", "Japan", EA, "35×45 mm passport photos and 24×30 mm licence portraits — not the US square."),
  hub("laos", "Laos", EA, "National ID 3×4 cm portraits."),
  hub("macau", "Macau", EA, "BIR portraits at 40×50 mm."),
  hub(
    "malaysia",
    "Malaysia",
    EA,
    "MyKad portraits and supporting-document compressors.",
    ["compress-pdf"],
  ),
  hub("myanmar", "Myanmar", EA, "NRC and passport portraits."),
  hub(
    "philippines",
    "Philippines",
    EA,
    "PhilID / PhilSys portraits.",
    ["compress-pdf", "resize-image-to-50kb"],
  ),
  hub(
    "singapore",
    "Singapore",
    EA,
    "NRIC / FIN digital photos with a tight file cap for ICA-style uploads.",
    ["compress-pdf-to-1mb"],
  ),
  hub(
    "south-korea",
    "South Korea",
    EA,
    "K-ETA 700×700 px photos with a 100 KB cap, plus 35×45 mm passport photos.",
    ["resize-image-to-100kb"],
  ),
  hub("taiwan", "Taiwan", EA, "Taiwan ID and passport photos at 35×45 mm."),
  hub("thailand", "Thailand", EA, "Thai ID and passport photos at 35×45 mm.", ["compress-pdf"]),
  hub("timor-leste", "Timor-Leste", EA, "ID and passport photos at 35×45 mm."),
  hub("vietnam", "Vietnam", EA, "CCCD 3×4 cm and passport 4×6 cm portraits."),

  // Africa
  hub("algeria", "Algeria", AF, "Carte nationale photos at 35×45 mm."),
  hub("angola", "Angola", AF, "BI and passport photos at 35×45 mm."),
  hub("botswana", "Botswana", AF, "Omang and passport photos at 35×45 mm."),
  hub("cameroon", "Cameroon", AF, "CNI and passport photos at 35×45 mm."),
  hub("cote-divoire", "Côte d’Ivoire", AF, "CNI / CEDEAO portraits at 35×45 mm."),
  hub("democratic-republic-of-the-congo", "DR Congo", AF, "ID and passport photos at 35×45 mm."),
  hub("egypt", "Egypt", AF, "National ID and passport portraits in a 4×6 cm style.", ["compress-pdf"]),
  hub("ethiopia", "Ethiopia", AF, "National ID and passport photos at 35×45 mm.", ["compress-pdf"]),
  hub("ghana", "Ghana", AF, "Ghana Card enrolment and passport portraits.", ["compress-pdf"]),
  hub(
    "kenya",
    "Kenya",
    AF,
    "National ID / Huduma photos and document compressors.",
    ["compress-pdf", "compress-bank-statement"],
  ),
  hub("libya", "Libya", AF, "4×6 cm ID and passport portraits."),
  hub("madagascar", "Madagascar", AF, "CIN and passport photos at 35×45 mm."),
  hub("malawi", "Malawi", AF, "National ID and passport photos at 35×45 mm."),
  hub("mauritius", "Mauritius", AF, "ID and passport photos at 35×45 mm."),
  hub("morocco", "Morocco", AF, "CIN / carte nationale photos at 35×45 mm."),
  hub("mozambique", "Mozambique", AF, "BI and passport photos at 35×45 mm."),
  hub("namibia", "Namibia", AF, "National ID and passport photos at 35×45 mm."),
  hub(
    "nigeria",
    "Nigeria",
    AF,
    "NIN and e-passport photos plus PDF compressors for study and work applications.",
    ["compress-pdf-to-2mb", "compress-bank-statement"],
  ),
  hub("rwanda", "Rwanda", AF, "National ID and passport portraits at 35×45 mm."),
  hub("senegal", "Senegal", AF, "CEDEAO / national ID portraits at 35×45 mm."),
  hub(
    "south-africa",
    "South Africa",
    AF,
    "Smart ID and passport photos at 35×45 mm.",
    ["compress-pdf-to-2mb"],
  ),
  hub("sudan", "Sudan", AF, "National ID and passport photos at 35×45 mm."),
  hub("tanzania", "Tanzania", AF, "NIDA national ID photos."),
  hub("tunisia", "Tunisia", AF, "CIN photos at 35×45 mm."),
  hub("uganda", "Uganda", AF, "NIRA national ID photos."),
  hub("zambia", "Zambia", AF, "National ID and passport photos at 35×45 mm."),
  hub("zimbabwe", "Zimbabwe", AF, "National ID and passport photos at 35×45 mm."),

  // Latin America
  hub("argentina", "Argentina", LA, "DNI and 35×45 mm passport portraits."),
  hub("bolivia", "Bolivia", LA, "CI 3×4 cm photos."),
  hub(
    "brazil",
    "Brazil",
    LA,
    "RG and CNH 3×4 cm photos — not a US 2×2 square.",
    ["compress-pdf", "compress-bank-statement"],
  ),
  hub("chile", "Chile", LA, "Cédula / carnet and passport photos."),
  hub("colombia", "Colombia", LA, "Cédula and passport 3×4 cm photos."),
  hub("costa-rica", "Costa Rica", LA, "Cédula 3×4 cm photos."),
  hub("cuba", "Cuba", LA, "Carné and passport 3×4 cm photos."),
  hub("dominican-republic", "Dominican Republic", LA, "Cédula 3×4 cm photos."),
  hub("ecuador", "Ecuador", LA, "Cédula 3×4 cm photos."),
  hub("el-salvador", "El Salvador", LA, "DUI 3×4 cm and passport 35×45 mm photos."),
  hub("guatemala", "Guatemala", LA, "DPI / cédula 3×4 cm photos."),
  hub("haiti", "Haiti", LA, "CIN and passport photos at 35×45 mm."),
  hub("honduras", "Honduras", LA, "DNI 3×4 cm and passport 35×45 mm photos."),
  hub("jamaica", "Jamaica", LA, "ID and passport photos at 35×45 mm."),
  hub("mexico", "Mexico", LA, "INE / credencial portraits and supporting PDF compressors.", ["compress-pdf"]),
  hub("nicaragua", "Nicaragua", LA, "Cédula 3×4 cm photos."),
  hub("panama", "Panama", LA, "Cédula 3×4 cm photos."),
  hub("paraguay", "Paraguay", LA, "Cédula 3×4 cm photos."),
  hub("peru", "Peru", LA, "DNI portraits for RENIEC-style uploads."),
  hub("puerto-rico", "Puerto Rico", LA, "US 2×2 inch passport and REAL ID photos."),
  hub("trinidad-and-tobago", "Trinidad and Tobago", LA, "ID and passport photos at 35×45 mm."),
  hub("uruguay", "Uruguay", LA, "Cédula 3×4 cm photos."),
  hub("venezuela", "Venezuela", LA, "Cédula 3×4 cm photos."),

  // Oceania
  hub(
    "australia",
    "Australia",
    OC,
    "35×45 mm Australian passport and driver-licence photos, plus PDF compressors for visa packs.",
    ["compress-pdf", "compress-bank-statement", "compress-pcc"],
  ),
  hub("fiji", "Fiji", OC, "Passport photos at 35×45 mm."),
  hub(
    "new-zealand",
    "New Zealand",
    OC,
    "35×45 mm NZ passport and driver-licence photos.",
    ["compress-pdf"],
  ),
  hub("papua-new-guinea", "Papua New Guinea", OC, "Passport photos at 35×45 mm."),
  hub("samoa", "Samoa", OC, "Passport photos at 35×45 mm."),

  // Central Asia
  hub("kazakhstan", "Kazakhstan", CA, "35×45 mm ID, passport, and driving-licence photos."),
  hub("kyrgyzstan", "Kyrgyzstan", CA, "ID and passport photos at 35×45 mm."),
  hub("mongolia", "Mongolia", CA, "ID and passport photos at 35×45 mm."),
  hub("tajikistan", "Tajikistan", CA, "ID and passport photos at 35×45 mm."),
  hub("uzbekistan", "Uzbekistan", CA, "35×45 mm ID and passport photos."),
  ...EXTRA_COUNTRIES,
];

export function getCountry(slug: string): CountryHub | undefined {
  return COUNTRIES.find((item) => item.slug === slug);
}
