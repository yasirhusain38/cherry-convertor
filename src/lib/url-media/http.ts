import { assertSafeHttpUrl } from "./ssrf";
import { contentLength } from "./mime";

export const USER_AGENT = "CherryConverter/1.0 (+https://www.cherryconverter.com/tools/url-media-downloader)";

export type SafeFetchResult = {
  url: string;
  status: number;
  headers: Headers;
  body: Uint8Array;
  truncated: boolean;
};

export async function safeFetch(
  raw: string,
  opts: {
    method?: "GET" | "HEAD";
    headers?: Record<string, string>;
    timeoutMs?: number;
    maxBytes?: number;
    maxRedirects?: number;
    referer?: string;
    /** When set, cancel the body after headers if this returns true. */
    cancelBody?: (headers: Headers, status: number) => boolean;
    /** If content-length is over maxBytes, throw instead of reading a prefix. */
    rejectOversize?: boolean;
    oversizeMessage?: string;
  } = {},
): Promise<SafeFetchResult> {
  let current = await assertSafeHttpUrl(raw);
  const maxRedirects = opts.maxRedirects ?? 3;
  const method = opts.method ?? "GET";
  const maxBytes = opts.maxBytes ?? (method === "HEAD" ? 0 : 400_000);

  for (let hop = 0; hop <= maxRedirects; hop += 1) {
    const res = await fetch(current.toString(), {
      method,
      redirect: "manual",
      signal: AbortSignal.timeout(opts.timeoutMs ?? 8000),
      headers: {
        "user-agent": USER_AGENT,
        ...(opts.referer ? { referer: opts.referer } : {}),
        ...(opts.headers ?? {}),
      },
    });

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      try {
        await res.body?.cancel();
      } catch {
        /* ignore */
      }
      if (!loc) throw new Error("Redirect with no location.");
      current = await assertSafeHttpUrl(new URL(loc, current).toString());
      continue;
    }

    const len = contentLength(res.headers);
    if (opts.rejectOversize && maxBytes > 0 && len !== null && len > maxBytes) {
      try {
        await res.body?.cancel();
      } catch {
        /* ignore */
      }
      throw new Error(opts.oversizeMessage ?? "File is larger than the allowed size.");
    }

    if (method === "HEAD" || maxBytes <= 0 || opts.cancelBody?.(res.headers, res.status)) {
      try {
        await res.body?.cancel();
      } catch {
        /* ignore */
      }
      return { url: current.toString(), status: res.status, headers: res.headers, body: new Uint8Array(), truncated: false };
    }

    const { body, truncated } = await readLimited(res, maxBytes);
    if (opts.rejectOversize && truncated) {
      throw new Error(opts.oversizeMessage ?? "File is larger than the allowed size.");
    }
    return { url: current.toString(), status: res.status, headers: res.headers, body, truncated };
  }

  throw new Error("Too many redirects.");
}

async function readLimited(res: Response, maxBytes: number): Promise<{ body: Uint8Array; truncated: boolean }> {
  if (!res.body || maxBytes <= 0) {
    try {
      await res.body?.cancel();
    } catch {
      /* ignore */
    }
    return { body: new Uint8Array(), truncated: false };
  }
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  let truncated = false;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      const next = received + value.byteLength;
      if (next > maxBytes) {
        const keep = maxBytes - received;
        if (keep > 0) chunks.push(value.subarray(0, keep));
        received = maxBytes;
        truncated = true;
        await reader.cancel();
        break;
      }
      chunks.push(value);
      received = next;
    }
  } catch {
    /* abort / timeout */
  }
  const out = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { body: out, truncated };
}
