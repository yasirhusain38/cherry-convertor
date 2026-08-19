export type ToolCategory =
  | "compress"
  | "resize"
  | "convert"
  | "documents"
  | "edit"
  | "bulk";

export type ToolMode =
  | "compress"
  | "resize"
  | "target-size"
  | "convert"
  | "pdf"
  | "photo"
  | "crop"
  | "dpi"
  | "bg-remove"
  | "signature"
  | "bulk-resize"
  | "bulk-compress"
  | "universal-convert"
  | "enhance";

export type FaqItem = { q: string; a: string };

export type ToolDef = {
  slug: string;
  name: string;
  category: ToolCategory;
  mode: ToolMode;
  kicker: string;
  h1: string;
  lede: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  multiple?: boolean;
  targetBytes?: number;
  outputMime?: "image/jpeg" | "image/png" | "image/webp";
  photoPreset?: string;
  faqs: FaqItem[];
  related: string[];
};

export const CATEGORIES: Array<{
  id: ToolCategory;
  label: string;
  description: string;
}> = [
  {
    id: "compress",
    label: "Compress",
    description: "Shrink file size without leaving this browser.",
  },
  {
    id: "resize",
    label: "Resize",
    description: "Exact pixels, or hit a KB target for Indian forms.",
  },
  {
    id: "convert",
    label: "Convert",
    description: "Search any output format. Images, PDF, ICO, SVG, HTML, JSON.",
  },
  {
    id: "documents",
    label: "Documents",
    description: "Passport, Aadhaar, PAN, visa, exam, and signature specs.",
  },
  {
    id: "edit",
    label: "Edit",
    description: "Crop, DPI, and a basic background cleaner.",
  },
  {
    id: "bulk",
    label: "Bulk",
    description: "Process a whole folder, then download a ZIP.",
  },
];

const sizeFaqs = (kb: string, use: string): FaqItem[] => [
  {
    q: `How do I resize an image to ${kb} for free?`,
    a: `Upload the photo on this page. Cherry Convertor compresses it in your browser until the file is ${kb} or smaller, then you download the result. Nothing is uploaded to a server.`,
  },
  {
    q: `Will the photo stay clear at ${kb}?`,
    a: `We search for the highest JPEG quality that still fits ${kb}. If quality alone is not enough, the engine scales the image slightly and tries again so the file remains usable for ${use}.`,
  },
  {
    q: "Is my photo uploaded?",
    a: "No. Encoding happens with the Canvas API on your device. Close the tab and the image is gone.",
  },
  {
    q: `Which format should I use for ${kb} form uploads?`,
    a: "JPEG is the safest choice for Indian government, exam, and job portals. WebP is smaller but many forms still reject it.",
  },
];

