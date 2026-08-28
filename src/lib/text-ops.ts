export type TextStats = {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  readingMinutes: number;
};

export function textStats(input: string): TextStats {
  const characters = input.length;
  const charactersNoSpaces = input.replace(/\s/g, "").length;
  const words = input.trim() ? input.trim().split(/\s+/).length : 0;
  const sentences = input.trim() ? (input.match(/[.!?]+(?:\s|$)/g) ?? [input.trim()]).length : 0;
  const paragraphs = input.trim() ? input.trim().split(/\n\s*\n/).filter((p) => p.trim()).length : 0;
  const lines = input ? input.split(/\n/).length : 0;
  const readingMinutes = words / 200;
  return { characters, charactersNoSpaces, words, sentences, paragraphs, lines, readingMinutes };
}

export type CaseMode = "upper" | "lower" | "title" | "sentence" | "camel" | "snake" | "kebab";

export function convertCase(input: string, mode: CaseMode): string {
  if (mode === "upper") return input.toUpperCase();
  if (mode === "lower") return input.toLowerCase();
  if (mode === "title") {
    return input.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  }
  if (mode === "sentence") {
    return input
      .toLowerCase()
      .replace(/(^\s*[a-z])|([.!?]\s+[a-z])/g, (m) => m.toUpperCase());
  }
  if (mode === "camel") {
    const parts = slugParts(input);
    return parts.map((p, i) => (i === 0 ? p : p.charAt(0).toUpperCase() + p.slice(1))).join("");
  }
  if (mode === "snake") return slugParts(input).join("_");
  return slugParts(input).join("-");
}

function slugParts(input: string): string[] {
  return input
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .toLowerCase()
    .split(/[\s_-]+/)
    .filter(Boolean);
}

export function toSlug(input: string): string {
  return slugParts(input).join("-");
}

export function removeDuplicateLines(input: string, ignoreCase = false): string {
  const seen = new Set<string>();
  const lines = input.split(/\n/);
  const out: string[] = [];
  for (const line of lines) {
    const key = ignoreCase ? line.trim().toLowerCase() : line.trim();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(line);
  }
  return out.join("\n");
}

