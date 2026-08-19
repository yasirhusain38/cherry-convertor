export type SizeUnit = "KB" | "MB" | "GB";

const MULTIPLIER: Record<SizeUnit, number> = {
  KB: 1024,
  MB: 1024 * 1024,
  GB: 1024 * 1024 * 1024,
};

export function parseTypedSize(
  raw: string,
  fallbackUnit: SizeUnit,
): { bytes: number; value: number; unit: SizeUnit } | null {
  const text = raw.trim().toLowerCase().replace(/,/g, "");
  if (!text) return null;
  const match = text.match(/^(\d+(?:\.\d+)?)\s*(kb|mb|gb|k|m|g)?$/);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value <= 0) return null;
  const suffix = match[2];
  const unit: SizeUnit =
    suffix === "gb" || suffix === "g"
      ? "GB"
      : suffix === "mb" || suffix === "m"
        ? "MB"
        : suffix === "kb" || suffix === "k"
          ? "KB"
          : fallbackUnit;
  return { bytes: Math.round(value * MULTIPLIER[unit]), value, unit };
}
