function bytesToHex(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return [...arr].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function uuidV4(): string {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = bytesToHex(b);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function uuidV7(): string {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  const ms = Date.now();
  const view = new DataView(b.buffer);
  view.setUint32(0, Math.floor(ms / 0x10000));
  view.setUint16(4, ms & 0xffff);
  b[6] = (b[6] & 0x0f) | 0x70;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = bytesToHex(b);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function sha(algo: "SHA-1" | "SHA-256", data: BufferSource): Promise<string> {
  const buf = await crypto.subtle.digest(algo, data);
  return bytesToHex(buf);
}

export async function hmacSha256(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return bytesToHex(sig);
}

/** MD5 checksum only — not a security hash. */
export function md5(bytes: Uint8Array): string {
  const orig = bytes;
  const bitLen = orig.length * 8;
  const withOne = new Uint8Array(((orig.length + 9 + 63) >> 6) << 6);
  withOne.set(orig);
  withOne[orig.length] = 0x80;
  const view = new DataView(withOne.buffer);
  view.setUint32(withOne.length - 8, bitLen >>> 0, true);
  view.setUint32(withOne.length - 4, Math.floor(bitLen / 2 ** 32), true);

  let a = 1732584193;
  let b = -271733879;
  let c = -1732584194;
  let d = 271733878;
  const rot = (x: number, n: number) => (x << n) | (x >>> (32 - n));
  const add = (x: number, y: number) => (x + y) | 0;

  for (let i = 0; i < withOne.length; i += 64) {
    const w: number[] = [];
    for (let j = 0; j < 16; j += 1) w[j] = view.getUint32(i + j * 4, true);
    let A = a;
    let B = b;
    let C = c;
    let D = d;
    const rounds: Array<[number, number, number, number, number, number]> = [];
    const F = (x: number, y: number, z: number) => (x & y) | (~x & z);
    const G = (x: number, y: number, z: number) => (x & z) | (y & ~z);
    const H = (x: number, y: number, z: number) => x ^ y ^ z;
    const I = (x: number, y: number, z: number) => y ^ (x | ~z);
    const K = [
      0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
      0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
      0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
      0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
      0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
      0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
      0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
      0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
    ];
    const S = [
      7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
      4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
    ];
    void rounds;
    for (let j = 0; j < 64; j += 1) {
      let f: number;
      let g: number;
      if (j < 16) {
        f = F(B, C, D);
        g = j;
      } else if (j < 32) {
        f = G(B, C, D);
        g = (5 * j + 1) % 16;
      } else if (j < 48) {
        f = H(B, C, D);
        g = (3 * j + 5) % 16;
      } else {
        f = I(B, C, D);
        g = (7 * j) % 16;
      }
      const temp = add(add(add(A, f), K[j]), w[g]);
      A = D;
      D = C;
      C = B;
      B = add(B, rot(temp, S[j]));
    }
    a = add(a, A);
    b = add(b, B);
    c = add(c, C);
    d = add(d, D);
  }

  const out = new Uint8Array(16);
  const o = new DataView(out.buffer);
  o.setUint32(0, a, true);
  o.setUint32(4, b, true);
  o.setUint32(8, c, true);
  o.setUint32(12, d, true);
  return bytesToHex(out);
}

export function decodeJwt(token: string): { header: unknown; payload: unknown; signature: string } {
  const parts = token.trim().split(".");
  if (parts.length < 2) throw new Error("A JWT has three base64url segments.");
  const b64 = (seg: string) => {
    const pad = "=".repeat((4 - (seg.length % 4)) % 4);
    const s = (seg + pad).replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(s);
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
  };
  return {
    header: b64(parts[0]),
    payload: b64(parts[1]),
    signature: parts[2] ?? "",
  };
}

export type RegexHit = { index: number; text: string; groups: string[] };

export function runRegex(pattern: string, flags: string, input: string, replace?: string): {
  hits: RegexHit[];
  replaced?: string;
  error?: string;
} {
  try {
    const safe = flags.replace(/[^gimsuy]/g, "");
    const re = new RegExp(pattern, safe.includes("g") ? safe : `${safe}g`);
    const hits: RegexHit[] = [];
    let m: RegExpExecArray | null;
    let guard = 0;
    while ((m = re.exec(input)) && guard < 5000) {
      hits.push({ index: m.index, text: m[0], groups: m.slice(1) });
      if (m[0] === "") re.lastIndex += 1;
      guard += 1;
    }
    return { hits, replaced: replace !== undefined ? input.replace(new RegExp(pattern, safe), replace) : undefined };
  } catch (err) {
    return { hits: [], error: err instanceof Error ? err.message : "Invalid regex" };
  }
}