export const TOOLS: ToolDef[] = [
  {
    slug: "compress-image",
    name: "Image Compressor",
    category: "compress",
    mode: "compress",
    kicker: "01  /  Compress",
    h1: "Compress images online without uploading them",
    lede: "Drop a JPEG, PNG, WebP, or HEIC file. Type any target size in KB or MB, or tune quality. Compare before and after. Processing stays on this device.",
    metaTitle: "Image Compressor Online Free – Cherry Convertor",
    metaDescription:
      "Compress JPG, PNG, and WebP images in your browser. See original vs new size, compare before and after, and download instantly. No upload, no login.",
    keywords: ["image compressor", "compress jpg", "reduce image size", "compress png online"],
    faqs: [
      {
        q: "Can I type a custom file size?",
        a: "Yes. Enter 37 KB, 80 KB, 1.5 MB — any number. The encoder binary-searches quality, then scales the image if needed, until the download is at or under that size.",
      },
      {
        q: "How does the image compressor work?",
        a: "Your file is drawn onto an HTML5 canvas and re-encoded at the quality and format you choose. A binary preview updates the download size before you save.",
      },
      {
        q: "Do you upload my photos?",
        a: "No. Cherry Convertor is built so images never leave the browser for this tool. There is no account and no server-side processing.",
      },
      {
        q: "Which formats can I compress?",
        a: "JPEG, PNG, WebP, GIF (first frame), BMP, and HEIC/HEIF via a lightweight in-browser converter.",
      },
      {
        q: "How much can I reduce a photo?",
        a: "Phone photos often drop 60–90% with little visible loss. Use the before/after slider and the size readout to decide.",
      },
    ],
    related: ["resize-image", "resize-image-to-50kb", "bulk-image-compressor", "convert"],
  },
  {
    slug: "convert",
    name: "File Converter",
    category: "convert",
    mode: "universal-convert",
    kicker: "Convert  /  Any format",
    h1: "Convert any file — search every format",
    lede: "Drop a file, search the output format, download. Images, HEIC, SVG, ICO, BMP, and PDF run in your browser. Office, audio, and video are listed so you can see what stays desktop-only.",
    metaTitle: "Convert Any File Online Free – Cherry Convertor",
    metaDescription:
      "Convert images to JPG, PNG, WebP, BMP, ICO, SVG, GIF, AVIF, or PDF in your browser. Searchable format list. No upload, no login.",
    keywords: [
      "file converter",
      "convert image format",
      "jpg to png",
      "heic to jpg",
      "image to pdf",
      "convert any file",
    ],
    faqs: [
      {
        q: "Can I convert any file to any format?",
        a: "Search the full world list. Formats this browser can encode — JPG, PNG, WebP, BMP, GIF, AVIF, ICO, SVG, PDF — convert on your device. Word, Excel, MP4, and similar need a desktop app; we do not upload those files either.",
      },
      {
        q: "How do I find a format?",
        a: "Open Convert to and type. Aliases work: jpeg, jpg, favicon, icon, webp, pdf.",
      },
      {
        q: "Is the file uploaded?",
        a: "No. Detection and encoding stay in this tab.",
      },
    ],
    related: ["jpg-to-pdf", "heic-to-jpg", "png-to-jpg", "jpg-to-webp", "compress-image"],
  },
  {
    slug: "resize-image",
    name: "Image Resizer",
    category: "resize",
    mode: "resize",
    kicker: "02  /  Resize",
    h1: "Resize an image by pixels, percent, or aspect lock",
    lede: "Set exact pixels, or type any file size — 1 KB, 2 MB, 1 GB. The encoder hits that cap in your browser.",
    metaTitle: "Image Resizer Online Free – Cherry Convertor",
    metaDescription:
      "Resize images by exact pixels or percentage in your browser. Lock aspect ratio, preview live, and download JPG, PNG, or WebP. Free, no upload.",
    keywords: ["image resizer", "resize photo online", "change image dimensions"],
    faqs: [
      {
        q: "Can I keep the original aspect ratio?",
        a: "Yes. Aspect lock is on by default. Change width or height and the other side updates automatically.",
      },
      {
        q: "What is the maximum size?",
        a: "You are limited by your device memory, not by a server quota. Very large panoramas may need a desktop browser.",
      },
      {
        q: "Can I type 1 KB, 2 MB, or 1 GB?",
        a: "Yes. Type 1, 2, 3 or 1.5 and pick KB, MB, or GB. You can also type 50kb or 2mb in the box. The file will be at or under that size.",
      },
      {
        q: "Does resizing reduce file size?",
        a: "Pixel resize usually shrinks the file. For a hard cap, type the size you need in the box on this page.",
      },
      {
        q: "Are images uploaded?",
        a: "No. Resize runs locally with the Canvas API.",
      },
    ],
    related: ["compress-image", "bulk-image-resizer", "photo-cropper", "resize-image-to-50kb"],
  },
  {
    slug: "resize-image-to-10kb",
    name: "Resize Image to 10KB",
    category: "resize",
    mode: "target-size",
    kicker: "Target  /  10 KB",
    h1: "Resize an image to 10KB online",
    lede: "Built for strict exam and job portals that reject anything above 10 KB. The encoder hunts for the smallest usable JPEG that still looks like you.",
    metaTitle: "Resize Image to 10KB Online Free – Cherry Convertor",
    metaDescription:
      "Compress any photo to 10KB or less in your browser. Ideal for SSC, railway, and strict Indian form uploads. Free, private, no login.",
    keywords: ["resize image to 10kb", "compress image to 10kb", "photo 10kb"],
    targetBytes: 10 * 1024,
    outputMime: "image/jpeg",
    faqs: sizeFaqs("10KB", "strict exam and recruitment portals"),
    related: ["resize-image-to-20kb", "resize-image-to-30kb", "exam-form-photo-resizer", "compress-image"],
  },
  {
    slug: "resize-image-to-20kb",
    name: "Resize Image to 20KB",
    category: "resize",
    mode: "target-size",
    kicker: "Target  /  20 KB",
    h1: "Resize an image to 20KB online",
    lede: "A common ceiling for SSC, banking, and state exam photo uploads. Drop a file and download a JPEG at or under 20 KB.",
    metaTitle: "Resize Image to 20KB Online Free – Cherry Convertor",
    metaDescription:
      "Resize any image to 20KB free in your browser. Used for SSC, IBPS, and government form photos. No upload, no watermark.",
    keywords: ["resize image to 20kb", "compress photo 20kb", "ssc photo 20kb"],
    targetBytes: 20 * 1024,
    outputMime: "image/jpeg",
    faqs: sizeFaqs("20KB", "SSC, banking, and many government forms"),
    related: ["resize-image-to-10kb", "resize-image-to-50kb", "exam-form-photo-resizer", "aadhaar-photo-resizer"],
  },
  {
    slug: "resize-image-to-30kb",
    name: "Resize Image to 30KB",
    category: "resize",
    mode: "target-size",
    kicker: "Target  /  30 KB",
    h1: "Resize an image to 30KB online",
    lede: "Mid-range form limit. Keeps more facial detail than 10–20 KB tools while still clearing most Indian e-governance caps.",
    metaTitle: "Resize Image to 30KB Online Free – Cherry Convertor",
    metaDescription:
      "Compress a photo to 30KB online, privately in your browser. Useful for university and state government uploads that sit between 20 and 50 KB.",
    keywords: ["resize image to 30kb", "compress image 30kb"],
    targetBytes: 30 * 1024,
    outputMime: "image/jpeg",
    faqs: sizeFaqs("30KB", "university and state government portals"),
    related: ["resize-image-to-20kb", "resize-image-to-50kb", "college-admission-photo-resizer"],
  },
  {
    slug: "resize-image-to-50kb",
    name: "Resize Image to 50KB",
    category: "resize",
    mode: "target-size",
    kicker: "Target  /  50 KB",
    h1: "Resize an image to 50KB online",
    lede: "The most requested Indian form size. Passport portals, Aadhaar-related uploads, PAN, and college applications often stop at 50 KB.",
    metaTitle: "Resize Image to 50KB Online Free – Cherry Convertor",
    metaDescription:
      "Resize any image to 50KB free. Browser-based compression for passport, Aadhaar, PAN, and college forms. See original vs new size instantly.",
    keywords: ["resize image to 50kb", "compress image to 50kb", "photo 50kb online"],
    targetBytes: 50 * 1024,
    outputMime: "image/jpeg",
    faqs: [
      ...sizeFaqs("50KB", "passport, Aadhaar, PAN, and college forms"),
      {
        q: "Is 50KB enough for a passport photo?",
        a: "Yes for most Indian digital uploads. Print-quality 51×51 mm photos are better prepared on the Passport Photo Maker, then compressed here if the portal demands 50 KB.",
      },
    ],
    related: [
      "resize-image-to-20kb",
      "resize-image-to-100kb",
      "passport-photo-resizer",
      "aadhaar-photo-resizer",
      "pan-card-photo-resizer",
    ],
  },
  {
    slug: "resize-image-to-100kb",
    name: "Resize Image to 100KB",
    category: "resize",
    mode: "target-size",
    kicker: "Target  /  100 KB",
    h1: "Resize an image to 100KB online",
    lede: "A gentler cap used by universities, some passport desks, and email attachments. More headroom means cleaner skin tone and text.",
    metaTitle: "Resize Image to 100KB Online Free – Cherry Convertor",
    metaDescription:
      "Compress images to 100KB in your browser. Free tool for university forms, email, and portals that allow a higher quality JPEG.",
    keywords: ["resize image to 100kb", "compress to 100kb"],
    targetBytes: 100 * 1024,
    outputMime: "image/jpeg",
    faqs: sizeFaqs("100KB", "university forms and higher-quality portal uploads"),
    related: ["resize-image-to-50kb", "resize-image-to-200kb", "college-admission-photo-resizer"],
  },
  {
    slug: "resize-image-to-200kb",
    name: "Resize Image to 200KB",
    category: "resize",
    mode: "target-size",
    kicker: "Target  /  200 KB",
    h1: "Resize an image to 200KB online",
    lede: "Good for WhatsApp-alternative shares, HR portals, and documents that still need a small email footprint.",
    metaTitle: "Resize Image to 200KB Online Free – Cherry Convertor",
    metaDescription:
      "Reduce any photo to 200KB online without uploading it. Free JPEG compressor with live size comparison.",
    keywords: ["resize image to 200kb", "compress photo 200kb"],
    targetBytes: 200 * 1024,
    outputMime: "image/jpeg",
    faqs: sizeFaqs("200KB", "HR portals and email attachments"),
    related: ["resize-image-to-100kb", "resize-image-to-500kb", "compress-image"],
  },
  {
    slug: "resize-image-to-500kb",
    name: "Resize Image to 500KB",
    category: "resize",
    mode: "target-size",
    kicker: "Target  /  500 KB",
    h1: "Resize an image to 500KB online",
    lede: "Half a megabyte is plenty for most web and application photos while staying well under typical email limits.",
    metaTitle: "Resize Image to 500KB Online Free – Cherry Convertor",
    metaDescription:
      "Compress an image to 500KB free in your browser. Keep more detail than strict 20–50 KB tools. No upload required.",
    keywords: ["resize image to 500kb", "compress image 500kb"],
    targetBytes: 500 * 1024,
    outputMime: "image/jpeg",
    faqs: sizeFaqs("500KB", "web listings and standard email"),
    related: ["resize-image-to-200kb", "resize-image-to-1mb", "compress-image"],
  },
  {
    slug: "resize-image-to-1mb",
    name: "Resize Image to 1MB",
    category: "resize",
    mode: "target-size",
    kicker: "Target  /  1 MB",
    h1: "Resize an image to 1MB online",
    lede: "Cap a large phone photo at 1 MB for websites, tickets, and portals that allow higher quality uploads.",
    metaTitle: "Resize Image to 1MB Online Free – Cherry Convertor",
    metaDescription:
      "Compress any image to 1MB or less in your browser. Free, private, and built for high-quality web and form uploads.",
    keywords: ["resize image to 1mb", "compress image to 1mb"],
    targetBytes: 1024 * 1024,
    outputMime: "image/jpeg",
    faqs: sizeFaqs("1MB", "high-quality web and ticket uploads"),
    related: ["resize-image-to-500kb", "compress-image", "bulk-image-compressor"],
  },
  {
    slug: "jpg-to-pdf",
    name: "JPG to PDF",
    category: "convert",
    mode: "pdf",
    kicker: "Convert  /  PDF",
    h1: "Convert JPG to PDF in your browser",
    lede: "One photo or a whole set. Each image becomes a page. Files are assembled locally with no server hop.",
    metaTitle: "JPG to PDF Converter Online Free – Cherry Convertor",
    metaDescription:
      "Convert JPG images to PDF free in your browser. Add multiple photos, pick A4 or Letter, and download instantly. Images never leave your device.",
    keywords: ["jpg to pdf", "jpeg to pdf", "photo to pdf"],
    multiple: true,
    faqs: [
      {
        q: "Can I add more than one JPG?",
        a: "Yes. Each image is placed on its own page, fitted to A4 or Letter with a small margin.",
      },
      {
        q: "Is the PDF created on a server?",
        a: "No. jsPDF runs in the browser and the download is generated on your machine.",
      },
      {
        q: "Will quality drop?",
        a: "We embed a high-quality JPEG. For documents that must stay under an email cap, compress the photos first.",
      },
    ],
    related: ["image-to-pdf", "compress-image", "png-to-jpg"],
  },
  {
    slug: "image-to-pdf",
    name: "Image to PDF",
    category: "convert",
    mode: "pdf",
    kicker: "Convert  /  PDF",
    h1: "Convert multiple images to one PDF",
    lede: "JPG, PNG, and WebP in a single document. Reorder is first-in order. Built for scanned pages and mixed photo sets.",
    metaTitle: "Image to PDF Converter Online Free – Cherry Convertor",
    metaDescription:
      "Turn multiple images into a single PDF in your browser. Supports JPG, PNG, and WebP. Free, private, no watermark.",
    keywords: ["image to pdf", "png to pdf", "multiple images to pdf"],
    multiple: true,
    faqs: [
      {
        q: "Which image types can I add?",
        a: "JPEG, PNG, WebP, and HEIC (converted locally first). Mixed batches are fine.",
      },
      {
        q: "Is there a page limit?",
        a: "Only what your browser memory can hold. Hundreds of small scans are usually fine on desktop.",
      },
      {
        q: "Do you store the PDF?",
        a: "No. The file exists only as a download from your browser.",
      },
    ],
    related: ["jpg-to-pdf", "compress-image", "bulk-image-compressor"],
  },
  {
    slug: "jpg-to-png",
    name: "JPG to PNG",
    category: "convert",
    mode: "convert",
    kicker: "Convert  /  PNG",
    h1: "Convert JPG to PNG online",
    lede: "Lossless PNG output with optional transparency fill. Useful when you need a format that editors and printers accept everywhere.",
    metaTitle: "JPG to PNG Converter Online Free – Cherry Convertor",
    metaDescription:
      "Convert JPG to PNG in your browser. Free, no upload, instant download. Keep full resolution while changing format.",
    keywords: ["jpg to png", "jpeg to png converter"],
    outputMime: "image/png",
    faqs: [
      {
        q: "Will PNG be larger than JPG?",
        a: "Usually yes. PNG is lossless. Use it when you need crisp edges or a next step in an editor.",
      },
      {
        q: "Is the conversion private?",
        a: "Yes. The canvas export never leaves this tab.",
      },
    ],
    related: ["png-to-jpg", "jpg-to-webp", "compress-image"],
  },
  {
    slug: "png-to-jpg",
    name: "PNG to JPG",
    category: "convert",
    mode: "convert",
    kicker: "Convert  /  JPG",
    h1: "Convert PNG to JPG online",
    lede: "Flatten transparency onto white (or a colour you pick) and export a smaller JPEG for forms and email.",
    metaTitle: "PNG to JPG Converter Online Free – Cherry Convertor",
    metaDescription:
      "Convert PNG to JPG free in your browser. Flatten transparency, choose quality, and download a smaller photo. No upload.",
    keywords: ["png to jpg", "png to jpeg", "convert png"],
    outputMime: "image/jpeg",
    faqs: [
      {
        q: "What happens to transparent areas?",
        a: "They are filled with white by default. You can pick another background colour before download.",
      },
      {
        q: "Can I keep high quality?",
        a: "Yes. Quality defaults to 0.92 — visually lossless for most photos.",
      },
    ],
    related: ["jpg-to-png", "compress-image", "resize-image-to-50kb"],
  },
  {
    slug: "jpg-to-webp",
    name: "JPG to WebP",
    category: "convert",
    mode: "convert",
    kicker: "Convert  /  WebP",
    h1: "Convert JPG to WebP online",
    lede: "WebP is the modern web default. Same photo, often 25–40% smaller than JPEG at a matched quality.",
    metaTitle: "JPG to WebP Converter Online Free – Cherry Convertor",
    metaDescription:
      "Convert JPG to WebP in your browser. Smaller files for websites, still processed locally. Free and private.",
    keywords: ["jpg to webp", "jpeg to webp"],
    outputMime: "image/webp",
    faqs: [
      {
        q: "Do all browsers support WebP?",
        a: "Yes for current Chrome, Edge, Firefox, and Safari. Some Indian government forms still want JPEG instead.",
      },
      {
        q: "Is this done on a server?",
        a: "No. Canvas toBlob('image/webp') runs locally.",
      },
    ],
    related: ["webp-to-jpg", "compress-image", "jpg-to-png"],
  },
  {
    slug: "webp-to-jpg",
    name: "WebP to JPG",
    category: "convert",
    mode: "convert",
    kicker: "Convert  /  JPG",
    h1: "Convert WebP to JPG online",
    lede: "Open a WebP from WhatsApp or a modern camera and save a JPEG that older portals will accept.",
    metaTitle: "WebP to JPG Converter Online Free – Cherry Convertor",
    metaDescription:
      "Convert WebP to JPG free in your browser. Make WhatsApp and modern camera photos compatible with Indian forms.",
    keywords: ["webp to jpg", "webp to jpeg"],
    outputMime: "image/jpeg",
    faqs: [
      {
        q: "Why convert WebP at all?",
        a: "Many Indian exam, visa, and HR sites still only accept .jpg. This tool gives them a compatible file.",
      },
      {
        q: "Do you keep the original resolution?",
        a: "Yes, unless you also turn on a max dimension.",
      },
    ],
    related: ["jpg-to-webp", "heic-to-jpg", "resize-image-to-50kb"],
  },
  {
    slug: "heic-to-jpg",
    name: "HEIC to JPG",
    category: "convert",
    mode: "convert",
    kicker: "Convert  /  HEIC",
    h1: "Convert HEIC to JPG in the browser",
    lede: "iPhone photos arrive as HEIC. We decode them locally with a lightweight library, then export a JPEG any form will take.",
    metaTitle: "HEIC to JPG Converter Online Free – Cherry Convertor",
    metaDescription:
      "Convert iPhone HEIC photos to JPG in your browser. No upload. Download a standard JPEG for email, WhatsApp, and Indian forms.",
    keywords: ["heic to jpg", "heic to jpeg", "iphone heic converter"],
    outputMime: "image/jpeg",
    faqs: [
      {
        q: "What library do you use?",
        a: "heic2any (libheif) runs in the browser. The HEIC file is not sent to Cherry Convertor servers.",
      },
      {
        q: "Can I convert several HEIC files?",
        a: "Yes — use Bulk Image Compressor or convert them one by one here. A dedicated bulk HEIC queue is on the roadmap.",
      },
      {
        q: "Will live photos / bursts work?",
        a: "The first still frame is converted. Video tracks inside a Live Photo are ignored.",
      },
    ],
    related: ["webp-to-jpg", "compress-image", "jpg-to-pdf"],
  },
  {
    slug: "passport-photo-maker",
    name: "Passport Photo Maker",
    category: "documents",
    mode: "photo",
    kicker: "Documents  /  Passport",
    h1: "Passport photo maker for India and international sizes",
    lede: "Crop to official aspect, set a white background, export the exact millimetre size, and optionally print a sheet of copies.",
    metaTitle: "Passport Photo Maker Online Free – Cherry Convertor",
    metaDescription:
      "Make India, US, UK, and Schengen passport photos in your browser. Crop, white background, exact mm size, and a printable sheet. No upload.",
    keywords: ["passport photo maker", "passport size photo online", "india passport photo"],
    photoPreset: "in-passport",
    faqs: [
      {
        q: "What size is an Indian passport photo?",
        a: "51×51 mm (2×2 inch). At 300 DPI that is 600×600 pixels. White background, recent colour photo, face clearly visible.",
      },
      {
        q: "Can I print multiple copies?",
        a: "Yes. Download a 4×6 or A4 sheet with repeated copies for a local studio printer.",
      },
      {
        q: "Is this an official government tool?",
        a: "No. It follows published size guides. Always re-check the latest Passport Seva or embassy instructions before you apply.",
      },
    ],
    related: ["passport-photo-resizer", "visa-photo-resizer", "resize-image-to-50kb", "photo-cropper"],
  },
  {
    slug: "passport-photo-resizer",
    name: "Passport Photo Resizer",
    category: "documents",
    mode: "photo",
    kicker: "Documents  /  Passport",
    h1: "Resize a photo to passport size",
    lede: "Already cropped? Drop it here to hit 51×51 mm (India) or another official size, then compress for the upload portal.",
    metaTitle: "Passport Photo Resizer Online Free – Cherry Convertor",
    metaDescription:
      "Resize any photo to Indian or international passport size in your browser. Exact millimetres, optional 20–50 KB export.",
    keywords: ["passport photo resizer", "passport size photo 51x51", "resize passport photo"],
    photoPreset: "in-passport",
    faqs: [
      {
        q: "What pixels equal an Indian passport photo?",
        a: "600×600 px at 300 DPI, or 413×413 at 200 DPI. We default to 300 DPI for print-safe output.",
      },
      {
        q: "Can I also hit 50 KB?",
        a: "Yes. After sizing, switch on the 50 KB target or open the dedicated 50 KB tool.",
      },
    ],
    related: ["passport-photo-maker", "resize-image-to-50kb", "visa-photo-resizer"],
  },
  {
    slug: "aadhaar-photo-resizer",
    name: "Aadhaar Photo Resizer",
    category: "documents",
    mode: "photo",
    kicker: "Documents  /  Aadhaar",
    h1: "Aadhaar photo resizer — 3.5 × 4.5 cm",
    lede: "UIDAI-style portrait: 35×45 mm, white background, typically 20–50 KB JPEG. Crop and export without uploading.",
    metaTitle: "Aadhaar Photo Resizer Online Free – Cherry Convertor",
    metaDescription:
      "Resize a photo for Aadhaar / UIDAI: 3.5×4.5 cm, white background, 20–50 KB. Processed in your browser. Free.",
    keywords: ["aadhaar photo resizer", "aadhaar photo size", "uidai photo 50kb"],
    photoPreset: "in-aadhaar",
    faqs: [
      {
        q: "What is the Aadhaar photograph size?",
        a: "4.5 cm height × 3.5 cm width. White background. Digital copies are usually JPEG between 20 and 50 KB.",
      },
      {
        q: "Do you send photos to UIDAI?",
        a: "No. This is an independent browser tool. You download the file and upload it yourself on the official portal.",
      },
    ],
    related: ["pan-card-photo-resizer", "resize-image-to-50kb", "government-form-photo-resizer"],
  },
  {
    slug: "pan-card-photo-resizer",
    name: "PAN Card Photo Resizer",
    category: "documents",
    mode: "photo",
    kicker: "Documents  /  PAN",
    h1: "PAN card photo resizer — 2.5 × 3.5 cm",
    lede: "NSDL / Protean style portrait with a white field. Export a small JPEG that clears the 20–50 KB window.",
    metaTitle: "PAN Card Photo Resizer Online Free – Cherry Convertor",
    metaDescription:
      "Resize a photo for PAN card e-KYC: 2.5×3.5 cm, white background, under 50 KB. Runs locally in your browser.",
    keywords: ["pan card photo resizer", "pan photo size", "pan card photo 50kb"],
    photoPreset: "in-pan",
    faqs: [
      {
        q: "What size photo does PAN need?",
        a: "3.5 cm height × 2.5 cm width, colour, white background. File size is typically 20–50 KB JPEG.",
      },
      {
        q: "Can I resize the signature too?",
        a: "Yes — open the Signature Resizer. PAN forms usually want a 6×2 cm or similar scan.",
      },
    ],
    related: ["aadhaar-photo-resizer", "signature-resizer", "resize-image-to-50kb"],
  },
  {
    slug: "signature-resizer",
    name: "Signature Resizer",
    category: "documents",
    mode: "signature",
    kicker: "Documents  /  Signature",
    h1: "Signature resizer and size reducer",
    lede: "Crop a pen scan, convert it to clean black ink, and hit 10–20 KB for PAN, exam, and banking forms.",
    metaTitle: "Signature Resizer / Signature Size Reducer Free – Cherry Convertor",
    metaDescription:
      "Resize and compress a signature to 10–20 KB. Crop, ink cleanup, and exact centimetre sizes. Processed in your browser.",
    keywords: ["signature resizer", "signature size reducer", "signature 20kb", "pan signature"],
    faqs: [
      {
        q: "What size should a form signature be?",
        a: "A common Indian spec is 6 cm × 2 cm, black on white, 10–20 KB JPEG or JPG. Always match the form you are filling.",
      },
      {
        q: "Can you remove the paper background?",
        a: "The ink cleanup turns pale paper to white and darkens the pen stroke. For a transparent PNG, use the background remover after.",
      },
    ],
    related: ["pan-card-photo-resizer", "resize-image-to-20kb", "photo-cropper"],
  },
  {
    slug: "visa-photo-resizer",
    name: "Visa Photo Resizer",
    category: "documents",
    mode: "photo",
    kicker: "Documents  /  Visa",
    h1: "Visa photo resizer — India, US, UK, Schengen",
    lede: "Switch presets for the embassy you are applying to. Crop, white background, exact millimetres.",
    metaTitle: "Visa Photo Resizer Online Free – Cherry Convertor",
    metaDescription:
      "Resize visa photos for India, US, UK, and Schengen sizes in your browser. Exact mm output, white background, free.",
    keywords: ["visa photo resizer", "india visa photo", "schengen photo size"],
    photoPreset: "in-visa",
    faqs: [
      {
        q: "What size is an Indian visa photo?",
        a: "Usually 51×51 mm with a white background — the same square as an Indian passport photo.",
      },
      {
        q: "What about Schengen / UK?",
        a: "35×45 mm. Switch the preset before you crop.",
      },
    ],
    related: ["passport-photo-maker", "passport-photo-resizer", "resize-image-to-50kb"],
  },
  {
    slug: "exam-form-photo-resizer",
    name: "Exam Form Photo Resizer",
    category: "documents",
    mode: "photo",
    kicker: "Documents  /  Exam",
    h1: "Exam form photo resizer (SSC, UPSC, NEET, JEE)",
    lede: "Stamp-size 3.5×4.5 cm with a hard 10–100 KB ceiling. Built for the portals that reject anything else.",
    metaTitle: "Exam Form Photo Resizer Online Free – Cherry Convertor",
    metaDescription:
      "Resize exam form photos for SSC, UPSC, NEET, and JEE. 3.5×4.5 cm and 10–50 KB JPEG, processed in your browser.",
    keywords: ["exam form photo", "ssc photo resizer", "neet photo size", "upsc photo 20kb"],
    photoPreset: "in-exam",
    faqs: [
      {
        q: "What photo do SSC and UPSC want?",
        a: "Typically 3.5×4.5 cm, JPEG, often 20 KB or 50 KB max. Some notifications still say 4–100 KB. Check that year’s brochure.",
      },
      {
        q: "Should I use 10KB or 20KB?",
        a: "If the form says 20 KB, use the 20 KB tool after sizing. If it says 4–12 KB, use 10 KB.",
      },
    ],
    related: ["resize-image-to-20kb", "resize-image-to-10kb", "signature-resizer", "college-admission-photo-resizer"],
  },
  {
    slug: "college-admission-photo-resizer",
    name: "College Admission Photo Resizer",
    category: "documents",
    mode: "photo",
    kicker: "Documents  /  College",
    h1: "College admission photo resizer",
    lede: "Standard Indian application portrait — 3.5×4.5 cm, 10–50 KB, white background. Ready for university portals.",
    metaTitle: "College Admission Photo Resizer Online Free – Cherry Convertor",
    metaDescription:
      "Resize a photo for Indian college and university applications. 3.5×4.5 cm, 10–50 KB, browser-based and free.",
    keywords: ["college admission photo", "university photo resizer", "admission photo 50kb"],
    photoPreset: "in-college",
    faqs: [
      {
        q: "What size do Indian colleges ask for?",
        a: "Most still want a 3.5×4.5 cm colour photograph under 50 KB. A few engineering portals allow 100 KB.",
      },
    ],
    related: ["exam-form-photo-resizer", "resize-image-to-50kb", "resize-image-to-100kb"],
  },
  {
    slug: "government-form-photo-resizer",
    name: "Government Form Photo Resizer",
    category: "documents",
    mode: "photo",
    kicker: "Documents  /  Government",
    h1: "Government form photo resizer",
    lede: "A generic 3.5×4.5 cm, 20–50 KB export that clears the majority of Indian e-governance photo fields.",
    metaTitle: "Government Form Photo Resizer Online Free – Cherry Convertor",
    metaDescription:
      "Resize photos for Indian government forms: 3.5×4.5 cm, 20–50 KB JPEG. Private browser processing, no login.",
    keywords: ["government form photo", "e governance photo size", "india form photo 50kb"],
    photoPreset: "in-govt",
    faqs: [
      {
        q: "Will this work for every Indian form?",
        a: "It matches the most common spec. Always read the notification — a few departments still want 2×2 inch squares.",
      },
    ],
    related: ["aadhaar-photo-resizer", "pan-card-photo-resizer", "resize-image-to-50kb"],
  },
  {
    slug: "image-dpi-changer",
    name: "Image DPI Changer",
    category: "edit",
    mode: "dpi",
    kicker: "Edit  /  DPI",
    h1: "Change image DPI (72, 150, 300)",
    lede: "Rewrite JPEG / PNG density metadata, or resample so a print size holds at the new DPI. No server, no install.",
    metaTitle: "Image DPI Changer Online Free – Cherry Convertor",
    metaDescription:
      "Change image DPI to 72, 150, or 300 in your browser. Update metadata or resample for print. Free and private.",
    keywords: ["dpi changer", "change image dpi", "300 dpi converter"],
    faqs: [
      {
        q: "Does changing DPI change how the photo looks on screen?",
        a: "Metadata-only mode does not change pixels. Resample mode changes pixel count so the printed centimetres stay the same at the new DPI.",
      },
      {
        q: "Which DPI do Indian forms want?",
        a: "200 or 300 DPI is typical for passport and Aadhaar prints. Screens are 72 or 96.",
      },
    ],
    related: ["passport-photo-maker", "resize-image", "compress-image"],
  },
  {
    slug: "bulk-image-resizer",
    name: "Bulk Image Resizer",
    category: "bulk",
    mode: "bulk-resize",
    kicker: "Bulk  /  Resize",
    h1: "Bulk image resizer — many files at once",
    lede: "Drop a folder of photos, set one width, and download a ZIP. Everything is resized locally.",
    metaTitle: "Bulk Image Resizer Online Free – Cherry Convertor",
    metaDescription:
      "Resize multiple images at once in your browser. Set max width, keep aspect ratio, download a ZIP. No upload.",
    keywords: ["bulk image resizer", "resize multiple images", "batch resize photos"],
    multiple: true,
    faqs: [
      {
        q: "How many images can I resize?",
        a: "Dozens on a phone, hundreds on a laptop. You are bound by device memory, not a server quota.",
      },
      {
        q: "Do you keep EXIF?",
        a: "Canvas export strips most EXIF. That is usually what you want before sharing.",
      },
    ],
    related: ["bulk-image-compressor", "resize-image", "image-to-pdf"],
  },
  {
    slug: "bulk-image-compressor",
    name: "Bulk Image Compressor",
    category: "bulk",
    mode: "bulk-compress",
    kicker: "Bulk  /  Compress",
    h1: "Bulk image compressor — ZIP download",
    lede: "One quality setting, many files, one ZIP. Built for clearing a camera roll before a form deadline.",
    metaTitle: "Bulk Image Compressor Online Free – Cherry Convertor",
    metaDescription:
      "Compress multiple images at once in your browser and download a ZIP. Free, private, no account.",
    keywords: ["bulk image compressor", "compress multiple images", "batch compress jpg"],
    multiple: true,
    faqs: [
      {
        q: "Can I target 50 KB for every file?",
        a: "This page uses a shared quality. For a hard 50 KB cap on one portrait, use Resize Image to 50KB.",
      },
    ],
    related: ["bulk-image-resizer", "compress-image", "resize-image-to-50kb"],
  },
  {
    slug: "rotate-image",
    name: "Rotate Image",
    category: "edit",
    mode: "enhance",
    kicker: "Edit  /  Rotate",
    h1: "Rotate an image 90°, 180°, or 270°",
    lede: "Spin a photo in the browser, then search any output format — JPG, PNG, WebP, PDF, ICO, SVG, and more.",
    metaTitle: "Rotate Image Online Free – Cherry Convertor",
    metaDescription:
      "Rotate JPG, PNG, and HEIC photos 90, 180, or 270 degrees in your browser. Export any supported format. No upload.",
    keywords: ["rotate image", "rotate photo 90 degrees", "rotate jpg online"],
    faqs: [
      {
        q: "Does rotate reduce quality?",
        a: "90° steps keep every pixel. Export as PNG if you want a lossless file.",
      },
    ],
    related: ["flip-image", "photo-cropper", "convert"],
  },
  {
    slug: "flip-image",
    name: "Flip Image",
    category: "edit",
    mode: "enhance",
    kicker: "Edit  /  Flip",
    h1: "Flip an image horizontally or vertically",
    lede: "Mirror a selfie or flip a scan. Then download in any searchable format.",
    metaTitle: "Flip Image Online Free – Cherry Convertor",
    metaDescription:
      "Flip photos horizontally or vertically in your browser. Export JPG, PNG, WebP, PDF, and more. Private, no upload.",
    keywords: ["flip image", "mirror photo", "flip horizontal online"],
    faqs: [
      {
        q: "Is this a mirror or a rotate?",
        a: "Flip H is a left-right mirror. Flip V is upside-down without rotating.",
      },
    ],
    related: ["rotate-image", "photo-cropper", "compress-image"],
  },
  {
    slug: "black-and-white",
    name: "Black and White",
    category: "edit",
    mode: "enhance",
    kicker: "Edit  /  B&W",
    h1: "Convert a photo to black and white",
    lede: "One-click grayscale plus brightness and contrast. Search the output format you need.",
    metaTitle: "Black and White Photo Converter Free – Cherry Convertor",
    metaDescription:
      "Turn any photo black and white in your browser. Adjust contrast, export any format. No upload.",
    keywords: ["black and white converter", "grayscale photo", "photo to bw"],
    faqs: [
      {
        q: "Can I keep colour in one area?",
        a: "Not on this page. Use invert and contrast for graphic looks, or crop first.",
      },
    ],
    related: ["photo-cropper", "compress-image", "convert"],
  },
  {
    slug: "add-watermark",
    name: "Add Watermark",
    category: "edit",
    mode: "enhance",
    kicker: "Edit  /  Watermark",
    h1: "Add a text watermark to a photo",
    lede: "Stamp a name or URL on the corner, then download JPG, PNG, PDF, or any searchable format.",
    metaTitle: "Add Watermark to Image Online Free – Cherry Convertor",
    metaDescription:
      "Add a text watermark in your browser. Private, no upload. Export JPG, PNG, WebP, PDF, and more.",
    keywords: ["add watermark", "watermark photo online", "text watermark"],
    faqs: [
      {
        q: "What do I type?",
        a: "The exact line you want on the photo: a name, © year, website, or “Confidential”. Nothing is stamped until that box has text.",
      },
      {
        q: "Where does it appear?",
        a: "Pick a corner, the centre, or “Repeat across the whole photo”. Size, opacity, and colour are under that grid.",
      },
      {
        q: "Is the watermark baked in?",
        a: "Yes. It is drawn onto the pixels before download. We do not store a copy.",
      },
    ],
    related: ["compress-image", "convert", "bulk-image-compressor"],
  },
  {
    slug: "image-to-base64",
    name: "Image to Base64",
    category: "convert",
    mode: "enhance",
    kicker: "Convert  /  Base64",
    h1: "Image to Base64, JSON, HTML, or Markdown",
    lede: "Search TXT, JSON, HTML, or MD in the format picker. The file never leaves this tab.",
    metaTitle: "Image to Base64 Converter Online Free – Cherry Convertor",
    metaDescription:
      "Convert an image to Base64, JSON, HTML, or Markdown in your browser. Free and private.",
    keywords: ["image to base64", "image to json", "data url converter"],
    faqs: [
      {
        q: "Which format should I pick?",
        a: "TXT for a raw data URL, JSON for apps, HTML for a one-file preview, Markdown for docs.",
      },
    ],
    related: ["convert", "png-to-jpg", "compress-image"],
  },
  {
    slug: "photo-cropper",
    name: "Photo Cropper",
    category: "edit",
    mode: "crop",
    kicker: "Edit  /  Crop",
    h1: "Crop a photo online — free, no upload",
    lede: "Drag the frame, lock an aspect (1:1, 3:4, 2:3, free), and export JPEG, PNG, or WebP.",
    metaTitle: "Photo Cropper Online Free – Cherry Convertor",
    metaDescription:
      "Crop photos in your browser with aspect-ratio locks. Free, private, instant download. No account.",
    keywords: ["photo cropper", "crop image online", "crop photo 1:1"],
    faqs: [
      {
        q: "Can I crop to passport aspect?",
        a: "Use 1:1 for Indian/US passport squares, or open the Passport Photo Maker for millimetre-accurate export.",
      },
    ],
    related: ["passport-photo-maker", "resize-image", "background-remover"],
  },
  {
    slug: "background-remover",
    name: "Background Remover",
    category: "edit",
    mode: "bg-remove",
    kicker: "Edit  /  Background",
    h1: "Background remover — basic, on-device",
    lede: "A corner-sampled chroma key. Best on studio-style portraits with a flat wall. An AI model can be added later without changing this page’s privacy promise.",
    metaTitle: "Background Remover Online Free – Cherry Convertor",
    metaDescription:
      "Remove a flat photo background in your browser. Basic chroma-key tool — private, no upload. AI version can be added later.",
    keywords: ["background remover", "remove photo background", "transparent background"],
    faqs: [
      {
        q: "Is this AI background removal?",
        a: "Not yet. This version samples the corners and fades similar pixels. It works well on white or coloured studio walls. A WASM AI model can be layered on later and would still run locally.",
      },
      {
        q: "What format do I download?",
        a: "PNG with transparency, so you can drop the subject onto a passport-white field afterwards.",
      },
    ],
    related: ["passport-photo-maker", "photo-cropper", "png-to-jpg"],
  },
];

const bySlug = new Map(TOOLS.map((tool) => [tool.slug, tool]));

export function getTool(slug: string): ToolDef | undefined {
  return bySlug.get(slug);
}

export function getToolsByCategory(category: ToolCategory): ToolDef[] {
  return TOOLS.filter((tool) => tool.category === category);
}

export function getRelated(slugs: string[]): ToolDef[] {
  return slugs.map((slug) => bySlug.get(slug)).filter((tool): tool is ToolDef => Boolean(tool));
}

export function popularTools(): ToolDef[] {
  const slugs = [
    "compress-image",
    "resize-image-to-50kb",
    "resize-image-to-20kb",
    "passport-photo-maker",
    "aadhaar-photo-resizer",
    "convert",
    "rotate-image",
    "add-watermark",
    "jpg-to-pdf",
    "heic-to-jpg",
    "signature-resizer",
    "png-to-jpg",
    "photo-cropper",
    "pan-card-photo-resizer",
    "resize-image",
  ];
  return getRelated(slugs);
}
