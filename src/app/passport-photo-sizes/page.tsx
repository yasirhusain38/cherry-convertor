import type { Metadata } from "next";
import { SizeHub } from "@/components/SizeHub";
import { PHOTO_SPECS } from "@/data/photo-specs";

export const metadata: Metadata = {
  title: "Passport photo sizes by country — No Upload",
  description:
    "Passport photo millimetres, pixels, and typical KB caps. ICAO 35×45 unless listed. Confirm on the issuing authority. No upload.",
  alternates: { canonical: "/passport-photo-sizes" },
};

export default function PassportPhotoSizesPage() {
  const rows = PHOTO_SPECS.filter((spec) => /passport/i.test(spec.document) && !/visa/i.test(spec.document)).sort(
    (a, b) => a.country.localeCompare(b.country) || a.document.localeCompare(b.document),
  );
  return (
    <SizeHub
      kicker="Sizes  /  Passport"
      title="Passport photo sizes"
      lede="Crop and export on this device. Countries not in the table use ICAO 35×45 mm (413×531 px at 300 DPI) from the country hub — we do not invent a unique page per ISO code."
      extraNote="US is 2×2 in (600×600). India/OCI is 51×51 mm. Canada print is 50×70 mm. China is 33×48 mm. Saudi/Egypt prints are often 40×60 mm."
      rows={rows}
    />
  );
}
