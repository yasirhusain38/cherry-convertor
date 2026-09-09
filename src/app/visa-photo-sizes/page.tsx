import type { Metadata } from "next";
import { SizeHub } from "@/components/SizeHub";
import { PHOTO_SPECS } from "@/data/photo-specs";

export const metadata: Metadata = {
  title: "Visa photo sizes (Schengen, DS-160, India) — No Upload",
  description:
    "Visa photo millimetres, pixels, and file caps. Schengen 35×45, US DS-160 600×600 54–240 KB. Confirm on the consulate form. No upload.",
  alternates: { canonical: "/visa-photo-sizes" },
};

export default function VisaPhotoSizesPage() {
  const rows = PHOTO_SPECS.filter((spec) => /visa|ds-160|eta|nzeta|brp/i.test(`${spec.document} ${spec.id}`)).sort(
    (a, b) => a.country.localeCompare(b.country),
  );
  return (
    <SizeHub
      kicker="Sizes  /  Visa"
      title="Visa photo sizes"
      lede="Schengen posts share 35×45 mm. US DS-160 is a 600×600 JPEG between 54 and 240 KB. Canada visitor/study photos are 35×45 mm — not the 50×70 passport print."
      extraNote="One Schengen tool covers DE/FR/NL/ES/IT and the rest unless a national ID crop differs."
      rows={rows}
    />
  );
}