export function removeExtraSpaces(input: string): string {
  return input
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function sortLines(input: string, descending = false, unique = false): string {
  let lines = input.split(/\n/);
  lines = [...lines].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base", numeric: true }));
  if (descending) lines.reverse();
  if (unique) {
    const seen = new Set<string>();
    lines = lines.filter((line) => {
      const key = line.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  return lines.join("\n");
}

export function reverseText(input: string, mode: "chars" | "words" | "lines"): string {
  if (mode === "lines") return input.split(/\n/).reverse().join("\n");
  if (mode === "words") {
    return input
      .split(/\n/)
      .map((line) => line.split(/\s+/).reverse().join(" "))
      .join("\n");
  }
  return [...input].reverse().join("");
}

export function urlCodec(input: string, decode: boolean): string {
  try {
    return decode ? decodeURIComponent(input.replace(/\+/g, " ")) : encodeURIComponent(input);
  } catch {
    throw new Error("That string is not valid percent-encoding.");
  }
}

export function base64Codec(input: string, decode: boolean): string {
  const bytesToB64 = (bytes: Uint8Array) => {
    let bin = "";
    bytes.forEach((b) => {
      bin += String.fromCharCode(b);
    });
    return btoa(bin);
  };
  const b64ToBytes = (b64: string) => {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
    return out;
  };
  if (!decode) {
    return bytesToB64(new TextEncoder().encode(input));
  }
  const clean = input.replace(/\s/g, "");
  try {
    return new TextDecoder().decode(b64ToBytes(clean));
  } catch {
    throw new Error("That is not valid Base64.");
  }
}

export function formatJson(input: string, indent = 2): string {
  return JSON.stringify(JSON.parse(input), null, indent);
}

export function validateJson(input: string): { ok: true } | { ok: false; message: string } {
  try {
    JSON.parse(input);
    return { ok: true };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Invalid JSON" };
  }
}

export function formatMarkup(input: string, kind: "xml" | "html"): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  const parser = new DOMParser();
  const mime = kind === "html" ? "text/html" : "application/xml";
  const doc = parser.parseFromString(kind === "html" ? trimmed : trimmed, mime);
  const err = doc.querySelector("parsererror");
  if (kind === "xml" && err) {
    throw new Error(err.textContent?.replace(/\s+/g, " ").trim() || "Invalid XML");
  }
  const raw = kind === "html" ? doc.documentElement.outerHTML : new XMLSerializer().serializeToString(doc);
  return prettyMarkup(raw);
}

function prettyMarkup(xml: string): string {
  const collapsed = xml.replace(/>\s+</g, "><").trim();
  let indent = 0;
  const lines: string[] = [];
  collapsed.replace(/<!--[\s\S]*?-->|<[^>]+>|[^<]+/g, (token) => {
    const isClose = /^<\//.test(token);
    const isVoid = /\/>$/.test(token) || /^<(br|hr|img|input|meta|link|source|area|col|embed|wbr)\b/i.test(token);
    const isComment = /^<!--/.test(token);
    const isOpen = /^<[^/!]/.test(token) && !isVoid;
    if (isClose) indent = Math.max(0, indent - 1);
    lines.push(`${"  ".repeat(indent)}${token.trim()}`);
    if (isOpen && !isClose && !isComment) indent += 1;
    return token;
  });
  return lines.filter((l) => l.trim()).join("\n");
}

export function minifyHtml(input: string): string {
  return input
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/>\s+</g, "><")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function minifyCss(input: string): string {
  return input
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,>~+])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
}

export function minifyJs(input: string): string {
  return input
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:\\])\/\/.*$/gm, "$1")
    .replace(/\s+/g, " ")
    .replace(/\s*([=+\-*/<>{}();,:?|&!])\s*/g, "$1")
    .trim();
}

export function markdownToHtml(input: string): string {
  const lines = input.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let inCode = false;
  let inUl = false;
  let inOl = false;
  const closeLists = () => {
    if (inUl) {
      out.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      out.push("</ol>");
      inOl = false;
    }
  };
  const inline = (s: string) =>
    escHtml(s)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" rel="noopener noreferrer">$1</a>');

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCode) {
        out.push("</code></pre>");
        inCode = false;
      } else {
        closeLists();
        out.push("<pre><code>");
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      out.push(`${escHtml(line)}\n`);
      continue;
    }
    if (/^\s*$/.test(line)) {
      closeLists();
      continue;
    }
    if (/^#{1,6}\s/.test(line)) {
      closeLists();
      const n = line.match(/^#+/)![0].length;
      out.push(`<h${n}>${inline(line.replace(/^#{1,6}\s/, ""))}</h${n}>`);
      continue;
    }
    if (/^>\s?/.test(line)) {
      closeLists();
      out.push(`<blockquote><p>${inline(line.replace(/^>\s?/, ""))}</p></blockquote>`);
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      if (inOl) {
        out.push("</ol>");
        inOl = false;
      }
      if (!inUl) {
        out.push("<ul>");
        inUl = true;
      }
      out.push(`<li>${inline(line.replace(/^[-*]\s+/, ""))}</li>`);
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      if (inUl) {
        out.push("</ul>");
        inUl = false;
      }
      if (!inOl) {
        out.push("<ol>");
        inOl = true;
      }
      out.push(`<li>${inline(line.replace(/^\d+\.\s+/, ""))}</li>`);
      continue;
    }
    closeLists();
    if (/^---+$/.test(line.trim())) {
      out.push("<hr/>");
      continue;
    }
    out.push(`<p>${inline(line)}</p>`);
  }
  closeLists();
  if (inCode) out.push("</code></pre>");
  return out.join("\n");
}

function escHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
