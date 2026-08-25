"use client";

import { useEffect, useRef, useState } from "react";
import { DropZone } from "@/components/DropZone";
import { FileStats } from "@/components/FileStats";
import { GradeControls } from "@/components/GradeControls";
import { UndoRedoBar } from "@/components/UndoRedoBar";
import { downloadBlob } from "@/lib/download";
import { cloneEnhance, DEFAULT_ENHANCE, type EnhanceSettings } from "@/lib/enhance";
import { useEditHistory } from "./useEditHistory";
import { emptyMask, maskHasPaint, overlayMask, paintBrush } from "@/lib/heal";
import type { ToolDef } from "@/lib/tools";
import { previewVideoFrame, recordGradedVideo, videoExt, type VideoChroma } from "@/lib/video-studio";

export { ColorGradeTool, CutoutTool, HealTool, PhotoStudio } from "./ImageStudio";

export function VideoStudio({ tool }: { tool: ToolDef }) {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const history = useEditHistory(cloneEnhance(DEFAULT_ENHANCE), cloneEnhance);
  const enhance = history.present;
  const setEnhance = history.set;
  const [useChroma, setUseChroma] = useState(tool.slug.includes("background") || tool.slug.includes("chroma"));
  const [chroma, setChroma] = useState<VideoChroma>({
    color: [0, 177, 64],
    tolerance: 48,
    feather: 8,
  });
  const maskRef = useRef<Uint8Array | null>(null);
  const maskSize = useRef({ w: 0, h: 0 });
  const [brush, setBrush] = useState(36);
  const [healOn, setHealOn] = useState(tool.slug.includes("watermark") || tool.slug.includes("object"));
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [out, setOut] = useState<{ blob: Blob; url: string; mime: string; width: number; height: number } | null>(
    null,
  );
  const drawing = useRef(false);

  function options() {
    return {
      enhance,
      chroma: useChroma ? chroma : null,
      mask: healOn ? maskRef.current : null,
      maskWidth: maskSize.current.w,
      maskHeight: maskSize.current.h,
      healRadius: Math.round(brush * 0.5),
      maxWidth: 1280,
    };
  }

  async function load(files: File[]) {
    const next = files[0];
    if (!next) return;
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    if (out) URL.revokeObjectURL(out.url);
    setOut(null);
    setFile(next);
    setVideoUrl(URL.createObjectURL(next));
    setError(null);
    maskRef.current = null;
  }

  async function refreshPreview() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;
    await previewVideoFrame(video, canvas, { ...options(), mask: null });
    if (!maskRef.current || maskSize.current.w !== canvas.width || maskSize.current.h !== canvas.height) {
      maskRef.current = emptyMask(canvas.width, canvas.height);
      maskSize.current = { w: canvas.width, h: canvas.height };
    }
    if (healOn && maskRef.current && maskHasPaint(maskRef.current)) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const overlay = document.createElement("canvas");
        overlay.width = canvas.width;
        overlay.height = canvas.height;
        const octx = overlay.getContext("2d");
        if (octx) {
          overlayMask(octx, maskRef.current, canvas.width, canvas.height);
          ctx.drawImage(overlay, 0, 0);
        }
      }
    }
  }

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void refreshPreview();
    }, 80);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enhance, useChroma, chroma, healOn, videoUrl]);

  async function exportClip() {
    if (!file) return;
    setBusy(true);
    setProgress(0);
    setError(null);
    try {
      const recorded = await recordGradedVideo(file, { ...options(), onProgress: setProgress });
      if (out) URL.revokeObjectURL(out.url);
      setOut({
        blob: recorded.blob,
        url: URL.createObjectURL(recorded.blob),
        mime: recorded.mime,
        width: recorded.width,
        height: recorded.height,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record that video.");
    } finally {
      setBusy(false);
    }
  }

  function paint(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const mask = maskRef.current;
    if (!canvas || !mask) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    paintBrush(mask, canvas.width, canvas.height, x, y, brush);
    void refreshPreview();
  }

  return (
    <div className="grid gap-6">
      {!file ? (
        <DropZone media="video" onFiles={load} />
      ) : (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <UndoRedoBar undo={history.undo} redo={history.redo} canUndo={history.canUndo} canRedo={history.canRedo} />
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              if (videoUrl) URL.revokeObjectURL(videoUrl);
              if (out) URL.revokeObjectURL(out.url);
              setFile(null);
              setVideoUrl(null);
              setOut(null);
              history.reset(cloneEnhance(DEFAULT_ENHANCE));
            }}
          >
            New file
          </button>
        </div>
      )}
      {videoUrl ? (
        <div className="grid gap-4">
          <video
            ref={videoRef}
            src={videoUrl}
            className="hidden"
            muted
            playsInline
            onLoadedData={() => void refreshPreview()}
            onSeeked={() => void refreshPreview()}
          />
          <canvas
            ref={canvasRef}
            className="mx-auto h-auto max-h-[420px] w-auto max-w-full touch-none rounded-[16px] border border-[var(--line)] bg-[#221F1F]"
            onPointerDown={(event) => {
              if (!healOn) return;
              drawing.current = true;
              event.currentTarget.setPointerCapture(event.pointerId);
              paint(event);
            }}
            onPointerMove={(event) => {
              if (drawing.current && healOn) paint(event);
            }}
            onPointerUp={() => {
              drawing.current = false;
            }}
          />
          <input
            type="range"
            min={0}
            max={videoRef.current?.duration || 0}
            step={0.04}
            defaultValue={0}
            onChange={(event) => {
              const video = videoRef.current;
              if (!video) return;
              video.currentTime = Number(event.target.value);
            }}
          />
        </div>
      ) : null}
      <div className="card grid gap-5 p-6">
        <p className="text-sm leading-6 text-[var(--ink-soft)]">
          Grade, chroma-key, or paint a fixed-corner mark. Export records a WebM (or MP4 if the browser allows) in this
          tab. Invisible AI watermarks are not stripped. Long clips record in real time.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`btn min-h-10 px-3 ${useChroma ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setUseChroma((v) => !v)}
          >
            Chroma key
          </button>
          <button
            type="button"
            className={`btn min-h-10 px-3 ${healOn ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setHealOn((v) => !v)}
          >
            Heal painted region
          </button>
        </div>
        {useChroma ? (
          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-2 text-sm">
              Key colour
              <input
                className="field h-12"
                type="color"
                value={`#${chroma.color.map((c) => c.toString(16).padStart(2, "0")).join("")}`}
                onChange={(event) => {
                  const hex = event.target.value.replace("#", "");
                  const n = Number.parseInt(hex, 16);
                  setChroma({
                    ...chroma,
                    color: [(n >> 16) & 255, (n >> 8) & 255, n & 255],
                  });
                }}
              />
            </label>
            <label className="grid gap-2 text-sm">
              Tolerance · {chroma.tolerance}
              <input
                type="range"
                min={8}
                max={140}
                value={chroma.tolerance}
                onChange={(e) => setChroma({ ...chroma, tolerance: Number(e.target.value) })}
              />
            </label>
            <label className="grid gap-2 text-sm">
              Feather · {chroma.feather}
              <input
                type="range"
                min={0}
                max={32}
                value={chroma.feather}
                onChange={(e) => setChroma({ ...chroma, feather: Number(e.target.value) })}
              />
            </label>
          </div>
        ) : null}
        {healOn ? (
          <label className="grid gap-2 text-sm">
            Heal brush · {brush}px
            <input type="range" min={8} max={140} value={brush} onChange={(e) => setBrush(Number(e.target.value))} />
          </label>
        ) : null}
        <GradeControls value={enhance} onChange={setEnhance} />
        <button type="button" className="btn btn-primary" disabled={!file || busy} onClick={() => void exportClip()}>
          {busy ? `Recording… ${Math.round(progress)}%` : "Export graded video"}
        </button>
      </div>
      {out ? (
        <>
          <FileStats originalBytes={file?.size ?? 0} outputBytes={out.blob.size} width={out.width} height={out.height} />
          <video src={out.url} controls className="w-full rounded-[16px] border border-[var(--line)]" />
          <button
            type="button"
            className="btn btn-primary"
            onClick={() =>
              downloadBlob(out.blob, `${(file?.name ?? "clip").replace(/\.[^.]+$/, "")}-cherry.${videoExt(out.mime)}`)
            }
          >
            Download .{videoExt(out.mime)}
          </button>
        </>
      ) : null}
      {error ? <p className="text-sm text-brand">{error}</p> : null}
    </div>
  );
}
