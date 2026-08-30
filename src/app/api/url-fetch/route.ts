import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { inspectUrl } from "@/lib/url-media/inspect";
import { clientIp, rateLimit } from "@/lib/url-media/limit";
import { ALLOWED_MIME, classifyMime, contentType, isHtmlMime, isJsonMime, isStreamingUrl } from "@/lib/url-media/mime";
import { isVideoStreamCdn } from "@/lib/url-media/platforms";
import { assertSafeHttpUrl } from "@/lib/url-media/ssrf";
import { safeFetch } from "@/lib/url-media/http";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MAX_BYTES = 48 * 1024 * 1024;

function filenameFromUrl(url: string, mime: string): string {
  try {
    const last = decodeURIComponent(new URL(url).pathname.split("/").filter(Boolean).pop() ?? "");
    if (last && /\.[a-z0-9]{2,5}$/i.test(last) && last.length < 80) return last.replace(/[^\w.-]+/g, "_");
  } catch {
    /* ignore */
  }
  const spec = classifyMime(mime);
  return spec ? `cherry-url.${spec.format}` : "cherry-url.bin";
}

export async function POST(request: Request) {
  if (!rateLimit(`f:${clientIp(request)}`, 16)) {
    return NextResponse.json({ error: "Too many downloads. Wait a few minutes." }, { status: 429 });
  }
  let fileUrl = "";
  let page = "";
  let listedMime = "";
  try {
    const body = (await request.json()) as { url?: string; page?: string };
    fileUrl = String(body.url ?? "").trim();
    page = String(body.page ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Send JSON { url, page }." }, { status: 400 });
  }
  if (!fileUrl) return NextResponse.json({ error: "Missing file URL." }, { status: 400 });
  if (page) {
    try {
      const inspected = await inspectUrl(page);
      const allowed = inspected.items.find((row) => row.downloadable && row.url === fileUrl);
      if (!allowed) {
        return NextResponse.json({ error: "That file was not listed as a public download." }, { status: 400 });
      }
      listedMime = allowed.mime;
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Could not re-check that page." },
        { status: 400 },
      );
    }
  }

  try {
    const safe = await assertSafeHttpUrl(fileUrl);
    if (isStreamingUrl(safe)) {
      return NextResponse.json({ error: "Streaming manifests (HLS/DASH) are not files we download." }, { status: 400 });
    }
    if (isVideoStreamCdn(safe.hostname)) {
      return NextResponse.json({ error: "That host is a player stream CDN, not a public file." }, { status: 400 });
    }

    const got = await safeFetch(safe.toString(), {
      method: "GET",
      timeoutMs: 28_000,
      maxBytes: MAX_BYTES,
      maxRedirects: 3,
      referer: page || undefined,
      rejectOversize: true,
      oversizeMessage: "File is larger than 48 MB.",
      headers: { accept: "image/*,video/*,audio/*,application/pdf,*/*" },
    });

    if (got.status < 200 || got.status >= 300 || !got.body.byteLength) {
      return NextResponse.json({ error: `Host returned ${got.status || "an empty body"}.` }, { status: 400 });
    }

    const mime = contentType(got.headers) || listedMime || "application/octet-stream";
    if (isHtmlMime(mime) || isJsonMime(mime)) {
      return NextResponse.json({ error: "That URL is a web page, not a media file." }, { status: 400 });
    }

    const type =
      ALLOWED_MIME.has(mime) || mime.startsWith("image/") || mime.startsWith("video/") || mime.startsWith("audio/")
        ? mime
        : listedMime && (listedMime.startsWith("video/") || listedMime.startsWith("audio/") || listedMime.startsWith("image/"))
          ? listedMime
          : "application/octet-stream";

    const filename = filenameFromUrl(got.url, type);
    return new NextResponse(Buffer.from(got.body), {
      headers: {
        "content-type": type,
        "content-length": String(got.body.byteLength),
        "content-disposition": `attachment; filename="${filename}"`,
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Fetch failed." },
      { status: 400 },
    );
  }
}
