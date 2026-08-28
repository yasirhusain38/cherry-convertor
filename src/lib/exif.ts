export type ExifField = { label: string; value: string; group: string };

function readU16(view: DataView, offset: number, le: boolean): number {
  return le ? view.getUint16(offset, true) : view.getUint16(offset, false);
}

function readU32(view: DataView, offset: number, le: boolean): number {
  return le ? view.getUint32(offset, true) : view.getUint32(offset, false);
}

const TYPE_SIZE = [0, 1, 1, 2, 4, 8, 1, 1, 2, 4, 8, 4, 8];

const TAGS: Record<number, string> = {
  0x010f: "Make",
  0x0110: "Model",
  0x0112: "Orientation",
  0x011a: "XResolution",
  0x011b: "YResolution",
  0x0128: "ResolutionUnit",
  0x0131: "Software",
  0x0132: "DateTime",
  0x013e: "WhitePoint",
  0x0213: "YCbCrPositioning",
  0x829a: "ExposureTime",
  0x829d: "FNumber",
  0x8822: "ExposureProgram",
  0x8827: "ISO",
  0x9003: "DateTimeOriginal",
  0x9004: "DateTimeDigitized",
  0x9201: "ShutterSpeedValue",
  0x9202: "ApertureValue",
  0x9204: "ExposureBias",
  0x9207: "MeteringMode",
  0x9209: "Flash",
  0x920a: "FocalLength",
  0xa002: "PixelXDimension",
  0xa003: "PixelYDimension",
  0xa403: "WhiteBalance",
  0xa406: "SceneCaptureType",
  0x010e: "ImageDescription",
  0x8298: "Copyright",
  0x013b: "Artist",
  0x8769: "ExifIFD",
  0x8825: "GPSIFD",
  0x0001: "GPSLatitudeRef",
  0x0002: "GPSLatitude",
  0x0003: "GPSLongitudeRef",
  0x0004: "GPSLongitude",
  0x0006: "GPSAltitude",
  0x0007: "GPSTimeStamp",
};

function formatValue(tag: number, type: number, count: number, payload: number, view: DataView, tiff: number, le: boolean): string | null {
  const size = TYPE_SIZE[type] ?? 1;
  const nbytes = size * count;
  let offset = payload;
  if (nbytes <= 4) {
    offset = -1;
  }
  const at = offset === -1 ? 0 : tiff + offset;

  const u8 = (i: number) => view.getUint8(offset === -1 ? 0 : at + i);
  const readOne = (i: number): number => {
    const o = offset === -1 ? 0 : at + i * size;
    if (offset === -1) {
      if (type === 3) return le ? (payload >> (16 * i)) & 0xffff : (payload >> (16 * (1 - i))) & 0xffff;
      if (type === 4) return payload;
      if (type === 1 || type === 7) return (payload >> (8 * (le ? i : 3 - i))) & 0xff;
    }
    if (type === 3) return readU16(view, o, le);
    if (type === 4) return readU32(view, o, le);
    if (type === 9) return le ? view.getInt32(o, true) : view.getInt32(o, false);
    if (type === 1 || type === 7) return view.getUint8(o);
    return 0;
  };

  const rational = (i: number) => {
    const o = tiff + (offset === -1 ? 0 : offset) + i * 8;
    const n = readU32(view, o, le);
    const d = readU32(view, o + 4, le) || 1;
    return n / d;
  };

  if (type === 2) {
    const chars: number[] = [];
    if (nbytes <= 4) {
      for (let i = 0; i < count - 1; i += 1) chars.push((payload >> (8 * (le ? i : 3 - i))) & 0xff);
    } else {
      for (let i = 0; i < count - 1; i += 1) chars.push(view.getUint8(at + i));
    }
    return String.fromCharCode(...chars.filter((c) => c >= 32)).trim() || null;
  }

  if (tag === 0x0002 || tag === 0x0004) {
    if (count >= 3 && nbytes > 4) {
      const d = [rational(0), rational(1), rational(2)];
      const deg = d[0] + d[1] / 60 + d[2] / 3600;
      return deg.toFixed(6);
    }
  }

  if (type === 5 || type === 10) {
    if (nbytes > 4) {
      const n = readU32(view, at, le);
      const d = readU32(view, at + 4, le) || 1;
      if (tag === 0x829a) return d ? `1/${Math.round(d / Math.max(n, 1))}` : String(n);
      if (tag === 0x829d || tag === 0x920a) return (n / d).toFixed(1);
      return d === 1 ? String(n) : `${n}/${d}`;
    }
  }

  if (type === 3 || type === 4 || type === 1) {
    const v = readOne(0);
    if (tag === 0x0112) {
      return { 1: "Normal", 3: "Rotate 180", 6: "Rotate 90 CW", 8: "Rotate 90 CCW" }[v] ?? String(v);
    }
    return String(v);
  }

  void u8;
  return null;
}

