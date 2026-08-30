import { DEFAULT_ENHANCE } from "@/lib/enhance";
import { recordGradedVideo, videoExt } from "@/lib/video-studio";

const MAX_CONVERT_SEC = 180;

function loadVideo(file: File): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = URL.createObjectURL(file);
    video.onloadeddata = () => resolve(video);
    video.onerror = () => reject(new Error("This browser cannot decode that video. Download the original file instead."));
  });
}

export async function reencodeVideoFile(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<{ blob: Blob; mime: string; ext: string }> {
  const video = await loadVideo(file);
  const duration = video.duration && Number.isFinite(video.duration) ? video.duration : 0;
  URL.revokeObjectURL(video.src);
  if (duration > MAX_CONVERT_SEC) {
    throw new Error("In-tab convert is limited to 3 minutes. Download the original file instead.");
  }
  const out = await recordGradedVideo(file, {
    enhance: DEFAULT_ENHANCE,
    maxWidth: 1280,
    onProgress,
  });
  return { blob: out.blob, mime: out.mime, ext: videoExt(out.mime) };
}

export async function firstVideoFrame(file: File): Promise<HTMLCanvasElement> {
  const video = await loadVideo(file);
  try {
    const duration = video.duration && Number.isFinite(video.duration) ? video.duration : 0;
    const t = Math.min(0.12, Math.max(0, duration * 0.05));
    if (Math.abs(video.currentTime - t) > 0.01) {
      await new Promise<void>((resolve) => {
        const timer = window.setTimeout(() => resolve(), 1200);
        video.onseeked = () => {
          window.clearTimeout(timer);
          resolve();
        };
        try {
          video.currentTime = t;
        } catch {
          window.clearTimeout(timer);
          resolve();
        }
      });
    }
    const width = Math.max(1, video.videoWidth);
    const height = Math.max(1, video.videoHeight);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not supported in this browser.");
    ctx.drawImage(video, 0, 0, width, height);
    return canvas;
  } finally {
    URL.revokeObjectURL(video.src);
  }
}
