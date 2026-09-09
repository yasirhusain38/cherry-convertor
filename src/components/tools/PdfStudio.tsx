"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DropZone } from "@/components/DropZone";
import { PdfPageGrid, selectPages } from "@/components/PdfPageGrid";
import { downloadBlob } from "@/lib/download";
import { formatBytes } from "@/lib/format";
import { canvasToBlob, compressToTargetBytes } from "@/lib/image";
import { textToDocx, rowsToCsv, rowsToXlsx } from "@/lib/office";
import { ocrCanvases } from "@/lib/ocr";
import { stripPdfMetadata } from "@/lib/pdf-meta";
import { rasterPdfPages, thumbsFromFiles, thumbsFromPdf, type PdfThumb } from "@/lib/pdf-raster";
import {
  assemblePdfPages,
  comparePdfsSideBySide,
  cropPdfPages,
  detectBlankPdfPages,
  extractPdfImages,
  extractPdfTables,
  extractPdfText,
  fillPdfFields,
  fitPdfPageSize,
  flattenPdf,
  grayscalePdf,
  highlightPdf,
  insertImagesIntoPdf,
  listPdfFields,
  mergePdfs,
  numberPdfPages,
  nUpPdf,
  parsePageRanges,
  pdfPageCount,
  rasterPdfOrImages,
  redactPdf,
  rotatePdfPages,
  splitPdfToFiles,
  stampSignature,
  watermarkPdf,
  type PaperFormat,
  type PdfFormField,
  type RedactBox,
} from "@/lib/pdf-ops";
import { bytesToSizeInput, parseTypedSize, type SizeUnit } from "@/lib/target-size";
import { TargetSizeField } from "@/components/TargetSizeField";
import type { ToolDef } from "@/lib/tools";
import JSZip from "jszip";

type Kind =
  | "merge"
  | "split"
  | "extract"
  | "delete"
  | "rotate"
  | "sign"
  | "flatten"
  | "fill"
  | "redact"
  | "images"
  | "pagesize"
  | "spec"
  | "organize"
  | "watermark"
  | "numbers"
  | "crop"
  | "highlight"
  | "grayscale"
  | "nup"
  | "insert"
  | "reverse"
  | "blanks"
  | "compare"
  | "png"
  | "jpg"
  | "text"
  | "word"
  | "excel"
  | "csv"
  | "meta";

function kindOf(slug: string): Kind {
  if (slug.includes("metadata") || slug.includes("strip")) return "meta";
  if (slug.includes("upload-spec") || slug.includes("spec-checker")) return "spec";
  if (slug.includes("compare")) return "compare";
  if (slug.includes("highlight")) return "highlight";
  if (slug.includes("grayscale") || slug.includes("greyscale")) return "grayscale";
  if (slug.includes("2-up") || slug.includes("n-up") || slug.includes("two-up")) return "nup";
  if (slug.includes("add-image") || slug.includes("insert-image")) return "insert";
  if (slug.includes("blank-pdf") || slug.includes("remove-blank")) return "blanks";
  if (slug.includes("reverse-pdf")) return "reverse";
  if (slug.includes("organize-pdf") || slug.includes("reorder-pdf")) return "organize";
  if (slug.includes("watermark-pdf")) return "watermark";
  if (slug.includes("number-pdf") || slug.includes("page-numbers")) return "numbers";
  if (slug.includes("crop-pdf")) return "crop";
  if (slug.includes("fill-pdf")) return "fill";
  if (slug.includes("redact")) return "redact";
  if (slug.includes("extract") && slug.includes("image")) return "images";
  if (
    slug.includes("a4-to-letter") ||
    slug.includes("letter-to-a4") ||
    slug.includes("resize-pdf") ||
    slug.includes("legal-size") ||
    slug.includes("pdf-to-legal")
  )
    return "pagesize";
  if (slug.includes("sign-pdf") || slug.endsWith("sign-pdf")) return "sign";
  if (slug.includes("flatten")) return "flatten";
  if (slug.includes("rotate-pdf") || slug.includes("rotate-pdf-pages")) return "rotate";
  if (slug.includes("delete-pdf") || slug.includes("remove-pdf-page")) return "delete";
  if (slug.includes("merger") || slug.includes("merge")) return "merge";
  if (slug.includes("split")) return "split";
  if (slug.includes("extract")) return "extract";
  if (slug.includes("jpg") || slug.includes("jpeg")) return "jpg";
  if (slug.includes("png")) return "png";
  if (slug.includes("csv")) return "csv";
  if (slug.includes("excel")) return "excel";
  if (slug.includes("word")) return "word";
  return "text";
}

function defaultPaper(slug: string): PaperFormat {
  if (slug.includes("letter-to-a4")) return "a4";
  if (slug.includes("a4-to-letter")) return "letter";
  if (slug.includes("legal")) return "legal";
  return "a4";
}

const BLANK_PAGE =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280"><rect width="100%" height="100%" fill="#F5F5F1"/><text x="50%" y="52%" text-anchor="middle" fill="#888" font-size="16">Blank</text></svg>',
  );