function readIfd(
  view: DataView,
  tiff: number,
  ifd: number,
  le: boolean,
  group: string,
  out: ExifField[],
  depth = 0,
): void {
  if (depth > 3) return;
  if (ifd + 2 > view.byteLength) return;
  const count = readU16(view, ifd, le);
  for (let i = 0; i < count; i += 1) {
    const entry = ifd + 2 + i * 12;
    if (entry + 12 > view.byteLength) break;
    const tag = readU16(view, entry, le);
    const type = readU16(view, entry + 2, le);
    const num = readU32(view, entry + 4, le);
    const payload = readU32(view, entry + 8, le);
    if (tag === 0x8769 || tag === 0x8825) {
      readIfd(view, tiff, tiff + payload, le, tag === 0x8825 ? "GPS" : "Camera", out, depth + 1);
      continue;
    }
    const label = TAGS[tag];
    if (!label) continue;
    try {
      const value = formatValue(tag, type, num, payload, view, tiff, le);
      if (value) out.push({ label, value, group: tag <= 7 ? "GPS" : group });
    } catch {
      /* skip malformed tag */
    }
  }
}

export function readJpegExif(buffer: ArrayBuffer): ExifField[] {
  const bytes = new Uint8Array(buffer);
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return [];
  let i = 2;
  while (i + 4 < bytes.length) {
    if (bytes[i] !== 0xff) break;
    const marker = bytes[i + 1];
    const size = (bytes[i + 2] << 8) | bytes[i + 3];
    if (marker === 0xda) break;
    if (marker === 0xe1) {
      const start = i + 4;
      const head = String.fromCharCode(bytes[start], bytes[start + 1], bytes[start + 2], bytes[start + 3]);
      if (head === "Exif") {
        const tiff = start + 6;
        const view = new DataView(buffer);
        const le = view.getUint16(tiff) === 0x4949;
        const ifd0 = tiff + readU32(view, tiff + 4, le);
        const fields: ExifField[] = [];
        readIfd(view, tiff, ifd0, le, "Image", fields);
        return fields;
      }
    }
    i += 2 + size;
  }
  return [];
}

export function stripJpegMetadata(buffer: ArrayBuffer): ArrayBuffer | null {
  const bytes = new Uint8Array(buffer);
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  const out: number[] = [0xff, 0xd8];
  let i = 2;
  while (i + 1 < bytes.length) {
    if (bytes[i] !== 0xff) {
      out.push(...bytes.subarray(i));
      break;
    }
    const marker = bytes[i + 1];
    if (marker === 0xda) {
      out.push(...bytes.subarray(i));
      break;
    }
    if (marker === 0xd9) {
      out.push(0xff, 0xd9);
      break;
    }
    if (marker === 0x00 || marker === 0xff) {
      out.push(bytes[i]);
      i += 1;
      continue;
    }
    if (i + 3 >= bytes.length) break;
    const size = (bytes[i + 2] << 8) | bytes[i + 3];
    const drop = marker >= 0xe1 && marker <= 0xef || marker === 0xfe;
    if (!drop) {
      out.push(...bytes.subarray(i, i + 2 + size));
    }
    i += 2 + size;
  }
  return new Uint8Array(out).buffer;
}

export async function readFileExif(file: File): Promise<{ fields: ExifField[]; note: string }> {
  const buffer = await file.arrayBuffer();
  const jpeg = readJpegExif(buffer);
  if (jpeg.length) return { fields: jpeg, note: "Read from the JPEG APP1 Exif segment. GPS is shown if the camera stored it." };
  return {
    fields: [
      { label: "File name", value: file.name, group: "File" },
      { label: "Type", value: file.type || "unknown", group: "File" },
      { label: "Bytes", value: String(file.size), group: "File" },
      { label: "Last modified", value: file.lastModified ? new Date(file.lastModified).toISOString() : "—", group: "File" },
    ],
    note: file.type.includes("jpeg") || file.name.toLowerCase().endsWith(".jpg")
      ? "No Exif segment in this JPEG."
      : "PNG/WebP/HEIC viewers here show file facts. Camera Exif is read from JPEG.",
  };
}
