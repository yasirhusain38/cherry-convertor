import { canvasToFormat } from "./export";
import type { ConvertFormat } from "./formats";
import { drawExact, fileToBitmap, type ProcessResult } from "./image";

export async function convertToFormat(options: {
  file: File;
  format: ConvertFormat;
  quality?: number;
  fill?: string;
}): Promise<ProcessResult> {
  const bitmap = await fileToBitmap(options.file);
  const canvas = drawExact(
    bitmap,
    bitmap.width,
    bitmap.height,
    options.format.id === "jpeg" ? options.fill ?? "#ffffff" : undefined,
  );
  bitmap.close();
  return canvasToFormat(canvas, options.format, options.quality ?? 0.92);
}

export { canvasToFormat } from "./export";