export function PdfStudio({ tool }: { tool: ToolDef }) {
  const kind = kindOf(tool.slug);
  const multiple = kind === "merge" || kind === "png" || kind === "compare";
  const [files, setFiles] = useState<File[]>([]);
  const [range, setRange] = useState(kind === "rotate" ? "" : "1-3");
  const [ocr, setOcr] = useState(kind === "word");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [signFile, setSignFile] = useState<File | null>(null);
  const [signWidth, setSignWidth] = useState(45);
  const [corner, setCorner] = useState<"br" | "bl" | "tr" | "tl">("br");
  const [allPages, setAllPages] = useState(false);
  const [angle, setAngle] = useState<90 | 180 | 270>(90);
  const [fields, setFields] = useState<PdfFormField[]>([]);
  const [overlay, setOverlay] = useState("");
  const [boxes, setBoxes] = useState<RedactBox[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewPage, setPreviewPage] = useState(1);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const [drawing, setDrawing] = useState<RedactBox | null>(null);
  const seeded = bytesToSizeInput(2 * 1024 * 1024);
  const [specSize, setSpecSize] = useState(seeded.value);
  const [specUnit, setSpecUnit] = useState<SizeUnit>(seeded.unit);
  const [thumbs, setThumbs] = useState<PdfThumb[]>([]);
  const [kept, setKept] = useState<number[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [anchor, setAnchor] = useState<number | null>(null);
  const [focusPage, setFocusPage] = useState<number | null>(null);
  const [thumbsBusy, setThumbsBusy] = useState(false);
  const [markText, setMarkText] = useState("CONFIDENTIAL");
  const [markOpacity, setMarkOpacity] = useState(16);
  const [pageFormat, setPageFormat] = useState<PaperFormat>(defaultPaper(tool.slug));
  const [thumbsB, setThumbsB] = useState<PdfThumb[]>([]);
  const [insertFiles, setInsertFiles] = useState<File[]>([]);
  const [insertThumbs, setInsertThumbs] = useState<PdfThumb[]>([]);

  const file = files[0] ?? null;
  const fileB = files[1] ?? null;
  const pageTools =
    kind === "delete" || kind === "extract" || kind === "organize" || kind === "reverse" || kind === "blanks";
  const stageDraw = kind === "crop" || kind === "highlight";
  const visibleThumbs = useMemo(() => {
    if (!pageTools) return thumbs;
    return kept.map((source, index) => {
      const thumb = thumbs.find((item) => item.page === source);
      return {
        page: index + 1,
        url: source <= 0 ? BLANK_PAGE : thumb?.url ?? BLANK_PAGE,
        width: thumb?.width ?? 200,
        height: thumb?.height ?? 280,
      };
    });
  }, [kept, pageTools, thumbs]);
  const focusThumb =
    visibleThumbs.find((thumb) => thumb.page === focusPage) ??
    (kind === "compare" ? null : visibleThumbs[0]) ??
    null;
  const compareLeft = thumbs.find((thumb) => thumb.page === (focusPage ?? 1));
  const compareRight = thumbsB.find((thumb) => thumb.page === (focusPage ?? 1));
  const rotatePreview = kind === "rotate" ? angle : 0;

  async function onFiles(next: File[]) {
    setError(null);
    setPreview("");
    const list =
      kind === "compare"
        ? [...files, ...next].slice(0, 2)
        : multiple
          ? [...files, ...next]
          : next.slice(0, 1);
    setFiles(list);
    void loadThumbs(list);
    const first = list[0];
    if (first && kind !== "merge") {
      try {
        setPageCount(await pdfPageCount(first));
      } catch {
        setPageCount(null);
      }
      if (kind === "fill") {
        try {
          setFields(await listPdfFields(first));
        } catch {
          setFields([]);
        }
      }
      if (kind === "redact") {
        setBoxes([]);
        setPreviewPage(1);
        await loadRedactPreview(first, 1);
      }
    }
  }

  async function loadThumbs(list: File[]) {
    setThumbsBusy(true);
    try {
      if (kind === "compare") {
        const left = list[0] ? await thumbsFromPdf(list[0]) : [];
        const right = list[1] ? await thumbsFromPdf(list[1]) : [];
        setThumbs(left);
        setThumbsB(right);
        const pages = left.map((thumb) => thumb.page);
        setKept(pages);
        setSelected([]);
        setAnchor(pages[0] ?? null);
        setFocusPage(pages[0] ?? null);
        return;
      }
      const next = multiple ? await thumbsFromFiles(list) : list[0] ? await thumbsFromPdf(list[0]) : [];
      setThumbs(next);
      const pages = next.map((thumb) => thumb.page);
      setKept(kind === "reverse" ? [...pages].reverse() : pages);
      setSelected([]);
      setAnchor(pages[0] ?? null);
      setFocusPage(kind === "reverse" ? pages.length : (pages[0] ?? null));
      if (kind === "blanks" && list[0]) {
        const blanks = await detectBlankPdfPages(list[0]);
        setSelected(blanks);
        setStatus(
          blanks.length ? `${blanks.length} nearly blank page${blanks.length === 1 ? "" : "s"} selected.` : "No blank pages found.",
        );
      }
    } catch {
      setThumbs([]);
      setThumbsB([]);
      setKept([]);
    } finally {
      setThumbsBusy(false);
    }
  }

  function handleSelect(page: number, mods: { ctrl: boolean; shift: boolean }) {
    const vis = visibleThumbs.map((thumb) => thumb.page);
    const next = selectPages(vis, selected, anchor, page, mods);
    setSelected(next.selected);
    setAnchor(next.anchor);
    setFocusPage(page);
  }

  const removePages = useCallback((pages: number[]) => {
    if (!pages.length) return;
    setKept((currentKept) => {
      const drop = new Set(pages);
      const nextKept = currentKept.filter((_, index) => !drop.has(index + 1));
      if (!nextKept.length) {
        setError("Leave at least one page.");
        return currentKept;
      }
      setSelected([]);
      setFocusPage(nextKept.length);
      setError(null);
      return nextKept;
    });
  }, []);

  const moveSelected = useCallback((dir: -1 | 1) => {
    const sel = [...selected].sort((a, b) => a - b);
    if (!sel.length) return;
    if (dir < 0 && sel[0] === 1) return;
    if (dir > 0 && sel[sel.length - 1] === kept.length) return;
    const next = [...kept];
    const walk = dir < 0 ? sel : [...sel].reverse();
    for (const pos of walk) {
      const i = pos - 1;
      const j = i + dir;
      [next[i], next[j]] = [next[j]!, next[i]!];
    }
    setKept(next);
    setSelected(sel.map((pos) => pos + dir));
    setFocusPage((current) => (current ? current + dir : current));
  }, [kept, selected]);

  const duplicateSelected = useCallback(() => {
    const sel = selected.length ? selected : focusPage ? [focusPage] : [];
    if (!sel.length) return;
    const copies = sel.map((pos) => kept[pos - 1] ?? 0);
    const insertAt = Math.max(...sel);
    const next = [...kept];
    next.splice(insertAt, 0, ...copies);
    setKept(next);
    setSelected(copies.map((_, i) => insertAt + 1 + i));
  }, [focusPage, kept, selected]);

  function insertBlank() {
    const at = focusPage ?? kept.length;
    const next = [...kept];
    next.splice(at, 0, 0);
    setKept(next);
    setFocusPage(at + 1);
    setSelected([at + 1]);
  }

  function reverseKept() {
    setKept((current) => [...current].reverse());
    setSelected([]);
    setFocusPage(1);
  }

  async function removeDetectedBlanks() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setStatus("Finding blank pages…");
    try {
      const blanks = await detectBlankPdfPages(file);
      if (!blanks.length) {
        setStatus("No blank pages found.");
        return;
      }
      const drop = new Set(blanks);
      setKept((current) => {
        const next = current.filter((source) => source <= 0 || !drop.has(source));
        if (!next.length) {
          setError("That would delete every page. Leave at least one.");
          return current;
        }
        setSelected([]);
        setFocusPage(1);
        setStatus(`Removed ${current.length - next.length} blank page${current.length - next.length === 1 ? "" : "s"}.`);
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not scan for blank pages.");
    } finally {
      setBusy(false);
    }
  }

  async function onInsertImages(next: File[]) {
    setInsertFiles(next);
    try {
      setInsertThumbs(next.length ? await thumbsFromFiles(next) : []);
    } catch {
      setInsertThumbs([]);
    }
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable);
      if (typing || !visibleThumbs.length) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a") {
        event.preventDefault();
        setSelected(visibleThumbs.map((thumb) => thumb.page));
        return;
      }
      if (event.key === "Escape") {
        setSelected([]);
        return;
      }
      if ((event.key === "Delete" || event.key === "Backspace") && pageTools) {
        event.preventDefault();
        removePages(selected.length ? selected : focusPage ? [focusPage] : []);
        return;
      }
      if (kind === "organize" && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
        event.preventDefault();
        moveSelected(event.key === "ArrowLeft" ? -1 : 1);
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d" && kind === "organize") {
        event.preventDefault();
        duplicateSelected();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [duplicateSelected, focusPage, kind, moveSelected, pageTools, removePages, selected, visibleThumbs]);

  async function loadRedactPreview(pdf: File, page: number) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    try {
      const rasters = await rasterPdfPages(pdf, 1.15);
      const canvas = rasters[Math.max(0, page - 1)]?.canvas ?? rasters[0]?.canvas;
      if (!canvas) return;
      const blob = await canvasToBlob(canvas, "image/png");
      setPreviewUrl(URL.createObjectURL(blob));
    } catch {
      setPreviewUrl(null);
    }
  }

  const hint = useMemo(() => {
    if (kind === "merge") return "Drop PDFs in order. Use Up/Down to reorder.";
    if (kind === "word") return "Text-based PDFs become a .docx. Scanned pages can be OCRed in this tab.";
    if (kind === "excel") return "Text is grouped into columns from its position on the page. Not a bank API.";
    if (kind === "sign") return "Drop the PDF, then a signature JPEG/PNG. Stamped in this tab — not a certificate e-sign.";
    if (kind === "delete")
      return "Click a page, Ctrl/Cmd click to add, Shift click for a range. Delete or × removes it. Preview is the remaining file.";
    if (kind === "extract")
      return "Same as delete: remove pages you do not want. Download is the remaining pages, copied not rasterised.";
    if (kind === "organize")
      return "Delete, duplicate, insert a blank, reverse, remove blanks, and move selected pages. Live preview is the download.";
    if (kind === "watermark") return "Type the stamp. Preview pages first, then burn it in at an angle.";
    if (kind === "numbers") return "Adds “1 / n” at the bottom of every page.";
    if (kind === "crop") return "Draw a crop box on the large preview, then apply. Relative crop is used on selected pages or all.";
    if (kind === "highlight")
      return "Draw yellow boxes on the large preview. Ink is burned in with Multiply — not an Acrobat comment you can toggle off.";
    if (kind === "grayscale")
      return "Preview is desaturated. Download rebuilds those pages as grayscale JPEGs — selectable text on converted pages is gone.";
    if (kind === "nup") return "Pairs consecutive pages onto one sheet (2-up). Vectors are copied, not rasterised.";
    if (kind === "insert") return "Drop the PDF, click the page to insert after, then drop images. Images become new pages.";
    if (kind === "reverse") return "Pages are shown last-to-first. Download is that order, copied not rasterised.";
    if (kind === "blanks")
      return "Nearly empty pages are pre-selected. Delete them, or download remaining pages. Scans with faint grey are kept.";
    if (kind === "compare")
      return "Drop two PDFs. Side-by-side preview, then a paired PDF you can print. Visual only — not a legal redline of wording.";
    if (kind === "csv") return "Text is grouped into columns from its position on the page. Downloads .csv. Not a bank API.";
    if (kind === "pagesize") return "Content is scaled onto A4, US Letter, or US Legal. Margins may grow. Confirm print settings.";
    if (kind === "rotate") return "Rotate 90 / 180 / 270°. Pages are copied with pdf-lib.";
    if (kind === "flatten") return "Form widgets become static ink. Needed by some court and USCIS uploads.";
    if (kind === "fill") return "AcroForm fields are listed below. No fields? Type a line to stamp at the bottom of page 1.";
    if (kind === "redact") return "Draw black boxes on the preview. Ink is burned in — this is not hiding text with a white rectangle in a viewer.";
    if (kind === "images") return "Embedded pictures first. If none are found, each page is exported as a PNG.";
    if (kind === "spec") return "Checks bytes and page count in this tab. Confirm millimetres and KB on the official form.";
    return "The file stays in this tab.";
  }, [kind]);

  async function run() {
    if (!files.length) return;
    setBusy(true);
    setError(null);
    setStatus("Working…");
    try {
      if (kind === "merge") {
        const blob = await mergePdfs(files);
        downloadBlob(blob, "merged.pdf");
        setStatus(`Merged ${files.length} files.`);
        return;
      }
      if (!file) return;
      if (kind === "meta") {
        const blob = await stripPdfMetadata(file);
        downloadBlob(blob, `${baseName(file)}-no-meta.pdf`);
        setStatus("Title, author, dates, and Info dictionary cleared in this tab. Encrypted files may fail.");
        return;
      }
      if (kind === "split") {
        const parts = await splitPdfToFiles(file);
        if (parts.length === 1) {
          downloadBlob(parts[0].blob, parts[0].name);
        } else {
          const zip = new JSZip();
          parts.forEach((p) => zip.file(p.name, p.blob));
          downloadBlob(await zip.generateAsync({ type: "blob" }), `${baseName(file)}-pages.zip`);
        }
        setStatus(`${parts.length} page file${parts.length === 1 ? "" : "s"}.`);
        return;
      }
      if (kind === "extract" || kind === "delete" || kind === "organize" || kind === "reverse" || kind === "blanks") {
        const blob = await assemblePdfPages(file, kept);
        const tag = kind === "organize" ? "organized" : kind === "reverse" ? "reversed" : "trimmed";
        downloadBlob(blob, `${baseName(file)}-${tag}.pdf`);
        setStatus(`${kept.length} page${kept.length === 1 ? "" : "s"} in the download.`);
        return;
      }
      if (kind === "compare") {
        if (!fileB) throw new Error("Drop a second PDF to compare.");
        const blob = await comparePdfsSideBySide(file, fileB);
        downloadBlob(blob, `${baseName(file)}-vs-${baseName(fileB)}.pdf`);
        setStatus("Side-by-side PDF downloaded. Visual only — wording is not redlined.");
        return;
      }
      if (kind === "highlight") {
        const blob = await highlightPdf(file, boxes);
        downloadBlob(blob, `${baseName(file)}-highlighted.pdf`);
        setStatus(`Burned ${boxes.length} highlight${boxes.length === 1 ? "" : "s"} into the PDF.`);
        return;
      }
      if (kind === "grayscale") {
        const blob = await grayscalePdf(file, selected.length ? selected : undefined);
        downloadBlob(blob, `${baseName(file)}-gray.pdf`);
        setStatus(
          selected.length
            ? `Rebuilt ${selected.length} page(s) as grayscale JPEG. Other pages copied.`
            : "Rebuilt every page as a grayscale JPEG. Selectable text is gone.",
        );
        return;
      }
      if (kind === "nup") {
        const blob = await nUpPdf(file, 2);
        downloadBlob(blob, `${baseName(file)}-2up.pdf`);
        setStatus("Paired consecutive pages onto one sheet each.");
        return;
      }
      if (kind === "insert") {
        const blob = await insertImagesIntoPdf(file, insertFiles, focusPage ?? thumbs.length);
        downloadBlob(blob, `${baseName(file)}-images.pdf`);
        setStatus(`Inserted ${insertFiles.length} image${insertFiles.length === 1 ? "" : "s"} after page ${focusPage ?? thumbs.length}.`);
        return;
      }
      if (kind === "watermark") {
        const blob = await watermarkPdf(file, {
          text: markText,
          opacity: markOpacity / 100,
          pages: selected.length ? selected : undefined,
        });
        downloadBlob(blob, `${baseName(file)}-watermarked.pdf`);
        setStatus("Watermark drawn in this tab.");
        return;
      }
      if (kind === "numbers") {
        const blob = await numberPdfPages(file);
        downloadBlob(blob, `${baseName(file)}-numbered.pdf`);
        setStatus("Page numbers added at the bottom.");
        return;
      }
      if (kind === "crop") {
        const box = boxes[0];
        if (!box) throw new Error("Draw a crop box on the large preview.");
        const blob = await cropPdfPages(file, box, selected.length ? selected : undefined);
        downloadBlob(blob, `${baseName(file)}-cropped.pdf`);
        setStatus("Crop box applied.");
        return;
      }
      if (kind === "rotate") {
        const pages = selected.length ? selected : range.trim() ? parsePageRanges(range, pageCount ?? 1) : undefined;
        const blob = await rotatePdfPages(file, angle, pages);
        downloadBlob(blob, `${baseName(file)}-rotated.pdf`);
        setStatus(`Rotated ${pages?.length ? pages.length : "all"} page(s) ${angle}°.`);
        return;
      }
      if (kind === "flatten") {
        const blob = await flattenPdf(file);
        downloadBlob(blob, `${baseName(file)}-flat.pdf`);
        setStatus("Form fields flattened in this tab.");
        return;
      }
      if (kind === "sign") {
        if (!signFile) throw new Error("Drop a signature image too.");
        const blob = await stampSignature({
          pdf: file,
          signature: signFile,
          widthMm: signWidth,
          marginMm: 12,
          corner,
          allPages,
        });
        downloadBlob(blob, `${baseName(file)}-signed.pdf`);
        setStatus("Signature drawn on the PDF in this tab. Not a certificate or DocuSign.");
        return;
      }
      if (kind === "fill") {
        const values: Record<string, string> = {};
        for (const field of fields) values[field.name] = field.value;
        const blob = await fillPdfFields(file, values, overlay.trim() ? { text: overlay, page: 1 } : undefined);
        downloadBlob(blob, `${baseName(file)}-filled.pdf`);
        setStatus(
          fields.length
            ? `Wrote ${fields.length} field${fields.length === 1 ? "" : "s"}. Flatten if the portal rejects live widgets.`
            : overlay.trim()
              ? "No AcroForm — stamped your line at the bottom of page 1."
              : "No fillable fields found. Type a line below, or fill in a reader then flatten.",
        );
        return;
      }
      if (kind === "redact") {
        const blob = await redactPdf(file, boxes);
        downloadBlob(blob, `${baseName(file)}-redacted.pdf`);
        setStatus(`Burned ${boxes.length} black box${boxes.length === 1 ? "" : "es"} into the PDF.`);
        return;
      }
      if (kind === "images") {
        const images = await extractPdfImages(file);
        if (images.length === 1) {
          downloadBlob(images[0].blob, images[0].name);
        } else {
          const zip = new JSZip();
          images.forEach((img) => zip.file(img.name, img.blob));
          downloadBlob(await zip.generateAsync({ type: "blob" }), `${baseName(file)}-images.zip`);
        }
        setStatus(`${images.length} image${images.length === 1 ? "" : "s"}.`);
        return;
      }
      if (kind === "pagesize") {
        const blob = await fitPdfPageSize(file, pageFormat);
        downloadBlob(blob, `${baseName(file)}-${pageFormat}.pdf`);
        setStatus(`Fitted to ${pageFormat === "a4" ? "A4" : pageFormat === "legal" ? "US Legal" : "US Letter"}.`);
        return;
      }
      if (kind === "spec") {
        const parsed = parseTypedSize(specSize, specUnit);
        const cap = parsed?.bytes ?? 2 * 1024 * 1024;
        const count = pageCount ?? (await pdfPageCount(file));
        const ok = file.size <= cap;
        setStatus(
          `${file.name} · ${formatBytes(file.size)} · ${count} page${count === 1 ? "" : "s"} · cap ${formatBytes(cap)} · ${ok ? "Pass" : "Over — compress or split"}`,
        );
        return;
      }
      if (kind === "png" || kind === "jpg") {
        setStatus("Rasterising…");
        const pages = await rasterPdfOrImages(files, 2);
        const mime = kind === "jpg" ? "image/jpeg" : "image/png";
        const ext = kind === "jpg" ? "jpg" : "png";
        const cap = tool.targetBytes;
        const blobs: Blob[] = [];
        for (const page of pages) {
          if (cap && mime === "image/jpeg") {
            const bmp = await createImageBitmap(page.canvas);
            const targeted = await compressToTargetBytes({ source: bmp, targetBytes: cap, mime });
            bmp.close();
            blobs.push(targeted.blob);
            URL.revokeObjectURL(targeted.url);
          } else {
            blobs.push(await canvasToBlob(page.canvas, mime, 0.9));
          }
        }
        if (blobs.length === 1) {
          downloadBlob(blobs[0], `${baseName(files[0])}.${ext}`);
        } else {
          const zip = new JSZip();
          blobs.forEach((blob, i) => zip.file(`page-${String(i + 1).padStart(2, "0")}.${ext}`, blob));
          downloadBlob(await zip.generateAsync({ type: "blob" }), `${baseName(files[0])}-pages.zip`);
        }
        setStatus(`${blobs.length} ${ext.toUpperCase()}${blobs.length === 1 ? "" : "s"}${cap ? " under cap" : ""}.`);
        return;
      }
      if (kind === "excel" || kind === "csv") {
        const tables = await extractPdfTables(file);
        let sheets: Array<{ name: string; rows: string[][] }>;
        if (ocr && tables.pages.every((rows) => rows.every((r) => r.every((c) => !c)))) {
          setStatus("No text layer — OCRing…");
          const rasters = await rasterPdfOrImages([file], 2);
          const texts = await ocrCanvases(
            rasters.map((p) => p.canvas),
            "eng",
            (page, total) => setStatus(`OCR ${page}/${total}`),
          );
          sheets = texts.map((t, i) => ({
            name: `Page ${i + 1}`,
            rows: t.split(/\n/).map((line) => line.split(/\s{2,}|\t/)),
          }));
        } else {
          sheets = tables.pages.map((rows, i) => ({ name: `Page ${i + 1}`, rows }));
        }
        if (kind === "csv") {
          downloadBlob(rowsToCsv(sheets), `${baseName(file)}.csv`);
          setStatus("Downloaded .csv — position clustering, not a bank feed.");
        } else {
          downloadBlob(await rowsToXlsx(sheets), `${baseName(file)}.xlsx`);
          setStatus("Downloaded .xlsx");
        }
        return;
      }

      let pages: string[] = [];
      const extracted = await extractPdfText(file);
      const empty = !extracted.text.trim();
      if (empty || (ocr && kind === "word")) {
        if (empty || ocr) {
          setStatus("OCRing scanned pages…");
          const rasters = await rasterPdfOrImages([file], 2);
          pages = await ocrCanvases(
            rasters.map((p) => p.canvas),
            "eng",
            (page, total) => setStatus(`OCR ${page}/${total}`),
          );
        }
      } else {
        pages = extracted.pages;
      }
      const text = pages.join("\n\n");
      setPreview(text.slice(0, 8000));
      if (kind === "word") {
        downloadBlob(await textToDocx(pages, file.name), `${baseName(file)}.docx`);
        setStatus("Downloaded .docx — text extraction, not a layout-perfect conversion.");
      } else {
        downloadBlob(new Blob([text], { type: "text/plain;charset=utf-8" }), `${baseName(file)}.txt`);
        setStatus("Downloaded .txt");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not process that PDF.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6">
      <DropZone
        multiple={multiple}
        media="pdf"
        label={
          kind === "compare"
            ? files.length
              ? "Drop the second PDF"
              : "Drop the first PDF"
            : multiple
              ? "Drop PDFs, or browse"
              : "Drop a PDF, or browse"
        }
        hint={hint}
        onFiles={onFiles}
      />
      {thumbsBusy ? <p className="text-sm text-[var(--ink-soft)]">Rendering page previews…</p> : null}

      {visibleThumbs.length ? (
        <div className="pdf-live">
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm text-[var(--ink-soft)]">
                {visibleThumbs.length} page{visibleThumbs.length === 1 ? "" : "s"}
                {selected.length ? ` · ${selected.length} selected` : ""}
                {pageTools ? " · Click, Ctrl, Shift · Delete or ×" : ""}
              </p>
              {pageTools ? (
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={!selected.length && !focusPage}
                  onClick={() => removePages(selected.length ? selected : focusPage ? [focusPage] : [])}
                >
                  Delete selected
                </button>
              ) : null}
              {kind === "organize" ? (
                <>
                  <button type="button" className="btn btn-ghost" onClick={() => moveSelected(-1)}>
                    Move left
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => moveSelected(1)}>
                    Move right
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={duplicateSelected}>
                    Duplicate
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={insertBlank}>
                    Blank page
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={reverseKept}>
                    Reverse
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => void removeDetectedBlanks()}>
                    Remove blanks
                  </button>
                </>
              ) : null}
              {kind === "highlight" && boxes.length ? (
                <button type="button" className="btn btn-ghost" onClick={() => setBoxes([])}>
                  Clear highlights
                </button>
              ) : null}
            </div>
            <PdfPageGrid
              pages={visibleThumbs}
              selected={selected}
              focusPage={focusPage}
              removable={pageTools}
              rotate={kind === "rotate" ? rotatePreview : 0}
              rotatePages={kind === "rotate" ? selected : undefined}
              grayscale={kind === "grayscale"}
              onSelect={handleSelect}
              onRemove={removePages}
            />
            {kind === "compare" && thumbsB.length ? (
              <PdfPageGrid
                pages={thumbsB}
                selected={[]}
                focusPage={focusPage}
                onSelect={handleSelect}
              />
            ) : null}
            {kind === "insert" && insertThumbs.length ? (
              <PdfPageGrid pages={insertThumbs} selected={[]} focusPage={null} onSelect={() => undefined} />
            ) : null}
          </div>
          {kind === "compare" && (compareLeft || compareRight) ? (
            <div className="pdf-live__stage pdf-live__stage--pair">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={compareLeft?.url ?? BLANK_PAGE} alt="File A" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={compareRight?.url ?? BLANK_PAGE} alt="File B" />
            </div>
          ) : focusThumb ? (
            <div
              className={`pdf-live__stage${kind === "nup" || kind === "compare" ? " pdf-live__stage--pair" : ""}`}
              onPointerDown={
                stageDraw
                  ? (event) => {
                      const box = event.currentTarget.getBoundingClientRect();
                      const x = (event.clientX - box.left) / box.width;
                      const y = (event.clientY - box.top) / box.height;
                      drag.current = { x, y };
                      setDrawing({ page: focusThumb.page, x, y, w: 0, h: 0 });
                      event.currentTarget.setPointerCapture(event.pointerId);
                    }
                  : undefined
              }
              onPointerMove={
                stageDraw
                  ? (event) => {
                      const origin = drag.current;
                      if (!origin) return;
                      const box = event.currentTarget.getBoundingClientRect();
                      const nx = (event.clientX - box.left) / box.width;
                      const ny = (event.clientY - box.top) / box.height;
                      setDrawing({
                        page: focusThumb.page,
                        x: Math.min(origin.x, nx),
                        y: Math.min(origin.y, ny),
                        w: Math.abs(nx - origin.x),
                        h: Math.abs(ny - origin.y),
                      });
                    }
                  : undefined
              }
              onPointerUp={
                stageDraw
                  ? () => {
                      setDrawing((current) => {
                        if (current && current.w > 0.04 && current.h > 0.04) {
                          setBoxes((prev) => (kind === "highlight" ? [...prev, current] : [current]));
                        }
                        return null;
                      });
                      drag.current = null;
                    }
                  : undefined
              }
            >
              {kind === "nup" ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      (focusPage && focusPage % 2 === 0
                        ? visibleThumbs.find((thumb) => thumb.page === focusPage - 1)
                        : focusThumb
                      )?.url ?? BLANK_PAGE
                    }
                    alt="2-up left"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      (focusPage && focusPage % 2 === 0
                        ? focusThumb
                        : visibleThumbs.find((thumb) => thumb.page === (focusPage ?? 1) + 1)
                      )?.url ?? BLANK_PAGE
                    }
                    alt="2-up right"
                  />
                </>
              ) : kind === "compare" ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={focusThumb.url} alt="File A" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumbsB.find((thumb) => thumb.page === focusThumb.page)?.url ?? BLANK_PAGE}
                    alt="File B"
                  />
                </>
              ) : (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={focusThumb.url}
                    alt={`Preview page ${focusThumb.page}`}
                    style={{
                      filter: kind === "grayscale" ? "grayscale(1)" : undefined,
                      transform:
                        kind === "rotate" && (!selected.length || selected.includes(focusThumb.page))
                          ? `rotate(${rotatePreview}deg)`
                          : undefined,
                    }}
                  />
                  {kind === "crop"
                    ? [boxes[0], drawing].filter(Boolean).map((box, index) =>
                        box ? (
                          <div
                            key={index}
                            className="pointer-events-none absolute border-2 border-[#F2013F]"
                            style={{
                              left: `${box.x * 100}%`,
                              top: `${box.y * 100}%`,
                              width: `${box.w * 100}%`,
                              height: `${box.h * 100}%`,
                            }}
                          />
                        ) : null,
                      )
                    : null}
                  {kind === "highlight"
                    ? [...boxes.filter((box) => box.page === focusThumb.page), drawing].filter(Boolean).map((box, index) =>
                        box ? (
                          <div
                            key={`${box.x}-${box.y}-${index}`}
                            className="pointer-events-none absolute bg-[#ffe44d]/55 mix-blend-multiply"
                            style={{
                              left: `${box.x * 100}%`,
                              top: `${box.y * 100}%`,
                              width: `${box.w * 100}%`,
                              height: `${box.h * 100}%`,
                            }}
                          />
                        ) : null,
                      )
                    : null}
                </>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      {files.length ? (
        <ul className="card divide-y divide-[var(--line)]">
          {files.map((item, index) => (
            <li key={`${item.name}-${index}`} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
              <span>
                {String(index + 1).padStart(2, "0")}  /  {item.name}
                {pageCount && index === 0 && kind !== "merge" ? `  ·  ${pageCount} pages` : ""}
              </span>
              <span className="flex gap-3">
                {multiple ? (
                  <>
                    <button type="button" className="text-[#F5F5F1]" onClick={() => move(index, -1)}>
                      Up
                    </button>
                    <button type="button" className="text-[#F5F5F1]" onClick={() => move(index, 1)}>
                      Down
                    </button>
                  </>
                ) : null}
                <button
                  type="button"
                  className="text-brand"
                  onClick={() => setFiles((prev) => prev.filter((_, i) => i !== index))}
                >
                  Remove
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {kind === "insert" && file ? (
        <DropZone
          multiple
          media="image"
          label="Drop images to insert as pages"
          hint={`Inserted after page ${focusPage ?? (thumbs.length || 1)}. Click a PDF page to change that.`}
          onFiles={onInsertImages}
        />
      ) : null}
      {kind === "sign" ? (
        <DropZone
          media="image"
          label="Drop a signature image"
          hint="JPEG or PNG of the ink. Crop it first on the signature resizer if you need a KB cap."
          onFiles={(next) => setSignFile(next[0] ?? null)}
        />
      ) : null}
      {signFile && kind === "sign" ? (
        <p className="text-sm text-[var(--ink-soft)]">Signature: {signFile.name}</p>
      ) : null}

      {kind === "fill" && fields.length ? (
        <div className="card grid gap-4 p-6">
          {fields.map((field) => (
            <label key={field.name} className="grid gap-2 text-sm">
              {field.name}
              {field.type === "check" ? (
                <input
                  type="checkbox"
                  checked={Boolean(field.value)}
                  onChange={(event) =>
                    setFields((prev) =>
                      prev.map((item) =>
                        item.name === field.name ? { ...item, value: event.target.checked ? "yes" : "" } : item,
                      ),
                    )
                  }
                />
              ) : (
                <input
                  className="field"
                  value={field.value}
                  onChange={(event) =>
                    setFields((prev) =>
                      prev.map((item) => (item.name === field.name ? { ...item, value: event.target.value } : item)),
                    )
                  }
                />
              )}
            </label>
          ))}
        </div>
      ) : null}
      {kind === "fill" ? (
        <label className="grid gap-2 text-sm">
          Extra line on page 1 (if there are no form fields)
          <input
            className="field"
            value={overlay}
            placeholder="Optional stamped line"
            onChange={(event) => setOverlay(event.target.value)}
          />
        </label>
      ) : null}

      {kind === "redact" && previewUrl ? (
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span>Page {previewPage}</span>
            {pageCount && pageCount > 1 ? (
              <input
                className="field w-24"
                type="number"
                min={1}
                max={pageCount}
                value={previewPage}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  setPreviewPage(next);
                  if (file) void loadRedactPreview(file, next);
                }}
              />
            ) : null}
            <button type="button" className="btn btn-ghost" onClick={() => setBoxes([])}>
              Clear boxes
            </button>
          </div>
          <div
            className="relative mx-auto max-w-xl overflow-hidden rounded-[12px] border border-[var(--line)]"
            onPointerDown={(event) => {
              const box = event.currentTarget.getBoundingClientRect();
              const x = (event.clientX - box.left) / box.width;
              const y = (event.clientY - box.top) / box.height;
              drag.current = { x, y };
              setDrawing({ page: previewPage, x, y, w: 0, h: 0 });
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              const origin = drag.current;
              if (!origin) return;
              const box = event.currentTarget.getBoundingClientRect();
              const nx = (event.clientX - box.left) / box.width;
              const ny = (event.clientY - box.top) / box.height;
              setDrawing({
                page: previewPage,
                x: Math.min(origin.x, nx),
                y: Math.min(origin.y, ny),
                w: Math.abs(nx - origin.x),
                h: Math.abs(ny - origin.y),
              });
            }}
            onPointerUp={() => {
              setDrawing((current) => {
                if (current && current.w > 0.01 && current.h > 0.01) {
                  setBoxes((prev) => [...prev, current]);
                }
                return null;
              });
              drag.current = null;
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Redact preview" className="block w-full" />
            {[...boxes.filter((b) => b.page === previewPage), drawing].filter(Boolean).map((box, index) =>
              box ? (
                <div
                  key={`${box.x}-${box.y}-${index}`}
                  className="pointer-events-none absolute bg-black/80"
                  style={{
                    left: `${box.x * 100}%`,
                    top: `${box.y * 100}%`,
                    width: `${box.w * 100}%`,
                    height: `${box.h * 100}%`,
                  }}
                />
              ) : null,
            )}
          </div>
          <p className="text-sm text-[var(--ink-soft)]">{boxes.length} box{boxes.length === 1 ? "" : "es"} marked.</p>
        </div>
      ) : null}

      {kind === "spec" && file ? (
        <div className="card grid gap-4 p-6">
          <TargetSizeField value={specSize} unit={specUnit} onValue={setSpecSize} onUnit={setSpecUnit} />
          <p className="text-sm text-[var(--ink-soft)]">
            {file.name} · {formatBytes(file.size)}
            {pageCount ? ` · ${pageCount} pages` : ""}
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-end gap-4">
        {kind === "rotate" && !thumbs.length ? (
          <label className="grid gap-2 text-sm">
            Pages (blank = all)
            <input
              className="field min-w-44"
              value={range}
              placeholder="1-3, 5, 8"
              onChange={(event) => setRange(event.target.value)}
            />
          </label>
        ) : null}
        {kind === "rotate" ? (
          <div className="flex flex-wrap gap-2">
            {([90, 180, 270] as const).map((n) => (
              <button
                key={n}
                type="button"
                className={`btn min-h-10 px-3 ${angle === n ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setAngle(n)}
              >
                {n}°
              </button>
            ))}
          </div>
        ) : null}
        {kind === "sign" ? (
          <>
            <label className="grid gap-2 text-sm">
              Width · {signWidth} mm
              <input
                type="range"
                min={20}
                max={80}
                value={signWidth}
                onChange={(event) => setSignWidth(Number(event.target.value))}
              />
            </label>
            <select
              className="field min-w-40"
              value={corner}
              onChange={(event) => setCorner(event.target.value as typeof corner)}
            >
              <option value="br">Bottom right</option>
              <option value="bl">Bottom left</option>
              <option value="tr">Top right</option>
              <option value="tl">Top left</option>
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={allPages} onChange={(event) => setAllPages(event.target.checked)} />
              Every page
            </label>
          </>
        ) : null}
        {kind === "watermark" ? (
          <>
            <label className="grid gap-2 text-sm">
              Watermark text
              <input className="field min-w-52" value={markText} onChange={(event) => setMarkText(event.target.value)} />
            </label>
            <label className="grid gap-2 text-sm">
              Opacity · {markOpacity}%
              <input
                type="range"
                min={6}
                max={40}
                value={markOpacity}
                onChange={(event) => setMarkOpacity(Number(event.target.value))}
              />
            </label>
          </>
        ) : null}
        {kind === "pagesize" ? (
          <div className="flex flex-wrap gap-2">
            {(["a4", "letter", "legal"] as const).map((format) => (
              <button
                key={format}
                type="button"
                className={`btn min-h-10 px-3 ${pageFormat === format ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setPageFormat(format)}
              >
                {format === "a4" ? "A4" : format === "legal" ? "US Legal" : "US Letter"}
              </button>
            ))}
          </div>
        ) : null}
        {kind === "word" || kind === "excel" || kind === "csv" || kind === "text" ? (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={ocr} onChange={(event) => setOcr(event.target.checked)} />
            OCR scanned pages (English, on this device)
          </label>
        ) : null}
        <button
          type="button"
          className="btn btn-primary"
          disabled={
            !files.length ||
            busy ||
            (kind === "sign" && !signFile) ||
            (kind === "redact" && !boxes.length) ||
            (kind === "highlight" && !boxes.length) ||
            (kind === "crop" && !boxes.length) ||
            (kind === "watermark" && !markText.trim()) ||
            (kind === "insert" && !insertFiles.length) ||
            (kind === "compare" && files.length < 2)
          }
          onClick={run}
        >
          {busy ? "Working…" : actionLabel(kind)}
        </button>
        {files.length ? (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setFiles([]);
              setPreview("");
              setPageCount(null);
              setThumbs([]);
              setThumbsB([]);
              setKept([]);
              setSelected([]);
              setInsertFiles([]);
              setInsertThumbs([]);
              setBoxes([]);
            }}
          >
            Clear
          </button>
        ) : null}
      </div>
      {status ? <p className="text-sm text-[var(--ink-soft)]">{status}</p> : null}
      {error ? <p className="text-sm text-brand">{error}</p> : null}
      {preview ? (
        <pre className="card max-h-[420px] overflow-auto p-5 text-sm leading-6 whitespace-pre-wrap">{preview}</pre>
      ) : null}
    </div>
  );

  function move(index: number, dir: number) {
    setFiles((prev) => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  }
}

function baseName(file: File) {
  return file.name.replace(/\.[^.]+$/, "") || "document";
}

function actionLabel(kind: Kind) {
  if (kind === "merge") return "Merge PDFs";
  if (kind === "split") return "Split pages";
  if (kind === "extract") return "Download remaining pages";
  if (kind === "delete") return "Download remaining pages";
  if (kind === "organize") return "Download organized PDF";
  if (kind === "watermark") return "Stamp watermark";
  if (kind === "numbers") return "Add page numbers";
  if (kind === "crop") return "Crop PDF";
  if (kind === "highlight") return "Burn in highlights";
  if (kind === "grayscale") return "Download grayscale PDF";
  if (kind === "nup") return "Make 2-up PDF";
  if (kind === "insert") return "Insert images";
  if (kind === "reverse") return "Download reversed PDF";
  if (kind === "blanks") return "Download remaining pages";
  if (kind === "compare") return "Download side-by-side PDF";
  if (kind === "rotate") return "Rotate PDF";
  if (kind === "sign") return "Stamp signature";
  if (kind === "flatten") return "Flatten PDF";
  if (kind === "fill") return "Save filled PDF";
  if (kind === "redact") return "Burn in redactions";
  if (kind === "images") return "Download images";
  if (kind === "pagesize") return "Fit page size";
  if (kind === "spec") return "Check against cap";
  if (kind === "png") return "Download PNG";
  if (kind === "jpg") return "Download JPG";
  if (kind === "word") return "Download Word";
  if (kind === "excel") return "Download Excel";
  if (kind === "csv") return "Download CSV";
  if (kind === "meta") return "Strip metadata";
  return "Download text";
}
