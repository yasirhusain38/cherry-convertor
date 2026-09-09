import type { Metadata } from "next";
import { SizeHub } from "@/components/SizeHub";
import { PHOTO_SPECS } from "@/data/photo-specs";

export const metadata: Metadata = {
  title: "ID photo sizes (NID, CNIC, Emirates ID, Aadhaar) — No Upload",
  description:
    "National ID photo millimetres and typical KB caps. Bangladesh NID, Pakistan CNIC, UAE Emirates ID, Aadhaar. Confirm on the portal. No upload.",
  alternates: { canonical: "/id-photo-sizes" },
};

export default function IdPhotoSizesPage() {
  const rows = PHOTO_SPECS.filter((spec) =>
    /id|nid|cnic|aadhaar|nric|mykad|emirates|iqama|voter|citizenship|ine|ktp|huduma|ration|pan card|oci/i.test(
      `${spec.document} ${spec.id} ${spec.label}`,
    ),
  )
    .filter((spec) => !/passport|visa|licence|license|exam|neet|jee|upsc|ssc|ibps/i.test(spec.document))
    .sort((a, b) => a.country.localeCompare(b.country));
  return (
    <SizeHub
      kicker="Sizes  /  ID"
      title="ID photo sizes"
      lede="National ID crops are not always ICAO 35×45. Bangladesh NID is often a small square JPEG. Pakistan CNIC is crop/resize only — this site does not issue a card."
      rows={rows}
    />
  );
}
