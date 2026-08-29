/**
 * Reachability from THIS browser only.
 * Does not ask a third-party “is it down” API (that would leak the URL).
 * CORS-opaque success still means something answered on the network.
 */

export type ProbeStatus = "up" | "down" | "blocked" | "offline" | "invalid";

export type ProbeResult = {
  status: ProbeStatus;
  detail: string;
  ms: number;
  url: string;
};

export function normalizeCheckUrl(input: string): string {
  const raw = input.trim();
  if (!raw) throw new Error("Enter a hostname or URL.");
  if (/\s/.test(raw)) throw new Error("That is not a URL.");
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
  const url = new URL(withScheme);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https.");
  }
  return url.origin;
}

function timed<T>(work: (signal: AbortSignal) => Promise<T>, ms: number): Promise<{ value?: T; error?: unknown; ms: number }> {
  const ctrl = new AbortController();
  const t0 = performance.now();
  const timer = window.setTimeout(() => ctrl.abort(), ms);
  return work(ctrl.signal)
    .then((value) => ({ value, ms: performance.now() - t0 }))
    .catch((error) => ({ error, ms: performance.now() - t0 }))
    .finally(() => window.clearTimeout(timer));
}

export async function probeFromBrowser(target: string): Promise<ProbeResult> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return { status: "offline", detail: "This device is offline.", ms: 0, url: target };
  }

  const cors = await timed(
    (signal) => fetch(target, { method: "HEAD", mode: "cors", cache: "no-store", credentials: "omit", signal, redirect: "follow" }),
    8000,
  );
  if (cors.value?.ok || (cors.value && cors.value.status < 500)) {
    return {
      status: "up",
      detail: `Answered this browser with HTTP ${cors.value.status} in ${Math.round(cors.ms)} ms.`,
      ms: cors.ms,
      url: target,
    };
  }

  const opaque = await timed(
    (signal) => fetch(target, { method: "GET", mode: "no-cors", cache: "no-store", credentials: "omit", signal }),
    8000,
  );
  if (opaque.value) {
    return {
      status: "blocked",
      detail: `The host answered this browser (opaque response) in ${Math.round(opaque.ms)} ms. CORS hides the status — it is not proof of a full page load.`,
      ms: opaque.ms,
      url: target,
    };
  }

  const img = await pingImage(`${target}/favicon.ico`);
  if (img) {
    return {
      status: "up",
      detail: `Favicon loaded from this browser in ${Math.round(img)} ms.`,
      ms: img,
      url: target,
    };
  }

  const err = (opaque.error as Error | undefined)?.name === "AbortError" ? "Timed out (8 s)." : "Network error from this browser.";
  return {
    status: "down",
    detail: `${err} That can mean the host is down, DNS failed, mixed content, or a firewall. This is not a global outage map.`,
    ms: opaque.ms,
    url: target,
  };
}

function pingImage(src: string): Promise<number | null> {
  return new Promise((resolve) => {
    const img = new Image();
    const t0 = performance.now();
    const done = (ok: boolean) => {
      img.onload = null;
      img.onerror = null;
      resolve(ok ? performance.now() - t0 : null);
    };
    const timer = window.setTimeout(() => done(false), 6000);
    img.onload = () => {
      window.clearTimeout(timer);
      done(true);
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      done(false);
    };
    img.referrerPolicy = "no-referrer";
    img.src = `${src}${src.includes("?") ? "&" : "?"}r=${Date.now()}`;
  });
}
