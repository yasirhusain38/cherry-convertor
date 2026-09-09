import type { Metadata } from "next";
import { SizeHub } from "@/components/SizeHub";
import { PHOTO_SPECS } from "@/data/photo-specs";

export const metadata: Metadata = {
  title: "Exam photo sizes (NEET, JEE, UPSC, SSC, IBPS) — No Upload",
  description:
    "Indian exam photo millimetres, pixels, and KB windows. IBPS/SBI is 200×230 px, not 35×45 mm. Confirm the brochure. No upload.",
  alternates: { canonical: "/exam-photo-sizes" },
};

export default function ExamPhotoSizesPage() {
  const rows = PHOTO_SPECS.filter((spec) =>
    /neet|jee|upsc|ssc|ibps|cat|gate|nda|rrb|sbi|exam|college/i.test(`${spec.id} ${spec.document}`),
  ).sort((a, b) => a.label.localeCompare(b.label));
  return (
    <SizeHub
      kicker="Sizes  /  Exam"
      title="Exam photo sizes"
      lede="Most Indian boards want 35×45 mm, 10–50 KB JPEG. IBPS and SBI PO use 200×230 pixels. Check that year’s notification — KB windows move."
      extraNote="SAT/GRE 20 KB pages are not invented here. Bangladesh BCS and Pakistan CSS get a row only when a published photo rule is sourced."
      rows={rows}
    />
  );
}
