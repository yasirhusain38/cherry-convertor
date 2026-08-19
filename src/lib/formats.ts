export type FormatGroup = "Image" | "Document" | "Icon" | "Audio" | "Video" | "Archive" | "Office";

export type ConvertFormat = {
  id: string;
  label: string;
  ext: string;
  mime: string;
  group: FormatGroup;
  aliases: string[];
  supported: boolean;
  note?: string;
};

export const CONVERT_FORMATS: ConvertFormat[] = [
  {
    id: "jpeg",
    label: "JPG / JPEG",
    ext: "jpg",
    mime: "image/jpeg",
    group: "Image",
    aliases: ["jpg", "jpeg", "jpe", "jfif", "photo"],
    supported: true,
  },
  {
    id: "png",
    label: "PNG",
    ext: "png",
    mime: "image/png",
    group: "Image",
    aliases: ["png", "transparent"],
    supported: true,
  },
  {
    id: "webp",
    label: "WebP",
    ext: "webp",
    mime: "image/webp",
    group: "Image",
    aliases: ["webp", "web"],
    supported: true,
  },
  {
    id: "bmp",
    label: "BMP",
    ext: "bmp",
    mime: "image/bmp",
    group: "Image",
    aliases: ["bmp", "bitmap"],
    supported: true,
  },
  {
    id: "gif",
    label: "GIF",
    ext: "gif",
    mime: "image/gif",
    group: "Image",
    aliases: ["gif"],
    supported: true,
    note: "Still frame — browsers do not encode animation here.",
  },
  {
    id: "avif",
    label: "AVIF",
    ext: "avif",
    mime: "image/avif",
    group: "Image",
    aliases: ["avif", "av1"],
    supported: true,
    note: "Depends on this browser’s encoder.",
  },
  {
    id: "svg",
    label: "SVG",
    ext: "svg",
    mime: "image/svg+xml",
    group: "Image",
    aliases: ["svg", "vector"],
    supported: true,
    note: "Wraps the photo in an SVG — not a traced vector.",
  },
  {
    id: "ico",
    label: "ICO",
    ext: "ico",
    mime: "image/x-icon",
    group: "Icon",
    aliases: ["ico", "icon", "favicon"],
    supported: true,
  },
  {
    id: "pdf",
    label: "PDF",
    ext: "pdf",
    mime: "application/pdf",
    group: "Document",
    aliases: ["pdf", "document"],
    supported: true,
  },
  {
    id: "tiff",
    label: "TIFF",
    ext: "tiff",
    mime: "image/tiff",
    group: "Image",
    aliases: ["tif", "tiff"],
    supported: false,
    note: "No browser TIFF encoder.",
  },
  {
    id: "heic",
    label: "HEIC",
    ext: "heic",
    mime: "image/heic",
    group: "Image",
    aliases: ["heic", "heif", "iphone"],
    supported: false,
    note: "We can read HEIC, but not write it.",
  },
  {
    id: "docx",
    label: "Word (DOCX)",
    ext: "docx",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    group: "Office",
    aliases: ["doc", "docx", "word"],
    supported: false,
  },
  {
    id: "xlsx",
    label: "Excel (XLSX)",
    ext: "xlsx",
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    group: "Office",
    aliases: ["xls", "xlsx", "excel", "spreadsheet"],
    supported: false,
  },
  {
    id: "pptx",
    label: "PowerPoint (PPTX)",
    ext: "pptx",
    mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    group: "Office",
    aliases: ["ppt", "pptx", "powerpoint"],
    supported: false,
  },
  {
    id: "csv",
    label: "CSV",
    ext: "csv",
    mime: "text/csv",
    group: "Office",
    aliases: ["csv"],
    supported: false,
  },
  {
    id: "mp3",
    label: "MP3",
    ext: "mp3",
    mime: "audio/mpeg",
    group: "Audio",
    aliases: ["mp3", "audio"],
    supported: false,
  },
  {
    id: "wav",
    label: "WAV",
    ext: "wav",
    mime: "audio/wav",
    group: "Audio",
    aliases: ["wav"],
    supported: false,
  },
  {
    id: "mp4",
    label: "MP4",
    ext: "mp4",
    mime: "video/mp4",
    group: "Video",
    aliases: ["mp4", "video"],
    supported: false,
  },
  {
    id: "webm",
    label: "WebM",
    ext: "webm",
    mime: "video/webm",
    group: "Video",
    aliases: ["webm"],
    supported: false,
  },
  {
    id: "mov",
    label: "MOV",
    ext: "mov",
    mime: "video/quicktime",
    group: "Video",
    aliases: ["mov", "quicktime"],
    supported: false,
  },
  {
    id: "zip",
    label: "ZIP",
    ext: "zip",
    mime: "application/zip",
    group: "Archive",
    aliases: ["zip"],
    supported: false,
  },
  {
    id: "html",
    label: "HTML",
    ext: "html",
    mime: "text/html",
    group: "Document",
    aliases: ["html", "htm", "webpage"],
    supported: true,
    note: "Wraps the image in a single HTML file.",
  },
  {
    id: "json",
    label: "JSON",
    ext: "json",
    mime: "application/json",
    group: "Document",
    aliases: ["json", "data"],
    supported: true,
    note: "Width, height, and a data URL.",
  },
  {
    id: "txt",
    label: "Base64 TXT",
    ext: "txt",
    mime: "text/plain",
    group: "Document",
    aliases: ["txt", "text", "base64"],
    supported: true,
  },
  {
    id: "md",
    label: "Markdown",
    ext: "md",
    mime: "text/markdown",
    group: "Document",
    aliases: ["md", "markdown"],
    supported: true,
  },
  {
    id: "psd",
    label: "Photoshop (PSD)",
    ext: "psd",
    mime: "image/vnd.adobe.photoshop",
    group: "Image",
    aliases: ["psd", "photoshop"],
    supported: false,
  },
  {
    id: "raw",
    label: "RAW",
    ext: "raw",
    mime: "image/x-raw",
    group: "Image",
    aliases: ["raw", "cr2", "nef", "arw"],
    supported: false,
  },
  {
    id: "eps",
    label: "EPS",
    ext: "eps",
    mime: "application/postscript",
    group: "Image",
    aliases: ["eps", "ai", "illustrator"],
    supported: false,
  },
  {
    id: "odt",
    label: "OpenDocument Text",
    ext: "odt",
    mime: "application/vnd.oasis.opendocument.text",
    group: "Office",
    aliases: ["odt", "opendocument"],
    supported: false,
  },
  {
    id: "rtf",
    label: "RTF",
    ext: "rtf",
    mime: "application/rtf",
    group: "Document",
    aliases: ["rtf"],
    supported: false,
  },
  {
    id: "aac",
    label: "AAC",
    ext: "aac",
    mime: "audio/aac",
    group: "Audio",
    aliases: ["aac", "m4a"],
    supported: false,
  },
  {
    id: "flac",
    label: "FLAC",
    ext: "flac",
    mime: "audio/flac",
    group: "Audio",
    aliases: ["flac"],
    supported: false,
  },
  {
    id: "ogg",
    label: "OGG",
    ext: "ogg",
    mime: "audio/ogg",
    group: "Audio",
    aliases: ["ogg", "oga"],
    supported: false,
  },
  {
    id: "avi",
    label: "AVI",
    ext: "avi",
    mime: "video/x-msvideo",
    group: "Video",
    aliases: ["avi"],
    supported: false,
  },
  {
    id: "mkv",
    label: "MKV",
    ext: "mkv",
    mime: "video/x-matroska",
    group: "Video",
    aliases: ["mkv"],
    supported: false,
  },
  {
    id: "wmv",
    label: "WMV",
    ext: "wmv",
    mime: "video/x-ms-wmv",
    group: "Video",
    aliases: ["wmv"],
    supported: false,
  },
  {
    id: "7z",
    label: "7z",
    ext: "7z",
    mime: "application/x-7z-compressed",
    group: "Archive",
    aliases: ["7z"],
    supported: false,
  },
  {
    id: "rar",
    label: "RAR",
    ext: "rar",
    mime: "application/vnd.rar",
    group: "Archive",
    aliases: ["rar"],
    supported: false,
  },
];

