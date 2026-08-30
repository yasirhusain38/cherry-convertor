import type { MediaItem, MediaKind } from "./types";

export type MediaSpec = { mime: string; kind: MediaKind; format: string };

export const EXT_MIME: Record<string, MediaSpec> = {
  mp4: { mime: "video/mp4", kind: "video", format: "mp4" },
  m4v: { mime: "video/mp4", kind: "video", format: "m4v" },
  webm: { mime: "video/webm", kind: "video", format: "webm" },
  mov: { mime: "video/quicktime", kind: "video", format: "mov" },
  mkv: { mime: "video/x-matroska", kind: "video", format: "mkv" },
  avi: { mime: "video/x-msvideo", kind: "video", format: "avi" },
  ogv: { mime: "video/ogg", kind: "video", format: "ogv" },
  mp3: { mime: "audio/mpeg", kind: "audio", format: "mp3" },
  m4a: { mime: "audio/mp4", kind: "audio", format: "m4a" },
  aac: { mime: "audio/aac", kind: "audio", format: "aac" },
  wav: { mime: "audio/wav", kind: "audio", format: "wav" },
  flac: { mime: "audio/flac", kind: "audio", format: "flac" },
  ogg: { mime: "audio/ogg", kind: "audio", format: "ogg" },
  oga: { mime: "audio/ogg", kind: "audio", format: "ogg" },
  opus: { mime: "audio/opus", kind: "audio", format: "opus" },
  jpg: { mime: "image/jpeg", kind: "image", format: "jpg" },
  jpeg: { mime: "image/jpeg", kind: "image", format: "jpg" },
  png: { mime: "image/png", kind: "image", format: "png" },
  webp: { mime: "image/webp", kind: "image", format: "webp" },
  avif: { mime: "image/avif", kind: "image", format: "avif" },
  gif: { mime: "image/gif", kind: "image", format: "gif" },
  pdf: { mime: "application/pdf", kind: "document", format: "pdf" },
};

export const ALLOWED_MIME = new Set(Object.values(EXT_MIME).map((x) => x.mime));

export function extOf(url: URL): string | null {
  const path = url.pathname.toLowerCase().replace(/\/+$/, "");
  const m = path.match(/\.([a-z0-9]{2,5})$/);
  return m ? m[1]! : null;
}

export function contentType(headers: Headers): string {
  return (headers.get("content-type") ?? "").split(";")[0]!.trim().toLowerCase();
}

export function contentLength(headers: Headers): number | null {
  const len = headers.get("content-length");
  if (!len) return null;
  const n = Number(len);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function contentRangeTotal(headers: Headers): number | null {
  const cr = headers.get("content-range");
  const m = cr?.match(/\/(\d+)\s*$/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

export function fileSizeFromHeaders(headers: Headers, status: number): number | null {
  if (status === 206) return contentRangeTotal(headers);
  return contentLength(headers);
}

export function isHtmlMime(mime: string): boolean {
  return mime.startsWith("text/html") || mime === "application/xhtml+xml";
}

export function isJsonMime(mime: string): boolean {
  return mime.includes("json") && !mime.startsWith("image/") && !mime.startsWith("video/") && !mime.startsWith("audio/");
}

export function isStreamingMime(mime: string): boolean {
  return mime.includes("mpegurl") || mime.includes("dash+xml") || mime === "application/vnd.apple.mpegurl";
}

export function isStreamingUrl(url: URL): boolean {
  const path = url.pathname.toLowerCase();
  return path.endsWith(".m3u8") || path.endsWith(".mpd") || path.endsWith(".m3u") || path.includes(".m3u8");
}

export function looksLikeHtml(bytes: Uint8Array): boolean {
  const head = new TextDecoder("utf-8", { fatal: false }).decode(bytes.subarray(0, 256)).trimStart().toLowerCase();
  return head.startsWith("<!doctype") || head.startsWith("<html") || head.startsWith("<?xml") || head.includes("<meta");
}

export function classifyMime(mime: string | undefined | null): MediaSpec | null {
  if (!mime) return null;
  const m = mime.split(";")[0]!.trim().toLowerCase();
  if (!m || isStreamingMime(m) || isHtmlMime(m) || isJsonMime(m)) return null;
  for (const spec of Object.values(EXT_MIME)) {
    if (spec.mime === m) return { ...spec, mime: m };
  }
  if (m === "application/mp4" || m === "video/3gpp") {
    return { mime: m === "video/3gpp" ? m : "video/mp4", kind: "video", format: "mp4" };
  }
  if (m.startsWith("video/")) {
    const format = m.includes("webm")
      ? "webm"
      : m.includes("quicktime") || m.includes("mov")
        ? "mov"
        : m.includes("ogg")
          ? "ogv"
          : m.includes("avi")
            ? "avi"
            : m.includes("matroska")
              ? "mkv"
              : "mp4";
    return { mime: m, kind: "video", format };
  }
  if (m.startsWith("audio/")) {
    const format = m.includes("wav")
      ? "wav"
      : m.includes("flac")
        ? "flac"
        : m.includes("mpeg") || m.includes("mp3")
          ? "mp3"
          : m.includes("aac")
            ? "aac"
            : m.includes("ogg") || m.includes("opus")
              ? "ogg"
              : "m4a";
    return { mime: m, kind: "audio", format };
  }
  if (m.startsWith("image/")) {
    const format = m.includes("png")
      ? "png"
      : m.includes("webp")
        ? "webp"
        : m.includes("gif")
          ? "gif"
          : m.includes("avif")
            ? "avif"
            : "jpg";
    return { mime: m, kind: "image", format };
  }
  if (m === "application/pdf") return { mime: m, kind: "document", format: "pdf" };
  return null;
}

export function sniffMedia(bytes: Uint8Array): MediaSpec | null {
  if (bytes.length < 12) return null;
  if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
    const brand = String.fromCharCode(bytes[8]!, bytes[9]!, bytes[10]!, bytes[11]!);
    if (brand.startsWith("qt")) return { mime: "video/quicktime", kind: "video", format: "mov" };
    if (brand === "M4A " || brand.startsWith("mp3")) return { mime: "audio/mp4", kind: "audio", format: "m4a" };
    return { mime: "video/mp4", kind: "video", format: "mp4" };
  }
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) {
    return { mime: "video/webm", kind: "video", format: "webm" };
  }
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return { mime: "image/png", kind: "image", format: "png" };
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mime: "image/jpeg", kind: "image", format: "jpg" };
  }
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return { mime: "image/gif", kind: "image", format: "gif" };
  }
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { mime: "image/webp", kind: "image", format: "webp" };
  }
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return { mime: "application/pdf", kind: "document", format: "pdf" };
  }
  if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
    return { mime: "audio/mpeg", kind: "audio", format: "mp3" };
  }
  if (bytes[0] === 0xff && (bytes[1]! & 0xe0) === 0xe0) {
    return { mime: "audio/mpeg", kind: "audio", format: "mp3" };
  }
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x41 &&
    bytes[10] === 0x56 &&
    bytes[11] === 0x45
  ) {
    return { mime: "audio/wav", kind: "audio", format: "wav" };
  }
  return null;
}

export function item(partial: Omit<MediaItem, "id"> & { id?: string }): MediaItem {
  return { id: partial.id ?? crypto.randomUUID(), ...partial };
}
