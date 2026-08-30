import { parseHtmlSignals } from "./html";
import { safeFetch } from "./http";
import {
  classifyMime,
  contentType,
  EXT_MIME,
  extOf,
  fileSizeFromHeaders,
  isHtmlMime,
  isJsonMime,
  isStreamingUrl,
  item,
  looksLikeHtml,
  sniffMedia,
  type MediaSpec,
} from "./mime";
import { detectPlatform, isPlayerOrStreamHost, platformName, streamBlock } from "./platforms";
import { assertSafeHttpUrl } from "./ssrf";
import type { InspectResult, MediaItem, PlatformId } from "./types";

export { ALLOWED_MIME, EXT_MIME } from "./mime";

function youtubeId(url: URL): string | null {
  const idOk = (value: string | undefined | null): value is string => Boolean(value && /^[\w-]{11}$/.test(value));
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return idOk(id) ? id : null;
  }
  const v = url.searchParams.get("v");
  if (idOk(v)) return v;
  const parts = url.pathname.split("/").filter(Boolean);
  const markers = new Set(["shorts", "embed", "live", "v"]);
  for (let i = 0; i < parts.length - 1; i += 1) {
    if (markers.has(parts[i]!.toLowerCase()) && idOk(parts[i + 1])) return parts[i + 1]!;
  }
  return null;
}

