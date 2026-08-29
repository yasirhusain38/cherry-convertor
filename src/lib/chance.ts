/** Fair picks in this tab. crypto.getRandomValues — not Math.random. */

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

export function parseWheelLines(raw: string): string[] {
  return raw
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 40);
}
