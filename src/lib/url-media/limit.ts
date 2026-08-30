const buckets = new Map<string, { n: number; start: number }>();

export function rateLimit(ip: string, max = 24, windowMs = 10 * 60_000): boolean {
  const now = Date.now();
  const row = buckets.get(ip);
  if (!row || now - row.start > windowMs) {
    buckets.set(ip, { n: 1, start: now });
    return true;
  }
  if (row.n >= max) return false;
  row.n += 1;
  return true;
}

export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "local";
}
