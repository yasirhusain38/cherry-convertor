import { isIP } from "node:net";
import { lookup } from "node:dns/promises";

const BLOCKED_HOSTS = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
  "metadata.google",
  "internal",
]);

function ipv4Private(ip: string): boolean {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  const [a, b] = p;
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a >= 224) return true;
  return false;
}

function ipv6Private(ip: string): boolean {
  const low = ip.toLowerCase();
  if (low === "::1" || low === "::" || low === "0:0:0:0:0:0:0:1") return true;
  if (low.startsWith("fc") || low.startsWith("fd") || low.startsWith("fe80")) return true;
  const mapped = low.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return ipv4Private(mapped[1]!);
  return false;
}

export function isPrivateIp(ip: string): boolean {
  const kind = isIP(ip);
  if (kind === 4) return ipv4Private(ip);
  if (kind === 6) return ipv6Private(ip);
  return true;
}

export async function assertSafeHttpUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("That is not a valid URL.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https URLs are allowed.");
  }
  if (url.username || url.password) throw new Error("URLs with credentials are blocked.");
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!host || BLOCKED_HOSTS.has(host) || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new Error("That host is not allowed.");
  }
  if (isIP(host) && isPrivateIp(host)) throw new Error("Private IP addresses are blocked.");
  const resolved = await lookup(host, { all: true });
  if (!resolved.length) throw new Error("Could not resolve that host.");
  for (const row of resolved) {
    if (isPrivateIp(row.address)) throw new Error("That host resolves to a private address.");
  }
  return url;
}