export function getFormat(id: string): ConvertFormat | undefined {
  return CONVERT_FORMATS.find((item) => item.id === id);
}

export function searchFormats(query: string): ConvertFormat[] {
  const q = query.trim().toLowerCase();
  const list = !q
    ? CONVERT_FORMATS
    : CONVERT_FORMATS.filter((item) => {
        const hay = [item.id, item.label, item.ext, item.group, ...item.aliases]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
  return [...list].sort((a, b) => Number(b.supported) - Number(a.supported));
}

export function detectInputLabel(file: File): string {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  if (type.includes("heic") || name.endsWith(".heic") || name.endsWith(".heif")) return "HEIC";
  if (type.includes("png") || name.endsWith(".png")) return "PNG";
  if (type.includes("webp") || name.endsWith(".webp")) return "WebP";
  if (type.includes("gif") || name.endsWith(".gif")) return "GIF";
  if (type.includes("bmp") || name.endsWith(".bmp")) return "BMP";
  if (type.includes("svg") || name.endsWith(".svg")) return "SVG";
  if (type.includes("avif") || name.endsWith(".avif")) return "AVIF";
  if (type.includes("pdf") || name.endsWith(".pdf")) return "PDF";
  if (type.includes("jpeg") || type.includes("jpg") || /\.jpe?g$/.test(name)) return "JPEG";
  return file.type || "Unknown";
}
