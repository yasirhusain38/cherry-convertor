export type QrEcc = "L" | "M" | "Q" | "H";

export async function makeQrPng(
  text: string,
  size = 512,
  dark = "#221F1F",
  light = "#F5F5F1",
  ecc: QrEcc = "M",
  logo?: HTMLImageElement | ImageBitmap | null,
): Promise<Blob> {
  const QRCode = (await import("qrcode")).default;
  const dataUrl = await QRCode.toDataURL(text, {
    width: size,
    margin: 2,
    errorCorrectionLevel: ecc,
    color: { dark, light },
  });
  if (!logo) {
    const res = await fetch(dataUrl);
    return res.blob();
  }
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Could not draw QR."));
    img.src = dataUrl;
  });
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported.");
  ctx.drawImage(img, 0, 0, size, size);
  const box = Math.round(size * 0.18);
  const x = (size - box) / 2;
  ctx.fillStyle = light;
  ctx.fillRect(x - 4, x - 4, box + 8, box + 8);
  ctx.drawImage(logo, x, x, box, box);
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not encode QR."))), "image/png");
  });
}

export async function makeQrSvg(
  text: string,
  dark = "#221F1F",
  light = "#F5F5F1",
  ecc: QrEcc = "M",
): Promise<string> {
  const QRCode = (await import("qrcode")).default;
  return QRCode.toString(text, {
    type: "svg",
    margin: 2,
    errorCorrectionLevel: ecc,
    color: { dark, light },
  });
}

export type BarcodeFormatName = "CODE128" | "EAN13" | "EAN8" | "UPC" | "CODE39" | "ITF14" | "MSI" | "pharmacode";

export async function makeBarcodePng(
  value: string,
  format: BarcodeFormatName = "CODE128",
  width = 2,
  height = 120,
): Promise<Blob> {
  const JsBarcode = (await import("jsbarcode")).default;
  const canvas = document.createElement("canvas");
  JsBarcode(canvas, value, {
    format,
    width,
    height,
    displayValue: true,
    font: "system-ui, sans-serif",
    fontSize: 16,
    margin: 12,
    background: "#F5F5F1",
    lineColor: "#221F1F",
  });
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not encode barcode."))), "image/png");
  });
}

export type ScanHit = { text: string; format: string };

async function nativeDetect(bitmap: ImageBitmap): Promise<ScanHit[] | null> {
  const Detector = (window as unknown as { BarcodeDetector?: new (opts?: { formats?: string[] }) => { detect: (src: ImageBitmap) => Promise<Array<{ rawValue: string; format: string }>> } }).BarcodeDetector;
  if (!Detector) return null;
  try {
    const detector = new Detector();
    const found = await detector.detect(bitmap);
    return found.map((f) => ({ text: f.rawValue, format: f.format }));
  } catch {
    return null;
  }
}

export async function scanImageFile(file: File): Promise<ScanHit[]> {
  const bitmap = await createImageBitmap(file);
  try {
    const native = await nativeDetect(bitmap);
    if (native?.length) return native;

    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not supported.");
    ctx.drawImage(bitmap, 0, 0);
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const jsQR = (await import("jsqr")).default;
    const qr = jsQR(image.data, image.width, image.height);
    if (qr?.data) return [{ text: qr.data, format: "QR_CODE" }];

    const { BrowserMultiFormatReader } = await import("@zxing/browser");
    const reader = new BrowserMultiFormatReader();
    const url = canvas.toDataURL("image/png");
    try {
      const result = await reader.decodeFromImageUrl(url);
      return [{ text: result.getText(), format: result.getBarcodeFormat()?.toString?.() || "code" }];
    } catch {
      return [];
    }
  } finally {
    bitmap.close();
  }
}

export async function scanImageData(data: ImageData): Promise<ScanHit[]> {
  const jsQR = (await import("jsqr")).default;
  const qr = jsQR(data.data, data.width, data.height);
  if (qr?.data) return [{ text: qr.data, format: "QR_CODE" }];
  return [];
}
