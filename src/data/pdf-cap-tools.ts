import type { FaqItem, ToolDef } from "@/lib/tools";

function pdfCap(opts: {
  slug: string;
  name: string;
  kicker: string;
  h1: string;
  lede: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  documentSpecId: string;
  faqs: FaqItem[];
  related: string[];
}): ToolDef {
  return {
    category: "convert",
    mode: "document-compress",
    ...opts,
  };
}

export const PDF_CAP_TOOLS: ToolDef[] = [
  pdfCap({
    slug: "compress-pdf-under-2mb",
    name: "PDF under 2MB",
    kicker: "PDF  /  Under 2 MB",
    h1: "PDF under 2MB / less than 2MB",
    lede:
      "Portals that say “maximum 2 MB” or “less than 2MB” reject a 2.01 MB file. Drop a PDF or page photos. This tab rebuilds a PDF under 2 MB — a 2 mb file, no account.",
    metaTitle: "PDF under 2MB / less than 2MB – Cherry Converter",
    metaDescription:
      "Make a PDF under 2MB in your browser. Less than 2MB for visa, university, and bank uploads. No account, no server upload.",
    keywords: [
      "pdf under 2mb",
      "pdf less than 2mb",
      "make pdf 2mb",
      "2 mb file",
      "compress pdf under 2mb",
    ],
    documentSpecId: "compress-pdf-under-2mb",
    faqs: [
      {
        q: "Is “under 2MB” the same as 2 MB?",
        a: "Most forms mean at or below 2,097,152 bytes. This page targets just under that cap so a portal that checks “less than 2MB” still accepts the file.",
      },
      {
        q: "Will quality drop?",
        a: "Pages are rebuilt as JPEG. Born-digital text PDFs lose selectable text. Scans usually stay readable at 2 MB unless they are long colour booklets.",
      },
      {
        q: "Scanned PDF vs a Word export?",
        a: "Phone scans are already pictures, so this compressor fits them under 2 MB easily. A 40-page text PDF is rasterized too — keep the original if you still need to copy text.",
      },
      {
        q: "Still over 2 MB after one pass?",
        a: "The engine retries at lower JPEG quality, then shrinks page pixels. If it is still over, drop fewer pages or split the file and upload twice.",
      },
      {
        q: "Which file types?",
        a: "Input: .pdf, or photos of pages (JPG/PNG/HEIC). Output is always a .pdf. No Word, no ZIP.",
      },
      {
        q: "Need 1 MB or 500 KB instead?",
        a: "Use Compress PDF to 1MB or Compress PDF to 500KB. Same engine, tighter cap.",
      },
    ],
    related: ["compress-pdf-to-2mb", "compress-pdf-to-1mb", "compress-pdf-to-500kb"],
  }),
  pdfCap({
    slug: "compress-pdf-under-1mb",
    name: "Compress PDF below 1MB",
    kicker: "PDF  /  Under 1 MB",
    h1: "Compress PDF below 1MB",
    lede:
      "Email and many visa checklists want a PDF below 1 MB. Drop the file here. This is a PDF size reducer 1 mb — processing stays in the tab.",
    metaTitle: "Compress PDF below 1MB – Cherry Converter",
    metaDescription:
      "Compress a PDF below 1MB in your browser. PDF size reducer 1 mb for email and visa checklists. No upload, no account.",
    keywords: [
      "compress pdf below 1mb",
      "pdf under 1mb",
      "pdf size reducer 1 mb",
      "pdf less than 1mb",
      "reduce pdf 1mb",
    ],
    documentSpecId: "compress-pdf-under-1mb",
    faqs: [
      {
        q: "Exact cap?",
        a: "1,048,576 bytes. The download is at or under 1 MB. Type a smaller number if the form says 800 KB.",
      },
      {
        q: "Why not use the 2 MB page?",
        a: "If the checklist says 1 MB, a 1.4 MB file fails even though it is “small”. This page defaults to 1 MB.",
      },
      {
        q: "Scanned vs born-digital?",
        a: "Scans compress well. A dense colour brochure may go soft at 1 MB. Split into two PDFs if the portal allows multiple attachments.",
      },
      {
        q: "Still over 1 MB?",
        a: "After quality and page-shrink passes, drop fewer pages. Long bank statements often need 2–3 files.",
      },
      {
        q: "Format?",
        a: "Output is .pdf only. Photos of pages are accepted as input and become one PDF.",
      },
      {
        q: "Selectable text?",
        a: "No. Pages are rasterized so the file fits. Keep the original if you need to search or copy.",
      },
    ],
    related: ["compress-pdf-to-1mb", "compress-pdf-to-2mb", "compress-pdf-to-500kb"],
  }),
  pdfCap({
    slug: "compress-aadhaar-pdf",
    name: "Compress Aadhaar PDF",
    kicker: "India  /  Aadhaar KYC",
    h1: "Compress Aadhaar PDF for KYC portals",
    lede:
      "Banks, mutual funds, and university KYC forms often cap an Aadhaar PDF at 200 KB. Drop the UIDAI download or a phone scan. Encoding stays in this tab — nothing is sent to UIDAI.",
    metaTitle: "Compress Aadhaar PDF for KYC – Cherry Converter",
    metaDescription:
      "Compress an Aadhaar PDF to 200KB for KYC portals. Runs in your browser. No upload, no account.",
    keywords: [
      "compress aadhaar pdf",
      "how can I compress my aadhaar pdf",
      "aadhaar pdf kyc",
      "aadhaar 200kb",
      "compress aadhaar card pdf",
    ],
    documentSpecId: "compress-aadhaar-pdf",
    faqs: [
      {
        q: "How can I compress my Aadhaar PDF to upload on KYC portals?",
        a: "Drop the PDF on this page. The default cap is 200 KB, which most Indian bank and registrar forms use. Download the new PDF and upload it on the portal yourself.",
      },
      {
        q: "Will the QR still scan?",
        a: "Usually at 200 KB. If a bank app cannot read the QR, type 500 KB in the size box and run again.",
      },
      {
        q: "Masked or full Aadhaar?",
        a: "Use whichever file the portal asks for. This tool only resizes. It does not mask numbers or talk to UIDAI.",
      },
      {
        q: "PAN or voter ID instead?",
        a: "PAN scans are often 100 KB — use Compress PAN document. Voter-card photos belong on the voter-ID photo page.",
      },
      {
        q: "Still too big?",
        a: "Front and back as two photos, dropped in order, usually fit 200 KB. A colour photocopy of a folded card may need 500 KB.",
      },
      {
        q: "Is the file uploaded?",
        a: "No. Rasterizing runs in this browser tab. Close the tab and the scan is gone.",
      },
    ],
    related: ["compress-aadhaar", "compress-pan-document", "aadhaar-photo-resizer"],
  }),
  pdfCap({
    slug: "compress-gas-bill-pdf",
    name: "Compress gas bill PDF",
    kicker: "India  /  Gas bill",
    h1: "Compress a gas bill PDF for address proof",
    lede:
      "KYC and visa packs often want a recent gas, electricity, or water bill under 500 KB. Drop the PDF or a photo of the bill. Rebuilt on this device as a smaller PDF.",
    metaTitle: "Compress gas bill PDF – Cherry Converter",
    metaDescription:
      "Compress a gas bill PDF for KYC and visa address proof. Default 500 KB. Browser-only, no account.",
    keywords: [
      "compress gas bill pdf",
      "gas bill pdf size",
      "utility bill kyc",
      "address proof pdf 500kb",
    ],
    documentSpecId: "compress-gas-bill-pdf",
    faqs: [
      {
        q: "Why 500 KB?",
        a: "Indian bank KYC, apartment portals, and many embassy address-proof lists cap a utility bill at 500 KB. Type 1 MB if yours allows it.",
      },
      {
        q: "Electricity or water bill?",
        a: "Same compressor. Drop any utility PDF or a clear photo of the full page, including the address block.",
      },
      {
        q: "Phone photo of a paper bill?",
        a: "Yes. Shoot flat, no glare on the name and address. Crop later if the portal wants one page.",
      },
      {
        q: "Still over 500 KB?",
        a: "Use one side of the bill, not a booklet. If a stamp is fuzzy after a pass, raise the cap to 1 MB.",
      },
      {
        q: "Format?",
        a: "Output is .pdf. Do not upload a JPG if the form says PDF — this page wraps photos into a PDF.",
      },
      {
        q: "Aadhaar as address proof instead?",
        a: "If the form accepts Aadhaar, use Compress Aadhaar PDF. Gas bills are for forms that want a utility statement.",
      },
    ],
    related: ["compress-utility-bill", "compress-aadhaar-pdf", "compress-bank-statement"],
  }),
  pdfCap({
    slug: "compress-pan-document",
    name: "Compress PAN document",
    kicker: "India  /  NSDL PAN",
    h1: "Compress a PAN document for NSDL / Protean",
    lede:
      "NSDL / Protean e-KYC and IT portals often cap a PAN scan at 100 KB. Drop the card PDF or both sides as photos. Rebuilt in this tab — not an NSDL upload.",
    metaTitle: "Compress PAN document NSDL – Cherry Converter",
    metaDescription:
      "Compress a PAN card or PAN document to 100KB for NSDL / Protean uploads. Browser-only, no account.",
    keywords: [
      "compress pan document",
      "nsdl pan document size",
      "protean pan pdf",
      "pan card pdf 100kb",
      "compress pan card pdf",
    ],
    documentSpecId: "compress-pan-document",
    faqs: [
      {
        q: "What size does NSDL / Protean want?",
        a: "Many PAN e-KYC steps cap a document at 100 KB JPEG or PDF. Confirm the current form. This page defaults to 100 KB.",
      },
      {
        q: "Card vs PAN allotment letter?",
        a: "Both work. Drop the letter PDF, or front then back of the card. Output is one PDF.",
      },
      {
        q: "Need the photo or the signature instead?",
        a: "Photo: PAN card photo resizer (2.5×3.5 cm). Signature: signature resizer (about 10–20 KB). This page is the document scan.",
      },
      {
        q: "Still over 100 KB?",
        a: "One side at a time, good light, no glossy glare. If the name band breaks up, type 200 KB only if the portal allows it.",
      },
      {
        q: "Aadhaar vs PAN?",
        a: "Aadhaar KYC is usually 200 KB. PAN document uploads are tighter. Use the matching page so the default cap is right.",
      },
      {
        q: "Is this the NSDL website?",
        a: "No. Download the smaller PDF here, then upload it on the official NSDL / Protean form.",
      },
    ],
    related: ["compress-pan-card", "pan-card-photo-resizer", "compress-aadhaar-pdf"],
  }),
  pdfCap({
    slug: "merge-pdf-to-500kb",
    name: "Merge PDF to 500KB",
    kicker: "PDF  /  Merge + 500 KB",
    h1: "Merge PDFs, then cap at 500KB",
    lede:
      "Drop two or more PDFs (or page photos). They are merged in drop order, then rebuilt as one PDF at or under 500 KB — a common KYC pack ceiling.",
    metaTitle: "Merge PDF to 500KB – Cherry Converter",
    metaDescription:
      "Merge PDFs and compress the result to 500KB in your browser. For KYC packs that want one small file. No upload.",
    keywords: [
      "merge pdf to 500kb",
      "combine pdf 500kb",
      "merge and compress pdf",
      "pdf 500kb",
    ],
    documentSpecId: "merge-pdf-to-500kb",
    faqs: [
      {
        q: "Does this merge, then compress?",
        a: "Yes. Every dropped PDF or photo becomes a page, in order, then the whole file is encoded to fit 500 KB.",
      },
      {
        q: "Need merge without a cap?",
        a: "Use PDF merger. Come back here when the portal also demands 500 KB.",
      },
      {
        q: "Quality vs size?",
        a: "More pages means softer JPEG. A 20-page colour pack at 500 KB will look worse than a 3-page scan. Split if names become unreadable.",
      },
      {
        q: "Still over 500 KB?",
        a: "Drop fewer files. The engine already retries quality and page size. A long colour statement may need two 500 KB PDFs.",
      },
      {
        q: "Format?",
        a: "Output is one .pdf. Input is .pdf or images of pages.",
      },
      {
        q: "Selectable text?",
        a: "No. Merge-then-cap rasterizes pages so the combined file fits.",
      },
    ],
    related: ["pdf-merger", "compress-pdf-to-500kb", "compress-pdf-to-1mb"],
  }),
  pdfCap({
    slug: "compress-resume-pdf",
    name: "Compress resume PDF",
    kicker: "Documents  /  Resume",
    h1: "Compress a resume PDF to 500KB",
    lede:
      "Naukri, LinkedIn Easy Apply, and campus portals often cap a resume at 500 KB. Drop the PDF. Rebuilt in this tab — keep the DOCX if you still need to edit.",
    metaTitle: "Compress resume PDF to 500KB – Cherry Converter",
    metaDescription:
      "Compress a resume PDF to 500KB for job portals. Runs in your browser. No account, no watermark on the file.",
    keywords: [
      "compress resume pdf",
      "resume pdf 500kb",
      "reduce resume size",
      "job portal resume size",
    ],
    documentSpecId: "compress-resume-pdf",
    faqs: [
      {
        q: "Why 500 KB?",
        a: "A common Indian job-portal attachment cap. Type 1 MB if the board allows it. Do not pad a small file — this tool only shrinks.",
      },
      {
        q: "Will the text stay selectable?",
        a: "No. Pages become images so the file fits. Keep the original DOCX for edits. Export a fresh PDF from Word if a recruiter needs copy-paste.",
      },
      {
        q: "CV instead of resume?",
        a: "Same engine. The CV page is worded for UK/Ireland/UAE boards; this one is for resume / Naukri-style caps.",
      },
      {
        q: "Still over 500 KB?",
        a: "Drop a two-page file, not a portfolio. Screenshots of projects belong in a separate PDF or a link.",
      },
      {
        q: "Format?",
        a: "Output is .pdf. A photo of a printed resume is accepted and wrapped as PDF.",
      },
      {
        q: "Watermark?",
        a: "None. The download is your pages, smaller.",
      },
    ],
    related: ["compress-resume", "compress-cv-pdf", "ats-resume-builder"],
  }),
  pdfCap({
    slug: "compress-cv-pdf",
    name: "Compress CV PDF",
    kicker: "Documents  /  CV",
    h1: "Compress a CV PDF to 500KB",
    lede:
      "UK, Ireland, and Gulf job boards often cap a CV at 500 KB. Drop the PDF. Processing stays in the tab. No account, no watermark.",
    metaTitle: "Compress CV PDF to 500KB – Cherry Converter",
    metaDescription:
      "Compress a CV PDF to 500KB for UK, Ireland, and Gulf job boards. Browser-only, no account.",
    keywords: [
      "compress cv pdf",
      "cv under 500kb",
      "reduce cv size",
      "cv pdf 500kb",
    ],
    documentSpecId: "compress-cv-pdf",
    faqs: [
      {
        q: "Resume or CV?",
        a: "Same 500 KB compressor. Use this page when the board says CV (UK/IE/UAE). Use the resume page for Naukri-style forms.",
      },
      {
        q: "Will ATS still parse it?",
        a: "Rasterized PDFs parse worse. If the board has a text parser, upload a real digital PDF from Word. Use this page only when the size check fails.",
      },
      {
        q: "Still over 500 KB?",
        a: "Two pages, no photo background. Headshots belong on a photo tool, not inside the CV file.",
      },
      {
        q: "Format?",
        a: "Output is .pdf only.",
      },
      {
        q: "Quality vs size?",
        a: "At 500 KB a two-page CV stays readable. A ten-page design portfolio will go soft — split it.",
      },
      {
        q: "Need a fresh CV instead of compressing one?",
        a: "CherryResume builds an ATS-safe DOCX/PDF in this browser. Compress here only when you already have a file the portal rejects.",
      },
    ],
    related: ["compress-resume-pdf", "compress-resume", "ats-resume-builder"],
  }),
  pdfCap({
    slug: "merge-pdf-to-1mb",
    name: "Merge PDF to 1MB",
    kicker: "PDF  /  Merge + 1 MB",
    h1: "Merge PDFs, then cap at 1MB",
    lede:
      "Drop two or more PDFs. They are merged in order, then rebuilt under 1 MB — for email and visa packs that allow 1 MB but want one file.",
    metaTitle: "Merge PDF to 1MB – Cherry Converter",
    metaDescription: "Merge PDFs and compress the result to 1MB in your browser. No upload.",
    keywords: ["merge pdf to 1mb", "combine pdf 1mb", "pdf merge 1 mb"],
    documentSpecId: "merge-pdf-to-1mb",
    faqs: [
      {
        q: "Merge then 1 MB vs 500 KB?",
        a: "Use 500 KB when the portal is tighter. This page defaults to 1 MB so more page detail survives.",
      },
      {
        q: "Still over 1 MB?",
        a: "Drop fewer files. The engine retries quality and page size.",
      },
      {
        q: "Selectable text?",
        a: "No. Cap-and-merge rasterizes pages.",
      },
      {
        q: "Format?",
        a: "Output is one .pdf.",
      },
    ],
    related: ["merge-pdf-to-500kb", "compress-pdf-to-1mb", "pdf-merger"],
  }),
  pdfCap({
    slug: "photo-to-pdf-1mb",
    name: "Photo to PDF 1MB",
    kicker: "PDF  /  Photo 1 MB",
    h1: "Convert photos to a 1MB PDF",
    lede:
      "Drop JPG or PNG pages. This tab builds one PDF at or under 1 MB — a common email and portal cap.",
    metaTitle: "Photo to PDF 1MB – Cherry Converter",
    metaDescription: "Turn photos into a 1MB PDF in your browser. No account, no upload.",
    keywords: ["photo to pdf 1mb", "photo convert to pdf 1mb", "compress photo to pdf 1 mb", "image to 1mb pdf"],
    documentSpecId: "photo-to-pdf-1mb",
    faqs: [
      {
        q: "JPG or already a PDF?",
        a: "Photos become a PDF here. If you already have a PDF, use Compress PDF to 1MB.",
      },
      {
        q: "Need no size cap?",
        a: "Use Image to PDF. Come back when the form also demands 1 MB.",
      },
      {
        q: "Still over 1 MB?",
        a: "Fewer photos, or use Compress PDF to 500KB.",
      },
      {
        q: "Format?",
        a: "Output is .pdf only.",
      },
    ],
    related: ["image-to-pdf", "img-to-pdf", "compress-pdf-to-1mb"],
  }),
];
