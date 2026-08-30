export type WheelSlice = { label: string; weight: number };

export function randomInt(n: number): number {
  if (n <= 0) throw new Error("Need at least one option.");
  if (n === 1) return 0;
  const max = Math.floor(0x100000000 / n) * n;
  const buf = new Uint32Array(1);
  let x = 0;
  do {
    crypto.getRandomValues(buf);
    x = buf[0]!;
  } while (x >= max);
  return x % n;
}

export function pickOne<T>(items: T[]): T {
  if (!items.length) throw new Error("Need at least one option.");
  return items[randomInt(items.length)]!;
}

/** One option per line. Equal parts unless a ratio is set: `Pizza x3`, `No:2`, `Later | 1`. */
export function parseWheelSlices(raw: string): WheelSlice[] {
  const out: WheelSlice[] = [];
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t) continue;
    const m = t.match(/^(.*?)(?:\s*[x×*:|]\s*|\s+x\s+)(\d+)\s*$/i);
    const label = (m?.[1] ?? t).trim();
    const weight = m ? Math.max(1, Math.min(99, Number(m[2]))) : 1;
    if (label) out.push({ label, weight });
    if (out.length >= 40) break;
  }
  return out;
}

export function weightedIndex(weights: number[]): number {
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total <= 0) return 0;
  let r = randomInt(total);
  for (let i = 0; i < weights.length; i += 1) {
    r -= weights[i]!;
    if (r < 0) return i;
  }
  return Math.max(0, weights.length - 1);
}

export function sliceAngles(weights: number[]): { start: number; end: number; mid: number }[] {
  const total = weights.reduce((sum, w) => sum + w, 0) || 1;
  let cursor = 0;
  return weights.map((w) => {
    const span = (w / total) * 360;
    const start = cursor;
    const end = cursor + span;
    cursor = end;
    return { start, end, mid: start + span / 2 };
  });
}
