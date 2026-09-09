import type { FaqItem, ToolDef } from "@/lib/tools";

const local: FaqItem = {
  q: "Is this an official government tool?",
  a: "No. It crops and compresses a photo you already have. Confirm millimetres and KB on the form. The file never leaves this browser tab.",
};

export const TIER1_ENGINE_TOOLS: ToolDef[] = [
  {
    slug: "id-photo-maker",
    name: "ID photo maker",
    category: "documents",
    mode: "photo",
    kicker: "Documents  /  ID",
    h1: "ID photo maker online, on this device",
    lede:
      "Crop a national-ID portrait to millimetres and a KB cap. Search the preset list for NID, CNIC, Emirates ID, Aadhaar, NRIC. Confirm on the official portal.",
    metaTitle: "ID photo maker — No Upload – Cherry Converter",
    metaDescription:
      "ID photo millimetres and KB caps in your browser. NID, CNIC, Emirates ID, Aadhaar. No upload. No account.",
    keywords: ["id photo maker", "id photo resizer", "national id photo size"],
    photoPreset: "icao-35x45",
    faqs: [
      {
        q: "Which size does this default to?",
        a: "ICAO 35×45 mm (413×531 px at 300 DPI). Switch the preset for Bangladesh NID (square), US 2×2, or India 51×51.",
      },
      {
        q: "Can you issue an ID card?",
        a: "No. Crop and file size only. CNIC / green-card / cancelled-cheque generators are not offered.",
      },
      {
        q: "The portal still rejects the file.",
        a: "Check KB, pixels, white vs grey background, glare, and cropped ears. Confirm the circular — KB windows move.",
      },
      local,
    ],
    related: ["bangladesh-nid-photo", "pakistan-cnic-photo", "emirates-id-photo"],
  },
  {
    slug: "print-passport-photos-a4",
    name: "Print passport photos A4",
    category: "documents",
    mode: "photo",
    kicker: "Documents  /  Print",
    h1: "Print passport photos on A4, on this device",
    lede:
      "Crop to the official millimetres, then download an A4 8-up sheet or a 4×6 sheet. Print at a local studio. No upload.",
    metaTitle: "Print passport photos on A4 — No Upload – Cherry Converter",
    metaDescription:
      "Make a passport photo and download an A4 8-up or 4×6 print sheet in your browser. No account.",
    keywords: ["print passport photos a4", "passport photo sheet", "4x6 passport photos"],
    photoPreset: "in-passport",
    faqs: [
      {
        q: "How many copies on A4?",
        a: "Eight copies of the current millimetre size, with a small gap. 4×6 sheets use six copies.",
      },
      {
        q: "India or US?",
        a: "Default is India 51×51 mm. Switch the preset to US 2×2 or UK 35×45 before you print.",
      },
      {
        q: "Will a booth accept this sheet?",
        a: "Use photo paper and the millimetres the form names. This is not a government print shop.",
      },
      local,
    ],
    related: ["passport-photo-maker", "us-passport-photo", "uk-passport-photo"],
  },
  {
    slug: "exam-photo-resizer",
    name: "Exam photo resizer",
    category: "documents",
    mode: "photo",
    kicker: "Documents  /  Exam",
    h1: "Exam photo resizer online, on this device",
    lede:
      "SSC, UPSC, NEET, and JEE portraits: 3.5×4.5 cm and a tight JPEG cap. IBPS/SBI is 200×230 px — use those pages, not this millimetre crop.",
    metaTitle: "Exam photo resizer (SSC, NEET, UPSC) — No Upload – Cherry Converter",
    metaDescription:
      "Resize exam photos to 3.5×4.5 cm and 10–50 KB in your browser. Confirm the brochure. No upload.",
    keywords: ["exam photo resizer", "ssc photo resizer", "neet photo size", "upsc photo 20kb"],
    photoPreset: "in-exam",
    faqs: [
      {
        q: "What photo do SSC and UPSC want?",
        a: "Typically 3.5×4.5 cm JPEG, often 20 KB or 50 KB max. Some notifications still say 4–100 KB. Check that year’s brochure.",
      },
      {
        q: "IBPS or SBI PO?",
        a: "Those forms want 200×230 pixels, not 35×45 mm. Open the IBPS or SBI PO page.",
      },
      {
        q: "Still rejected?",
        a: "File over the KB cap, wrong pixels, glasses, or a grey studio sweep when the form wants white.",
      },
      local,
    ],
    related: ["exam-form-photo-resizer", "india-ibps-photo", "resize-image-to-20kb"],
  },
];
