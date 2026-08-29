import { PDFDocument } from "pdf-lib";

export async function stripPdfMetadata(file: File): Promise<Blob> {
  const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true, updateMetadata: false });
  doc.setTitle("");
  doc.setAuthor("");
  doc.setSubject("");
  doc.setKeywords([]);
  doc.setProducer("Cherry Converter");
  doc.setCreator("Cherry Converter");
  doc.setCreationDate(new Date(0));
  doc.setModificationDate(new Date(0));
  try {
    const ctx = (doc as unknown as { context: { trailerInfo: { Info?: unknown } } }).context;
    if (ctx?.trailerInfo) ctx.trailerInfo.Info = undefined;
  } catch {
    /* older pdf-lib */
  }
  const bytes = await doc.save({ useObjectStreams: false });
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return new Blob([copy], { type: "application/pdf" });
}
