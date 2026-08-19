export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** exponent;
  const digits = value >= 100 || exponent === 0 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(digits)} ${units[exponent]}`;
}

export function formatPercent(ratio: number): string {
  if (!Number.isFinite(ratio)) return "0%";
  const pct = Math.round(ratio * 100);
  if (pct > 0) return `+${pct}%`;
  return `${pct}%`;
}

export function reductionRatio(original: number, next: number): number {
  if (!original) return 0;
  return (next - original) / original;
}

export function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.toUpperCase() === "KB" || part.toUpperCase() === "MB" || part.toUpperCase() === "PDF" || part.toUpperCase() === "JPG" || part.toUpperCase() === "PNG" || part.toUpperCase() === "WEBP" || part.toUpperCase() === "HEIC" || part.toUpperCase() === "DPI" || part.toUpperCase() === "PAN"
      ? part.toUpperCase()
      : part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function downloadName(originalName: string, ext: string): string {
  const base = originalName.replace(/\.[^.]+$/, "") || "image";
  const clean = base.replace(/[^\w\-]+/g, "_").slice(0, 80);
  return `${clean}-cherry.${ext}`;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