async function fetchJson(url: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(url, {
      headers: { accept: "application/json" },
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function oembed(endpoint: string, page: string): Promise<{ title?: string; author?: string; thumbnail?: string }> {
  const json = await fetchJson(`${endpoint}${encodeURIComponent(page)}`);
  if (!json) return {};
  return {
    title: typeof json.title === "string" ? json.title : undefined,
    author: typeof json.author_name === "string" ? json.author_name : undefined,
    thumbnail: typeof json.thumbnail_url === "string" ? json.thumbnail_url : undefined,
  };
}

function fileResult(pageUrl: string, spec: MediaSpec, fileUrl: string, bytes: number | null, platform: PlatformId, name: string): InspectResult {
  return {
    platform,
    platformName: name,
    pageUrl,
    items: [
      item({
        kind: spec.kind,
        label: `${spec.format.toUpperCase()} file`,
        format: spec.format,
        mime: spec.mime,
        url: fileUrl,
        bytes,
        downloadable: true,
      }),
    ],
  };
}

function rejectPlayerMedia(url: URL, spec: MediaSpec): boolean {
  if (spec.kind !== "video" && spec.kind !== "audio") return false;
  return isPlayerOrStreamHost(url.hostname);
}

export async function probeMedia(
  fileUrl: string,
  referer?: string,
): Promise<{ url: string; spec: MediaSpec; bytes: number | null } | null> {
  let parsed: URL;
  try {
    parsed = await assertSafeHttpUrl(fileUrl);
  } catch {
    return null;
  }
  if (isStreamingUrl(parsed)) return null;
  const ext = extOf(parsed);
  const extSpec = ext ? EXT_MIME[ext] : undefined;
  if (extSpec && rejectPlayerMedia(parsed, extSpec)) return null;
  if (!extSpec && isPlayerOrStreamHost(parsed.hostname)) return null;

  try {
    const head = await safeFetch(parsed.toString(), {
      method: "HEAD",
      timeoutMs: 5000,
      referer,
      headers: { accept: "video/*,audio/*,image/*,application/pdf,*/*" },
    });
    if (head.status >= 200 && head.status < 300) {
      const mime = contentType(head.headers);
      if (isHtmlMime(mime) || isJsonMime(mime)) return null;
      const spec = classifyMime(mime) ?? (extSpec && !mime ? extSpec : null);
      if (spec && !rejectPlayerMedia(new URL(head.url), spec)) {
        return { url: head.url, spec, bytes: fileSizeFromHeaders(head.headers, head.status) };
      }
    }
  } catch {
    /* HEAD often 405 — try a short GET */
  }

  try {
    const got = await safeFetch(parsed.toString(), {
      method: "GET",
      maxBytes: 16_384,
      timeoutMs: 6000,
      referer,
      headers: { accept: "*/*", range: "bytes=0-16383" },
    });
    const mime = contentType(got.headers);
    if (isHtmlMime(mime) || isJsonMime(mime) || looksLikeHtml(got.body)) return null;
    const spec = classifyMime(mime) ?? sniffMedia(got.body);
    if (!spec) return null;
    const final = new URL(got.url);
    if (isStreamingUrl(final) || rejectPlayerMedia(final, spec)) return null;
    return { url: got.url, spec, bytes: fileSizeFromHeaders(got.headers, got.status) };
  } catch {
    return null;
  }
}

const NO_FILE =
  "No public media file was found at this URL. Paste a direct link that ends in mp4, webm, mp3, jpg, png, webp, gif, or pdf — or a page that advertises a real video file (Open Graph og:video / JSON-LD contentUrl). Watch-page embeds are not files.";

async function fromHtmlPage(pageUrl: string, platform: PlatformId, name: string): Promise<InspectResult> {
  let got: Awaited<ReturnType<typeof safeFetch>>;
  try {
    got = await safeFetch(pageUrl, {
      method: "GET",
      maxBytes: 400_000,
      timeoutMs: 10_000,
      headers: { accept: "text/html,application/xhtml+xml;q=0.9,video/*,audio/*,image/*,*/*;q=0.8" },
      cancelBody: (headers) => {
        const mime = contentType(headers);
        return Boolean(classifyMime(mime) && !isHtmlMime(mime) && !isJsonMime(mime));
      },
    });
  } catch {
    return { platform, platformName: name, pageUrl, items: [], blockedReason: NO_FILE };
  }

  if (got.status < 200 || got.status >= 300) {
    return { platform, platformName: name, pageUrl, items: [], blockedReason: NO_FILE };
  }

  const mime = contentType(got.headers);
  const headerSpec = classifyMime(mime);
  if (headerSpec && !isHtmlMime(mime) && !isJsonMime(mime)) {
    try {
      const final = new URL(got.url);
      if (!isStreamingUrl(final) && !rejectPlayerMedia(final, headerSpec)) {
        return fileResult(
          pageUrl,
          headerSpec,
          got.url,
          fileSizeFromHeaders(got.headers, got.status),
          "direct",
          "Direct file",
        );
      }
    } catch {
      /* fall through to HTML */
    }
  }

  const sniffed = sniffMedia(got.body);
  if (sniffed && !looksLikeHtml(got.body) && !isHtmlMime(mime)) {
    try {
      const final = new URL(got.url);
      if (!isStreamingUrl(final) && !rejectPlayerMedia(final, sniffed)) {
        return fileResult(
          pageUrl,
          sniffed,
          got.url,
          fileSizeFromHeaders(got.headers, got.status),
          "direct",
          "Direct file",
        );
      }
    } catch {
      /* HTML parse */
    }
  }

  if (!isHtmlMime(mime) && !looksLikeHtml(got.body)) {
    return { platform, platformName: name, pageUrl, items: [], blockedReason: NO_FILE };
  }

  const html = new TextDecoder("utf-8", { fatal: false }).decode(got.body);
  const signals = parseHtmlSignals(html, got.url);
  const items: MediaItem[] = [];
  const seen = new Set<string>();

  async function take(
    raw: string,
    kind: MediaItem["kind"],
    label: string,
    note?: string,
  ) {
    if (items.length >= 8) return;
    let abs: string;
    try {
      abs = new URL(raw, got.url).toString();
    } catch {
      return;
    }
    if (seen.has(abs)) return;
    seen.add(abs);
    const probed = await probeMedia(abs, got.url);
    if (!probed) return;
    if (probed.spec.kind !== kind) return;
    seen.add(probed.url);
    items.push(
      item({
        kind: probed.spec.kind,
        label,
        format: probed.spec.format,
        mime: probed.spec.mime,
        url: probed.url,
        bytes: probed.bytes,
        downloadable: true,
        note,
      }),
    );
  }

  const videoNote = "Advertised on the page (Open Graph / JSON-LD / video tag). Not a DRM or player-stream rip.";
  await Promise.all(signals.videos.slice(0, 5).map((url) => take(url, "video", "Public video file", videoNote)));
  await Promise.all(signals.audios.slice(0, 3).map((url) => take(url, "audio", "Public audio file", "Advertised on the page.")));
  if (signals.image) {
    await take(signals.image, "image", "Public preview image", "Open Graph / Twitter card image — not the video file.");
  }
  for (const img of signals.images.slice(0, 3)) {
    if (items.length >= 8) break;
    await take(img, "image", "Public image");
  }

  const videoItems = items.filter((row) => row.kind === "video");
  return {
    platform,
    platformName: name,
    pageUrl,
    title: signals.title,
    thumbnail: signals.image,
    items,
    blockedReason: videoItems.length
      ? undefined
      : items.length
        ? "No public video file on this page. Listed files are previews or other public media — not a watch-page stream rip."
        : NO_FILE,
  };
}

export async function inspectUrl(raw: string): Promise<InspectResult> {
  const url = await assertSafeHttpUrl(raw.trim());
  const pageUrl = url.toString();
  const adapter = detectPlatform(url);
  const ext = extOf(url);

  if (ext && EXT_MIME[ext]) {
    const spec = EXT_MIME[ext]!;
    const playerAudioVideo =
      (spec.kind === "video" || spec.kind === "audio") && isPlayerOrStreamHost(url.hostname) && Boolean(adapter);
    if (!playerAudioVideo) {
      const probed = await probeMedia(pageUrl);
      if (probed) {
        return fileResult(pageUrl, probed.spec, probed.url, probed.bytes, adapter?.id ?? "direct", adapter?.name ?? "Direct file");
      }
    }
  }

  const platform: PlatformId = adapter?.id ?? "unknown";
  const name = platformName(platform);

  if (platform === "youtube") {
    const id = youtubeId(url);
    if (!id) {
      return { platform, platformName: name, pageUrl, items: [], blockedReason: streamBlock(platform) };
    }
    const info = await oembed("https://www.youtube.com/oembed?format=json&url=", pageUrl);
    const thumb = `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
    const hq = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    return {
      platform,
      platformName: name,
      pageUrl,
      title: info.title,
      author: info.author,
      thumbnail: info.thumbnail ?? thumb,
      items: [
        item({
          kind: "image",
          label: "Public thumbnail (maxres)",
          format: "jpg",
          mime: "image/jpeg",
          url: thumb,
          downloadable: true,
          note: "YouTube’s public thumbnail CDN — not the video file.",
        }),
        item({
          kind: "image",
          label: "Public thumbnail (hq)",
          format: "jpg",
          mime: "image/jpeg",
          url: hq,
          downloadable: true,
        }),
      ],
      blockedReason: streamBlock(platform),
    };
  }

  if (platform === "vimeo") {
    const info = await oembed("https://vimeo.com/api/oembed.json?url=", pageUrl);
    return previewOnly(platform, name, pageUrl, info);
  }
  if (platform === "soundcloud") {
    const info = await oembed("https://soundcloud.com/oembed?format=json&url=", pageUrl);
    return previewOnly(platform, name, pageUrl, info);
  }
  if (platform === "tiktok") {
    const info = await oembed("https://www.tiktok.com/oembed?url=", pageUrl);
    return previewOnly(platform, name, pageUrl, info);
  }
  if (platform === "dailymotion") {
    const info = await oembed("https://www.dailymotion.com/services/oembed?url=", pageUrl);
    return previewOnly(platform, name, pageUrl, info);
  }
  if (platform === "reddit") {
    const info = await oembed("https://www.reddit.com/oembed?url=", pageUrl);
    const items: MediaItem[] = [];
    if (url.hostname === "i.redd.it" || url.hostname === "preview.redd.it") {
      items.push(
        item({
          kind: "image",
          label: "Reddit image host",
          format: extOf(url) ?? "jpg",
          mime: "image/jpeg",
          url: pageUrl,
          downloadable: true,
        }),
      );
    } else if (info.thumbnail) {
      items.push(
        item({
          kind: "image",
          label: "Public thumbnail (oEmbed)",
          format: "jpg",
          mime: "image/jpeg",
          url: info.thumbnail,
          downloadable: true,
          note: "From the official oEmbed thumbnail. Not the original video file.",
        }),
      );
    }
    return {
      platform,
      platformName: name,
      pageUrl,
      title: info.title,
      thumbnail: info.thumbnail,
      items,
      blockedReason: streamBlock(platform),
    };
  }

  if (adapter) {
    return {
      platform,
      platformName: name,
      pageUrl,
      items: [],
      blockedReason: streamBlock(platform),
    };
  }

  try {
    const head = await safeFetch(pageUrl, {
      method: "HEAD",
      timeoutMs: 6000,
      headers: { accept: "*/*" },
    });
    if (head.status >= 200 && head.status < 300) {
      const mime = contentType(head.headers);
      const spec = classifyMime(mime);
      if (spec && !isHtmlMime(mime) && !isJsonMime(mime)) {
        const final = new URL(head.url);
        if (!isStreamingUrl(final) && !rejectPlayerMedia(final, spec)) {
          return fileResult(
            pageUrl,
            spec,
            head.url,
            fileSizeFromHeaders(head.headers, head.status),
            "direct",
            "Direct file",
          );
        }
      }
    }
  } catch {
    /* GET HTML / sniff below */
  }

  return fromHtmlPage(pageUrl, "unknown", url.hostname);
}

function previewOnly(
  platform: PlatformId,
  platformName: string,
  pageUrl: string,
  info: { title?: string; author?: string; thumbnail?: string },
): InspectResult {
  const items: MediaItem[] = [];
  if (info.thumbnail) {
    items.push(
      item({
        kind: "image",
        label: "Public thumbnail (oEmbed)",
        format: "jpg",
        mime: "image/jpeg",
        url: info.thumbnail,
        downloadable: true,
        note: "From the official oEmbed thumbnail. Not the original video/audio file.",
      }),
    );
  }
  return {
    platform,
    platformName,
    pageUrl,
    title: info.title,
    author: info.author,
    thumbnail: info.thumbnail,
    items,
    blockedReason: streamBlock(platform),
  };
}
