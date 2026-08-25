import { applyChromaToImageData } from "./cutout";
import { cssEnhanceFilter, type EnhanceSettings } from "./enhance";
import { applyGradeToCanvas, cloneGrade, isIdentityGrade } from "./grade";
import { healImageData } from "./heal";

export type VideoChroma = {
  color: readonly [number, number, number];
  tolerance: number;
  feather: number;
};

export type VideoStudioOptions = {
  enhance: EnhanceSettings;
  chroma?: VideoChroma | null;
  mask?: Uint8Array | null;
  maskWidth?: number;
  maskHeight?: number;
  healRadius?: number;
  maxWidth?: number;
  onProgress?: (pct: number) => void;
};

function pickMime(): string {
  const types = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
    "video/mp4",
  ];
  if (typeof MediaRecorder === "undefined") return "";
  return types.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function loadVideo(file: File): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = URL.createObjectURL(file);
    video.onloadedmetadata = () => resolve(video);
    video.onerror = () => reject(new Error("Could not decode that video in this browser."));
  });
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  width: number,
  height: number,
  options: VideoStudioOptions,
): void {
  ctx.clearRect(0, 0, width, height);
  ctx.filter = cssEnhanceFilter(options.enhance) || "none";
  ctx.drawImage(video, 0, 0, width, height);
  ctx.filter = "none";
  const grade = cloneGrade(options.enhance.grade);
  if (!isIdentityGrade(grade)) applyGradeToCanvas(ctx.canvas, grade);

  const needHeal = Boolean(options.mask && options.mask.length && options.maskWidth && options.maskHeight);
  if (!options.chroma && !needHeal) return;
  const image = ctx.getImageData(0, 0, width, height);
  if (options.chroma) {
    applyChromaToImageData(image, options.chroma.color, options.chroma.tolerance, options.chroma.feather);
  }
  if (needHeal && options.mask && options.maskWidth && options.maskHeight) {
    const mask =
      options.maskWidth === width && options.maskHeight === height
        ? options.mask
        : scaleMask(options.mask, options.maskWidth, options.maskHeight, width, height);
    healImageData(image, mask, options.healRadius ?? 14);
  }
  ctx.putImageData(image, 0, 0);
}

function scaleMask(
  mask: Uint8Array,
  srcW: number,
  srcH: number,
  destW: number,
  destH: number,
): Uint8Array {
  const out = new Uint8Array(destW * destH);
  for (let y = 0; y < destH; y += 1) {
    const sy = Math.min(srcH - 1, Math.floor((y / destH) * srcH));
    for (let x = 0; x < destW; x += 1) {
      const sx = Math.min(srcW - 1, Math.floor((x / destW) * srcW));
      out[y * destW + x] = mask[sy * srcW + sx];
    }
  }
  return out;
}

export async function previewVideoFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  options: VideoStudioOptions,
): Promise<void> {
  const maxW = options.maxWidth ?? 1280;
  const scale = Math.min(1, maxW / Math.max(1, video.videoWidth));
  const width = Math.max(2, Math.round(video.videoWidth * scale / 2) * 2);
  const height = Math.max(2, Math.round(video.videoHeight * scale / 2) * 2);
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser.");
  drawFrame(ctx, video, width, height, options);
}

export async function recordGradedVideo(file: File, options: VideoStudioOptions): Promise<{
  blob: Blob;
  mime: string;
  width: number;
  height: number;
}> {
  const mime = pickMime();
  if (!mime) throw new Error("This browser cannot record video from a canvas (MediaRecorder missing).");

  const video = await loadVideo(file);
  const maxW = options.maxWidth ?? 1280;
  const scale = Math.min(1, maxW / Math.max(1, video.videoWidth));
  const width = Math.max(2, Math.round(video.videoWidth * scale / 2) * 2);
  const height = Math.max(2, Math.round(video.videoHeight * scale / 2) * 2);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: Boolean(options.chroma) });
  if (!ctx) throw new Error("Canvas is not supported in this browser.");

  const fps = 30;
  const canvasStream = canvas.captureStream(fps);
  let mixed: MediaStream = canvasStream;
  try {
    const media = video as HTMLVideoElement & { captureStream?: () => MediaStream };
    const captured = media.captureStream?.();
    const audio = captured?.getAudioTracks?.()[0];
    if (audio) {
      mixed = new MediaStream([...canvasStream.getVideoTracks(), audio]);
    }
  } catch {
    mixed = canvasStream;
  }

  const chunks: BlobPart[] = [];
  const rec = new MediaRecorder(mixed, { mimeType: mime, videoBitsPerSecond: 6_000_000 });
  rec.ondataavailable = (event) => {
    if (event.data.size) chunks.push(event.data);
  };

  video.currentTime = 0;
  await new Promise<void>((resolve) => {
    if (video.readyState >= 2) {
      resolve();
      return;
    }
    video.onseeked = () => resolve();
  });

  const done = new Promise<Blob>((resolve, reject) => {
    rec.onerror = () => reject(new Error("Recording failed."));
    rec.onstop = () => resolve(new Blob(chunks, { type: mime }));
    video.onended = () => {
      try {
        rec.stop();
      } catch {
        resolve(new Blob(chunks, { type: mime }));
      }
    };
  });

  rec.start(200);
  await video.play();

  const tick = () => {
    if (video.paused || video.ended) return;
    drawFrame(ctx, video, width, height, options);
    const duration = video.duration && Number.isFinite(video.duration) ? video.duration : 0;
    if (duration > 0) options.onProgress?.(Math.min(99, (video.currentTime / duration) * 100));
    if ("requestVideoFrameCallback" in video) {
      (video as HTMLVideoElement & { requestVideoFrameCallback: (cb: () => void) => void }).requestVideoFrameCallback(
        tick,
      );
    } else {
      requestAnimationFrame(tick);
    }
  };
  tick();

  const blob = await done;
  options.onProgress?.(100);
  URL.revokeObjectURL(video.src);
  return { blob, mime, width, height };
}

export function videoExt(mime: string): string {
  return mime.includes("mp4") ? "mp4" : "webm";
}
