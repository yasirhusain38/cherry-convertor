export type HtmlSignals = {
  title?: string;
  image?: string;
  videos: string[];
  audios: string[];
  images: string[];
};

export function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)));
}

function attr(tag: string, name: string): string | undefined {
  const quoted = tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i"));
  if (quoted) return decodeHtml(quoted[1]!.trim());
  const bare = tag.match(new RegExp(`\\b${name}\\s*=\\s*([^\\s>]+)`, "i"));
  return bare ? decodeHtml(bare[1]!.trim()) : undefined;
}

function absUrl(href: string, base: string): string | null {
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith("blob:") || trimmed.startsWith("data:") || trimmed.startsWith("javascript:")) {
    return null;
  }
  try {
    const url = new URL(trimmed, base);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function pushUnique(list: string[], url: string | null) {
  if (!url) return;
  if (!list.includes(url)) list.push(url);
}

function stripNoise(html: string): string {
  return html.replace(/<script\b[\s\S]*?<\/script>/gi, " ").replace(/<!--[\s\S]*?-->/g, " ");
}

function walkJsonLd(node: unknown, acc: HtmlSignals, base: string) {
  if (Array.isArray(node)) {
    for (const child of node) walkJsonLd(child, acc, base);
    return;
  }
  if (!node || typeof node !== "object") return;
  const rec = node as Record<string, unknown>;
  if (rec["@graph"]) walkJsonLd(rec["@graph"], acc, base);

  const rawType = rec["@type"];
  const types = (Array.isArray(rawType) ? rawType : [rawType]).map((t) => String(t ?? "").toLowerCase());
  const isVideo = types.some((t) => t.includes("videoobject"));
  const isAudio = types.some((t) => t.includes("audioobject"));
  const isImage = types.some((t) => t.includes("imageobject"));

  const content = typeof rec.contentUrl === "string" ? absUrl(rec.contentUrl, base) : null;
  if (content) {
    if (isVideo) pushUnique(acc.videos, content);
    else if (isAudio) pushUnique(acc.audios, content);
    else if (isImage) pushUnique(acc.images, content);
    else pushUnique(acc.videos, content);
  }

  const thumbs = rec.thumbnailUrl;
  if (typeof thumbs === "string") pushUnique(acc.images, absUrl(thumbs, base));
  else if (Array.isArray(thumbs)) {
    for (const t of thumbs) {
      if (typeof t === "string") pushUnique(acc.images, absUrl(t, base));
    }
  }

  if (typeof rec.embedUrl === "string") {
    /* embed pages are not files — skip */
  }
}

export function parseHtmlSignals(html: string, baseUrl: string): HtmlSignals {
  const acc: HtmlSignals = { videos: [], audios: [], images: [] };
  const ogVideos: string[] = [];
  const ogAudios: string[] = [];
  let ogVideoType = "";
  let ogAudioType = "";

  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0]!;
    const prop = (attr(tag, "property") || attr(tag, "name") || "").toLowerCase();
    const content = attr(tag, "content");
    if (!prop || !content) continue;
    if (prop === "og:title" && !acc.title) acc.title = content;
    if (prop === "og:video:type") ogVideoType = content.toLowerCase();
    if (prop === "og:audio:type") ogAudioType = content.toLowerCase();
    if (prop === "og:image" || prop === "og:image:url" || prop === "og:image:secure_url" || prop === "twitter:image" || prop === "twitter:image:src") {
      if (!acc.image) acc.image = absUrl(content, baseUrl) ?? undefined;
      else pushUnique(acc.images, absUrl(content, baseUrl));
    }
    if (prop === "og:video" || prop === "og:video:url" || prop === "og:video:secure_url" || prop === "twitter:player:stream") {
      pushUnique(ogVideos, absUrl(content, baseUrl));
    }
    if (prop === "og:audio" || prop === "og:audio:url" || prop === "og:audio:secure_url") {
      pushUnique(ogAudios, absUrl(content, baseUrl));
    }
  }

  const hasMediaExt = (url: string) => {
    try {
      const path = new URL(url).pathname.toLowerCase();
      return /\.(mp4|m4v|webm|mov|mkv|ogv|mp3|m4a|aac|wav|flac|ogg|opus)(\/|$)/.test(path);
    } catch {
      return false;
    }
  };

  for (const url of ogVideos) {
    if (ogVideoType === "text/html" && !hasMediaExt(url)) continue;
    if (ogVideoType && ogVideoType !== "text/html" && ogVideoType.startsWith("text/")) continue;
    pushUnique(acc.videos, url);
  }
  for (const url of ogAudios) {
    if (ogAudioType === "text/html" && !hasMediaExt(url)) continue;
    pushUnique(acc.audios, url);
  }

  const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!acc.title && titleTag) acc.title = decodeHtml(titleTag[1]!.replace(/\s+/g, " ").trim());

  for (const match of html.matchAll(/<script\b[^>]*\btype\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    const raw = match[1]!.trim();
    if (!raw) continue;
    try {
      walkJsonLd(JSON.parse(raw), acc, baseUrl);
    } catch {
      /* ignore broken JSON-LD */
    }
  }

  const stripped = stripNoise(html);
  for (const block of stripped.matchAll(/<video\b[\s\S]*?<\/video>/gi)) {
    const chunk = block[0]!;
    const src = attr(chunk.slice(0, Math.min(chunk.length, 800)), "src");
    pushUnique(acc.videos, src ? absUrl(src, baseUrl) : null);
    for (const source of chunk.matchAll(/<source\b[^>]*>/gi)) {
      const s = attr(source[0]!, "src");
      const type = (attr(source[0]!, "type") ?? "").toLowerCase();
      if (type.startsWith("application/") && (type.includes("mpegurl") || type.includes("dash"))) continue;
      pushUnique(acc.videos, s ? absUrl(s, baseUrl) : null);
    }
  }
  for (const tag of stripped.matchAll(/<video\b[^>]*\bsrc\s*=\s*["'][^"']+["'][^>]*>/gi)) {
    const src = attr(tag[0]!, "src");
    pushUnique(acc.videos, src ? absUrl(src, baseUrl) : null);
  }
  for (const tag of stripped.matchAll(/<audio\b[\s\S]*?<\/audio>/gi)) {
    const chunk = tag[0]!;
    const src = attr(chunk.slice(0, Math.min(chunk.length, 800)), "src");
    pushUnique(acc.audios, src ? absUrl(src, baseUrl) : null);
    for (const source of chunk.matchAll(/<source\b[^>]*>/gi)) {
      const s = attr(source[0]!, "src");
      pushUnique(acc.audios, s ? absUrl(s, baseUrl) : null);
    }
  }

  return acc;
}
