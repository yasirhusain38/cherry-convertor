export type LandingCopy = {
  howTo: [string, string, string];
  sections: Array<{ h2: string; p: string }>;
};

export const TOOL_LANDING_COPY: Record<string, LandingCopy> = {
  "bangladesh-nid-photo": {
    howTo: [
      "Drop a recent colour portrait. The file stays in this tab.",
      "Keep 300×300 px and the 50 KB cap unless your circular names other numbers.",
      "Download the JPEG and upload it on the NID / e-service form yourself.",
    ],
    sections: [
      {
        h2: "What this page is for",
        p: "Bangladesh NID and many voter / e-service uploads want a small square colour JPEG, not a 35×45 mm passport print. This workspace defaults to 300×300 pixels and a 50 KB cap with a white field. That matches the size people type when they search NID photo. It is a typical portal window, not a gazette. If your circular names 200×200, 40 KB, or a photocopy of the card, switch the cap or open the NID photocopy editor. Cherry Converter does not talk to NID, EC, or any ministry. You download a file and submit it on the official form. Last checked: September 2026.",
      },
      {
        h2: "Portrait vs photocopy",
        p: "Enrolment-style portraits are a face on white, ears visible, no heavy shadow. A photocopy is a scan of the plastic card — different crop, often 100–200 KB. Mixing them is a common reject: a photo of the printed NID is treated as a scan of a scan. Shoot a new portrait in even light, or use the photocopy tool for the card itself. This page will not print a NID, fill in a number, or generate a voter card. If a form asks for both a portrait and a card scan, run them as two files.",
      },
      {
        h2: "Why portals reject the file",
        p: "The file is over 50 KB. The image is not square. The background is grey studio paper. Ears or chin are cropped. There is glare on glasses. The JPEG is a picture of a printed photo. Black-and-white when the form wants colour. After you crop here, leave the KB cap on. If a QR on a photocopy must stay sharp, raise the cap only if the form allows it. Confirm millimetres and KB on the current circular — windows move. PNG and HEIC often fail even when the pixels are right; export JPEG.",
      },
      {
        h2: "How to shoot the portrait",
        p: "Face the camera. Even window light or a shaded outdoor wall beats a ceiling bulb. Keep the camera at eye height. Leave space around the head so ears and a little shoulder stay in frame after the square crop. Neutral expression. No heavy beauty filter. If the circular allows a head covering, the face from chin to forehead must stay visible. Glasses: take them off if the form forbids them; if they are allowed, kill the reflection. Infants: use infant crop so the face is smaller and there is space above the head — then confirm that circular. After download, check the file size in your phone’s Files app before you open the NID form.",
      },
      {
        h2: "On this device",
        p: "Canvas does the crop and JPEG encode in this browser tab. Closing the tab clears the portrait. There is no account and no watermark on the download. Last checked: September 2026. Not a government website. Chrome on Android and desktop is the most reliable for auto face crop; if FaceDetector is missing, drag zoom yourself and use the live pass/fail list.",
      },
      {
        h2: "NID vs passport vs licence",
        p: "Passport and BRTA licence portraits are 35×45 mm, not the NID square. Do not reuse a Schengen or Indian 51×51 crop here — the aspect is wrong and the portal will reject it even at 50 KB. A photocopy of the card is a different tool. Compress PDF if the portal wants a scan of documents, not a face JPEG. Search the preset list for Bangladesh if you landed on the generic ID maker by mistake. Bangla: অনেক পোর্টাল ছোট স্কয়ার JPEG চায়। এই পেজ ৩০০×৩০০, সাধারণত ৫০ KB। সার্কুলার দেখে নিশ্চিত করুন।",
      },
      {
        h2: "After you download",
        p: "Open the JPEG. Confirm it is square, colour, and under the cap your form names. If the live checks here show Fail on pixels or file size, recrop before you leave. Upload on the official NID / e-service site yourself. If that site later names 200×200 or 40 KB, type the new cap in this workspace or switch preset — we will not invent a second Bangladesh NID URL for every circular. Last checked: September 2026.",
      },
    ],
  },
  "compress-pdf-to-2mb": {
    howTo: [
      "Drop a PDF or photos of pages, in order.",
      "Leave the cap at 2 MB unless the form names 1 MB or 500 KB.",
      "Download the new PDF from this tab. Nothing is uploaded.",
    ],
    sections: [
      {
        h2: "What “compress PDF to 2MB” means here",
        p: "Visa desks, universities, and bank KYC forms often reject a single attachment over 2 MB. This page locks the default cap at 2,097,152 bytes. If the PDF already fits, pages are copied and selectable text is kept. If it is still over, pages are rebuilt as JPEG so the download hits the cap — then search inside the PDF stops. Keep the original if you still need to copy. Phone scans of a passbook or marksheet shrink well. Last checked: September 2026. Confirm the cap on the form. Not a government website.",
      },
      {
        h2: "Scanned vs born-digital",
        p: "A scan is already a picture. This compressor lowers JPEG quality, then shrinks page pixels if the file is still over. A Word-exported PDF is rasterized the same way, so search inside the PDF stops working. That is the trade for a portal that only checks bytes. If the checklist says “less than 2MB”, use PDF under 2MB — some validators fail at exactly 2.00 MB. Do not zip the PDF unless the form accepts ZIP. Output is .pdf only. Input can be PDF or JPG/PNG/HEIC photos of pages.",
      },
      {
        h2: "How the encoder tries",
        p: "Drop the file. If it is already a PDF under 2 MB, we copy the pages and you keep selectable text. If it is over, pages are rasterized in this tab. The encoder tries a high JPEG quality first, then steps down, then shrinks page pixels. Tick “Rebuild as JPEG pages” only when you must force the cap on a born-digital file. Family packs belong on the family document pack page. Nothing is uploaded. Close the tab and the pages are gone.",
      },
      {
        h2: "Still over 2 MB",
        p: "The engine retries quality, then scales pages. If it still misses, drop fewer pages. A 60-page colour bank book will not look like a studio scan at 2 MB — split by month or upload two files if the checklist allows. Do not add junk pages or screenshots of a PDF viewer. If names on a certificate go soft, use a tighter crop of that page only, or the 1 MB page only when the form is actually 1 MB. Last checked: September 2026.",
      },
      {
        h2: "Related caps",
        p: "1 MB is common on email and some visa lists. 500 KB shows up on KYC. Character certificates, caste, GST, Form 16, and passbook scans often sit at 500 KB — use those intent pages so the FAQ matches the document. Processing stays in this tab. No account. No watermark on the file. “Increase PDF to 2MB” is not a product: if the file is already under 2 MB, the download stays at the real size. We do not pad bytes.",
      },
      {
        h2: "What this is not",
        p: "It is not a server OCR of a government PDF. It is not a searchable-text optimiser. It does not upload the file. It does not add a watermark. It does not issue a visa, a cancelled cheque, or a degree. If you need a 1 KB PDF or a fake cancelled cheque, that is not a product we will ship. Confirm millimetres, page count, and KB on the current circular. Last checked: September 2026.",
      },
    ],
  },
  "uae-labour-card-photo": {
    howTo: [
      "Drop a recent colour portrait, even light, white wall if you can.",
      "Keep 35×45 mm and the 100 KB cap unless MOHRE names other numbers.",
      "Download the JPEG and upload it on the labour / work-permit form.",
    ],
    sections: [
      {
        h2: "Labour card vs Emirates ID",
        p: "MOHRE labour / work-permit portraits are usually 35×45 mm colour JPEGs with a white field. Many portals cap the file at 100 KB. Emirates ID uses the same millimetres. This page is worded for the labour card. Switch the preset if you are filing ICP / Emirates ID instead. Confirm the current form — KB windows move. Cherry Converter does not submit to MOHRE, ICP, or Tasheel. You download a JPEG and upload it on the official form yourself. Last checked: September 2026. Not a government website.",
      },
      {
        h2: "Why the upload fails",
        p: "File over 100 KB. Grey studio background. A US 2×2 square. Cropped ears. Glasses glare. A scan of a printed visa photo. Recrop here, leave the cap on, and export JPEG. PNG and HEIC often fail even at the right millimetres. A selfie with a busy room behind you will fail the background corners check. Use a plain wall, then the live pass/fail list on this page. Arabic: غالباً 35×45 مم، خلفية بيضاء، وحدّ 100 كيلوبايت. أكّد الرقم على النموذج.",
      },
      {
        h2: "How to shoot it",
        p: "Stand a metre from a white or off-white wall. Window light from the front, not a ceiling downlight. Camera at eye height. Neutral expression, mouth closed, both ears visible if the circular asks for that. No heavy filter. Head covering: only if the form allows it, and the face from chin to forehead must stay clear. Infants: use infant crop for more space above the head, then confirm MOHRE’s current infant note — we do not invent millimetres. After download, check KB in Files before you open the labour form.",
      },
      {
        h2: "Labour vs visa vs licence",
        p: "UAE visa photos are also 35×45 on many lists, but the file cap and background wording can differ. Driving-licence portraits may share millimetres and still want a different KB window. Do not reuse an Indian 51×51 or US 2×2 crop. Search the preset list for UAE if you landed on the generic ID maker. This page will not print a labour card or fill a labour file number.",
      },
      {
        h2: "On this device",
        p: "Crop and encode run in this browser. Close the tab and the portrait is gone. No account. No watermark. Chrome is the most reliable for auto face crop. Last checked: September 2026. Confirm millimetres and KB on the current MOHRE or PRO form. Not Absher, not ICP, not a typing centre.",
      },
      {
        h2: "After you download",
        p: "Open the JPEG. Confirm 35×45 aspect, white corners, and a file at or under the cap your form names. If live checks show Fail, recrop before you leave. Upload on the official labour / work-permit site yourself. If that site later names 50 KB or 200 KB, type the new cap here — we will not clone a second labour-card URL for every circular. Last checked: September 2026.",
      },
    ],
  },
  "resize-image-to-20kb": {
    howTo: [
      "Drop a JPEG or a phone photo.",
      "Leave the target at 20 KB. The encoder searches quality, then scale.",
      "Download the JPEG. If the form says 10 KB, open that page instead.",
    ],
    sections: [
      {
        h2: "20 KB photo size",
        p: "SSC, banking, and many state exam portals reject a JPEG over 20 KB. This page locks that cap. We do not pad a tiny file up to 20 KB — portals read the real byte count. If the photo is already under 20 KB, the download stays at the real size. For print DPI, use the DPI tool; that is a different job. Last checked: September 2026. Confirm the notification. Not a government website.",
      },
      {
        h2: "Pixels vs kilobytes",
        p: "IBPS, SBI, and similar bank forms often want a face crop around 200×230 pixels and then a 20 KB (sometimes 50 KB) file. A 35×45 mm passport JPEG squeezed to 20 KB is the wrong crop even if the bytes match. Recrop on the exam or IBPS page first, then hit 20 KB here if the notification still names that cap. SSC and many state boards care about the byte cap more than millimetres — still confirm both. Signature uploads are often 10–20 KB and a different aspect; use the signature tools, not this page.",
      },
      {
        h2: "Why it still fails",
        p: "The form wanted 10 KB. The portal wants 200×230 pixels, not a 35×45 crop. The JPEG is a screenshot of a WhatsApp chat. The file is PNG. Recrop, leave JPEG on, and download again. If the live size is 20.1 KB, the encoder missed — drop a simpler photo or let it scale further. Beauty filters and busy backgrounds waste bytes that should go to the face. Last checked: September 2026.",
      },
      {
        h2: "How the encoder works",
        p: "Drop the photo. It stays in this tab. The encoder binary-searches JPEG quality until the file is 20 KB or smaller. If quality alone cannot fit, it scales the image slightly and tries again. You see original vs new bytes before you save. Close the tab and the photo is gone. No account. No watermark. We will not invent SAT, GRE, or BCS 20 KB pages — if those notifications name 20 KB, this same engine is the tool.",
      },
      {
        h2: "10 KB, 20 KB, 50 KB",
        p: "Use 10 KB when the form is strict (some railway and older SSC windows). Stay on 20 KB when the form says 10–20 KB or “maximum 20 KB”. Use 50 KB for many passport, Aadhaar, and college uploads. Do not run a 50 KB file through this page unless the form actually wants 20 KB — you will only lose detail. “Increase image to 20 KB” is not a product. Last checked: September 2026.",
      },
      {
        h2: "On this device",
        p: "Canvas JPEG encode runs in the browser. Nothing is uploaded. Confirm the current exam or recruitment notification for pixels, KB, and colour vs black-and-white. If the form wants a signature at 20 KB, open the signature resizer. If it wants a PDF of documents, open compress PDF. This page is a photo byte cap only.",
      },
    ],
  },
  "compress-pdf-to-500kb": {
    howTo: [
      "Drop the PDF or each page photo in order.",
      "Leave 500 KB unless the circular names 200 KB.",
      "Download. Split long colour scans if names go soft.",
    ],
    sections: [
      {
        h2: "500 KB KYC cap",
        p: "Character certificates, caste, GST, Form 16, passbook, and many university attachments stop at 500 KB. This page defaults there. Pages are rebuilt as JPEG. Selectable text is lost. A two-page certificate usually stays readable. A 20-page colour statement often needs a split. Last checked: September 2026. Confirm on the form. Not a government website.",
      },
      {
        h2: "When to use 2 MB or 1 MB instead",
        p: "Visa desks and banks often allow 2 MB. Email checklists often want 1 MB. Stay on 500 KB only when the circular names that cap. Family packs of several certificates belong on the family document pack (merge, then 2 MB) unless the portal is tighter. Processing stays in this tab. No account. No watermark. We do not pad a small PDF up to 500 KB.",
      },
    ],
  },
  "aadhaar-photo-resizer": {
    howTo: [
      "Drop a recent colour portrait on white or a plain wall.",
      "Keep 35×45 mm and 20–50 KB JPEG unless UIDAI names other numbers.",
      "Download and upload the file on the official Aadhaar / KYC form yourself.",
    ],
    sections: [
      {
        h2: "Aadhaar photograph size",
        p: "Typical digital Aadhaar / KYC portraits are 3.5×4.5 cm (35×45 mm), white background, JPEG between 20 and 50 KB. That is a portal window, not a UIDAI API. This page does not send photos to UIDAI. You download a file and submit it on the official form. Passport 51×51 mm is a different tool. PAN 2.5×3.5 cm is a different tool. Confirm KB on the current form — windows move. Last checked: September 2026. आभार: आमतौर पर 3.5×4.5 सेमी, सफेद बैकग्राउंड, 20–50 KB. पोर्टल पर KB की पुष्टि करें.",
      },
      {
        h2: "Rejected uploads",
        p: "Over 50 KB, grey backdrop, cropped ears, glare, or a photo of a printed Aadhaar card. Recrop here and leave the cap on. Infants: use infant crop, then confirm the circular. This is not an Aadhaar enrolment centre and will not print a card.",
      },
      {
        h2: "On this device",
        p: "Crop, background, and KB cap run in this browser. Close the tab and the portrait is gone. No account. No watermark. Last checked: September 2026. Not a government website.",
      },
    ],
  },
  "family-document-pack": {
    howTo: [
      "Drop PDFs or page photos in the order the form lists.",
      "They merge, then the pack is capped at 2 MB.",
      "Download one PDF from this tab.",
    ],
    sections: [
      {
        h2: "What a family pack is",
        p: "KYC and visa desks often want several scans in one PDF under 2 MB: passbook, marksheet, utility bill, passport biodata page. Drop them in order. The same compressor used for “compress PDF to 2MB” rebuilds the pages as JPEG so the combined file fits. Portraits and signatures stay on the photo and signature tools — they are JPEGs, not this PDF. Last checked: September 2026. Confirm the portal cap. Not a government website.",
      },
      {
        h2: "Order and naming",
        p: "Most checklists want a fixed order (for example: identity proof, address proof, income proof). Drop files in that order; the pack is merged as dropped. We do not rename pages inside the PDF. If the form wants three separate uploads, do not merge — use the 2 MB / 1 MB / 500 KB pages per file instead. Aadhaar and PAN portraits are face JPEGs; a scan of the plastic card can go in this pack if the form asks for a copy of the card.",
      },
      {
        h2: "If it is still too big",
        p: "Drop fewer pages. Use merge-to-500KB if the circular is tighter. Do not zip unless the form accepts ZIP. Colour photos of glossy certificates waste bytes — reshoot on a matte table in even light. Selectable text is lost; keep the originals. Last checked: September 2026. Confirm the cap.",
      },
      {
        h2: "On this device",
        p: "Merge and encode run in this browser tab. Close the tab and the pages are gone. No account. No watermark. This pack will not issue a visa, a cancelled cheque, or a family tree. If the portal cap is 1 MB, type 1 MB or open the 1 MB merge page. Last checked: September 2026.",
      },
      {
        h2: "What belongs here vs a photo tool",
        p: "Passbook pages, marksheets, utility bills, rent agreements, and a scan of a plastic ID belong here. A 35×45 mm face JPEG for the same form does not — that is a photo preset, often 20–50 KB or 100 KB, not a page in this PDF. Mixing a portrait into the pack wastes the 2 MB budget and still fails the photo upload. Signature boxes are the same: separate JPEG. If the checklist wants “photo + documents”, run two downloads.",
      },
      {
        h2: "How the encoder tries",
        p: "Files are read in drop order, rasterized, then encoded as JPEG pages. Quality steps down if the combined PDF is over 2 MB; page pixels shrink if quality is not enough. You still get a download if it misses the cap — the tool says so, and you should drop fewer pages. Do not pad a small pack up to 2 MB. Confirm the circular. Last checked: September 2026.",
      },
    ],
  },
  "passport-photo-maker": {
    howTo: [
      "Drop a portrait taken in even light.",
      "Confirm millimetres: India 51×51, US 2×2, UK/Schengen 35×45.",
      "Download the JPEG, or an A4 / 4×6 print sheet from this tab.",
    ],
    sections: [
      {
        h2: "Which millimetres",
        p: "India Passport Seva and OCI use 51×51 mm (600×600 at 300 DPI), white, often 10–50 KB for digital upload. The United States uses 2×2 in, 600×600, 54–240 KB, no glasses, face about 50–69% of the frame. UK and Schengen use 35×45 mm; UK wants a light-grey field more often than pure white. Canada’s passport print is 50×70 mm — not the 35×45 IRCC visa crop. Switch the preset before you print an A4 sheet. Search the preset list if you need a visa or national-ID size instead. Last checked: September 2026.",
      },
      {
        h2: "Infant crop and rejects",
        p: "Infants need more space above the head. Tick infant crop, then confirm the form — some missions still want the adult face-height band. Portals reject for wrong millimetres, file over the KB cap, grey paper when the form wants white, glare, cropped ears, or a photo of a printed photo. Use the live pass/fail list. Print sheet: 4×6 or A4 from this tab after the JPEG looks right.",
      },
      {
        h2: "On this device",
        p: "Crop, background, and KB cap run in the browser. This is not Passport Seva or a studio. Close the tab and the portrait is gone. No account. No watermark. Last checked: September 2026. Confirm the current form.",
      },
    ],
  },
  "sign-pdf": {
    howTo: [
      "Drop the PDF, then a JPEG or PNG of the signature.",
      "Pick a corner and width. Last page, or every page.",
      "Download. This is ink on the page, not a certificate.",
    ],
    sections: [
      {
        h2: "What “sign PDF” means here",
        p: "You already have a signature scan. This page draws it onto the PDF in this browser. HR and many visa checklists accept that. It is not DocuSign, Adobe Sign, or a PAdES certificate. Flatten the file afterwards if the portal rejects live form fields. Last checked: September 2026.",
      },
      {
        h2: "On this device",
        p: "pdf-lib stamps the image. Close the tab and both files are gone. No account. No watermark. Crop a 10–20 KB ink JPEG on the signature resizer first if the form also wants a separate signature upload.",
      },
    ],
  },
  "bank-statement-to-excel": {
    howTo: [
      "Drop a bank PDF. It stays in this tab.",
      "If there is no text layer, tick OCR (English).",
      "Download .xlsx. Check columns in Excel before you file.",
    ],
    sections: [
      {
        h2: "Statement to spreadsheet",
        p: "Accountants and visa packs often need a CSV/Excel of a PDF statement. We cluster the text layer by position. That is not OFX, not a bank login, and not a guarantee that every column lines up. Scanned statements need OCR in this tab. Last checked: September 2026.",
      },
    ],
  },
  "heic-to-pdf": {
    howTo: [
      "Drop one or more iPhone HEIC photos.",
      "Each still becomes a PDF page, in drop order.",
      "Download from this tab. Live Photo video is ignored.",
    ],
    sections: [
      {
        h2: "HEIC to PDF",
        p: "iPhone photos arrive as HEIC. Portals want PDF. Decode and assemble stay in this browser. Same engine as JPG to PDF. Last checked: September 2026.",
      },
    ],
  },
  "fill-pdf": {
    howTo: [
      "Drop a fillable PDF. Fields are listed from the file.",
      "Type into the widgets. Flatten afterwards if the portal rejects live fields.",
      "Download from this tab. Nothing is uploaded.",
    ],
    sections: [
      {
        h2: "Fill vs stamp",
        p: "AcroForm widgets (the boxes you can click in Acrobat) are listed here. A scan of a paper form has no widgets — stamp a line on page 1 or fill in a reader, then Flatten PDF. This is not a government e-file. Last checked: September 2026.",
      },
    ],
  },
  "redact-pdf": {
    howTo: [
      "Drop the PDF. Draw black boxes on the preview.",
      "Switch pages if you need more than page 1.",
      "Burn in. Hidden text can remain in some files — confirm for legal work.",
    ],
    sections: [
      {
        h2: "What redaction means here",
        p: "Black rectangles are drawn onto the page in this tab. That covers what you see. Some PDFs still hold a text layer underneath. For court or HR discovery, use a dedicated redaction suite if you must prove the glyphs are gone. Last checked: September 2026.",
      },
    ],
  },
  "organize-pdf": {
    howTo: [
      "Drop a PDF. Every page appears as a thumbnail.",
      "Delete, duplicate, insert a blank, reverse, remove blanks, or move selected pages.",
      "Download. The preview is the file you get.",
    ],
    sections: [
      {
        h2: "Organize without a server",
        p: "Pages are copied with pdf-lib in this tab. Reorder and duplicates keep selectable text. A blank page matches the size of page 1. Reverse flips the live order. Remove blanks drops nearly empty pages after a local raster scan. Last checked: September 2026.",
      },
    ],
  },
  "highlight-pdf": {
    howTo: [
      "Drop a PDF. Draw yellow boxes on the large preview.",
      "Click other pages to mark more. Clear if you miss.",
      "Burn in. Highlights are ink, not comments.",
    ],
    sections: [
      {
        h2: "Marker, not an annotation",
        p: "Yellow rectangles are drawn with a Multiply blend in this tab. They sit on the page like highlighter ink. A reader cannot toggle them off. We do not snap to a text layer — scanned pages work the same as born-digital. Last checked: September 2026.",
      },
    ],
  },
  "grayscale-pdf": {
    howTo: [
      "Drop a PDF. The preview desaturates so you can check pages.",
      "Click pages to convert only those, or convert all.",
      "Download. Converted pages are grayscale JPEGs.",
    ],
    sections: [
      {
        h2: "Why this is a rebuild",
        p: "pdf-lib cannot honestly recolour vector text and images to gray. Converted pages are rasterised and saved as grayscale JPEGs. Selectable text on those pages is gone. Pages you do not select are copied. Last checked: September 2026.",
      },
    ],
  },
  "pdf-2-up": {
    howTo: [
      "Drop a PDF. Consecutive pages are shown as a pair.",
      "Check the live 2-up preview.",
      "Download. Each sheet holds two source pages.",
    ],
    sections: [
      {
        h2: "Print two pages on one sheet",
        p: "Source pages are embedded, not photographed. An odd last page sits on a half-empty sheet. Confirm printer scaling — we do not invent a booklet imposition. Last checked: September 2026.",
      },
    ],
  },
  "add-images-to-pdf": {
    howTo: [
      "Drop the PDF. Click the page you want to insert after.",
      "Drop JPEGs or PNGs. Each becomes a new page.",
      "Download. Images are fitted to the PDF page size.",
    ],
    sections: [
      {
        h2: "New pages, not a stamp",
        p: "This inserts whole pages. To put a signature PNG on a corner of an existing page, use Sign PDF. Last checked: September 2026.",
      },
    ],
  },
  "reverse-pdf-pages": {
    howTo: [
      "Drop a PDF. Pages appear last-to-first.",
      "Delete any you do not want.",
      "Download. That order is the file.",
    ],
    sections: [
      {
        h2: "Copied, not flattened",
        p: "Page objects are copied with pdf-lib. Selectable text stays. For mixed reorder work, use Organize PDF. Last checked: September 2026.",
      },
    ],
  },
  "remove-blank-pdf-pages": {
    howTo: [
      "Drop a PDF. Nearly empty pages are pre-selected.",
      "Unselect any that still have a letterhead or a grey scan.",
      "Delete selected, then download remaining pages.",
    ],
    sections: [
      {
        h2: "What “blank” means here",
        p: "We rasterise at a low scale and count dark pixels. A page with almost no ink is blank. A faint scan, a rule, or a page number is not. Confirm before you delete. Last checked: September 2026.",
      },
    ],
  },
  "compare-pdf": {
    howTo: [
      "Drop PDF A, then PDF B.",
      "Click a page. Both files show that page number side by side.",
      "Download a paired PDF if you need a printout.",
    ],
    sections: [
      {
        h2: "Visual compare, not a redline",
        p: "Page N of A sits next to page N of B. We do not diff words, clauses, or metadata. Lawyers who need a legal redline still need a dedicated suite. Last checked: September 2026.",
      },
    ],
  },
  "pdf-to-csv": {
    howTo: [
      "Drop a PDF with a text layer, or tick OCR for a scan.",
      "We cluster text by position into columns.",
      "Download .csv. Open it in Excel or Sheets and tidy merged cells.",
    ],
    sections: [
      {
        h2: "Tables, not a bank API",
        p: "This is the same position cluster as PDF to Excel, written as CSV with a UTF-8 BOM so Excel opens it. Stamps, logos, and merged headers will need a pass. Not OFX, not a login. Last checked: September 2026.",
      },
    ],
  },
  "bank-statement-to-csv": {
    howTo: [
      "Drop a statement PDF. Tick OCR if you cannot select text.",
      "Columns are guessed from position.",
      "Download .csv and tidy dates in a spreadsheet.",
    ],
    sections: [
      {
        h2: "Why this page exists",
        p: "Bookkeepers search “pdf bank statement to csv” when they do not want an .xlsx. Same local engine as Bank statement to Excel. We do not log into a bank. Last checked: September 2026.",
      },
    ],
  },
  "receipt-to-excel": {
    howTo: [
      "Drop a receipt PDF. Photos of till slips need OCR ticked.",
      "Text is grouped into columns.",
      "Download .xlsx and check the total row.",
    ],
    sections: [
      {
        h2: "Till slips vs invoices",
        p: "A crumpled till photo is harder than a digital invoice. Tick OCR. Columns will still need a pass. Invoice to Excel is the same engine with invoice wording. Not a bookkeeping API. Last checked: September 2026.",
      },
    ],
  },
  "resize-pdf": {
    howTo: [
      "Drop a PDF. Pick A4, US Letter, or US Legal.",
      "Check the live pages.",
      "Download. Content is scaled onto the new paper. Margins may grow.",
    ],
    sections: [
      {
        h2: "Paper sizes we actually use",
        p: "A4 is 210×297 mm. US Letter is 8.5×11 in. US Legal is 8.5×14 in. USCIS paper filing wants letter-size copies — confirm the current form; we do not submit. Last checked: September 2026.",
      },
    ],
  },
};

export function getLandingCopy(slug: string): LandingCopy | undefined {
  return TOOL_LANDING_COPY[slug];
}
