"use client";

import { useMemo, useState } from "react";
import { FormatPicker } from "@/components/FormatPicker";
import { downloadBlob } from "@/lib/download";
import { canvasToFormat } from "@/lib/export";
import { getFormat, type ConvertFormat } from "@/lib/formats";
import { drawExact, fileToBitmap } from "@/lib/image";
import { firstVideoFrame, reencodeVideoFile } from "@/lib/url-media/browser-convert";
import { PLATFORMS } from "@/lib/url-media/platforms";
import type { InspectResult, MediaItem } from "@/lib/url-media/types";
import type { ToolDef } from "@/lib/tools";

type Job = {
  id: string;
  label: string;
  status: "queued" | "fetch" | "convert" | "done" | "error";
  detail: string;
};

type PullMode = "as-is" | "image" | "webm" | "frame";

function platformFromTool(tool: ToolDef): string | null {
  const map: Record<string, string> = {
    "youtube-url-tools": "youtube",
    "tiktok-url-tools": "tiktok",
    "instagram-url-tools": "instagram",
    "facebook-url-tools": "facebook",
    "twitter-url-tools": "x",
    "reddit-url-tools": "reddit",
    "vimeo-url-tools": "vimeo",
    "pinterest-url-tools": "pinterest",
    "soundcloud-url-tools": "soundcloud",
  };
  return map[tool.slug] ?? null;
}

function sizeLabel(bytes?: number | null) {
  if (!bytes || !Number.isFinite(bytes)) return "";
  if (bytes >= 1024 * 1024) return ` · ${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return ` · ${(bytes / 1024).toFixed(0)} KB`;
  return ` · ${bytes} B`;
}

async function blobWithProgress(res: Response, onDetail: (detail: string) => void): Promise<Blob> {
  const total = Number(res.headers.get("content-length") || 0);
  const type = res.headers.get("content-type") || "application/octet-stream";
  if (!res.body) return res.blob();
  const reader = res.body.getReader();
  const chunks: ArrayBuffer[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) as ArrayBuffer);
    received += value.byteLength;
    if (total) onDetail(`Fetching public file… ${Math.min(99, Math.round((received / total) * 100))}%`);
    else onDetail(`Fetching public file… ${(received / (1024 * 1024)).toFixed(1)} MB`);
  }
  return new Blob(chunks, { type });
}

export function UrlMediaTool({ tool }: { tool: ToolDef }) {
  const focus = platformFromTool(tool);
  const catalog = tool.slug === "supported-platforms";
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [inspect, setInspect] = useState<InspectResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [format, setFormat] = useState<ConvertFormat>(getFormat("jpeg")!);
  const [jobs, setJobs] = useState<Job[]>([]);

  const hint = useMemo(() => {
    if (focus === "youtube") {
      return "Paste a YouTube or Shorts URL for the title and public thumbnail. The video file itself is not available — YouTube does not publish an mp4 for other sites, and we do not rip the player.";
    }
    if (focus) return "Paste a public page URL. Only public files (not DRM/player streams) can be fetched.";
    return "Paste a direct video file (mp4/webm) or a page that advertises one. A YouTube watch link is not a video file — thumbnails only.";
  }, [focus]);

  const listed = inspect?.items.filter((row) => row.downloadable) ?? [];
  const hasImage = listed.some((row) => row.kind === "image" || row.kind === "video");

  function patchJob(id: string, patch: Partial<Job>) {
    setJobs((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  async function detect() {
    setBusy(true);
    setError(null);
    setInspect(null);
    try {
      const res = await fetch("/api/url-inspect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = (await res.json()) as InspectResult & { error?: string };
      if (!res.ok) throw new Error(data.error || "Inspect failed.");
      setInspect(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not inspect that URL.");
    } finally {
      setBusy(false);
    }
  }

  async function pull(media: MediaItem, mode: PullMode) {
    const id = `${media.id}-${Date.now()}`;
    setJobs((rows) => [...rows, { id, label: media.label, status: "fetch", detail: "Fetching public file…" }]);
    try {
      const res = await fetch("/api/url-fetch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: media.url, page: inspect?.pageUrl }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || "Fetch failed.");
      }
      const blob = await blobWithProgress(res, (detail) => patchJob(id, { detail }));
      const name = safeName(inspect?.title || media.label, media.format);
      const file = new File([blob], name, { type: blob.type || media.mime });

      if (mode === "image" && media.kind === "image") {
        patchJob(id, { status: "convert", detail: "Converting in this tab…" });
        const bmp = await fileToBitmap(file);
        const canvas = drawExact(bmp, bmp.width, bmp.height);
        bmp.close();
        const out = await canvasToFormat(canvas, format, 0.92);
        downloadBlob(out.blob, `${name.replace(/\.[^.]+$/, "")}-cherry.${format.ext}`);
        URL.revokeObjectURL(out.url);
      } else if (mode === "webm" && media.kind === "video") {
        patchJob(id, { status: "convert", detail: "Re-encoding in this tab…" });
        const out = await reencodeVideoFile(file, (pct) =>
          patchJob(id, { status: "convert", detail: `Re-encoding in this tab… ${Math.round(pct)}%` }),
        );
        downloadBlob(out.blob, `${name.replace(/\.[^.]+$/, "")}-cherry.${out.ext}`);
      } else if (mode === "frame" && media.kind === "video") {
        patchJob(id, { status: "convert", detail: "Saving first frame…" });
        const canvas = await firstVideoFrame(file);
        const out = await canvasToFormat(canvas, format, 0.92);
        downloadBlob(out.blob, `${name.replace(/\.[^.]+$/, "")}-frame.${format.ext}`);
        URL.revokeObjectURL(out.url);
      } else {
        downloadBlob(blob, name);
      }
      patchJob(id, { status: "done", detail: "Saved." });
    } catch (err) {
      patchJob(id, { status: "error", detail: err instanceof Error ? err.message : "Failed." });
    }
  }

  if (catalog) {
    return (
      <div className="grid gap-6">
        <p className="text-sm leading-6 text-[var(--ink-soft)]">
          Detection is modular. Download is only offered when a <strong>public file URL</strong> exists
          (direct mp4/webm/mp3/image/PDF, a page that advertises a real Open Graph / JSON-LD video file,
          Reddit image host, YouTube thumbnail CDN, official oEmbed thumbnail). Player streams, private
          accounts, and DRM are not supported — by design.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PLATFORMS.map((p) => (
            <li key={p.id} className="card p-4">
              <p className="text-base tracking-tight">{p.name}</p>
              <p className="mt-1 text-xs text-[var(--ink-soft)]">{p.hosts[0]}</p>
              <p className="mt-2 text-xs text-[var(--ink-faint)]">Detect yes · stream rip no</p>
            </li>
          ))}
          <li className="card p-4">
            <p className="text-base tracking-tight">Direct files &amp; og:video</p>
            <p className="mt-1 text-xs text-[var(--ink-soft)]">mp4, webm, mov, mp3, jpg, png, webp, gif, pdf</p>
            <p className="mt-2 text-xs text-[var(--ink-faint)]">Download original · in-tab WebM / first frame</p>
          </li>
        </ul>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <p className="text-sm leading-6 text-[var(--ink-soft)]">{hint}</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="grid min-w-0 flex-1 gap-2 text-sm">
          Public URL
          <input
            className="field"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void detect();
            }}
            placeholder="https://"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <button type="button" className="btn btn-primary" disabled={busy || !url.trim()} onClick={() => void detect()}>
          {busy ? "Detecting…" : "Detect"}
        </button>
      </div>
      {error ? <p className="text-sm text-brand">{error}</p> : null}

      {inspect ? (
        <div className="grid gap-4">
          <div className="card p-5">
            <p className="label">{inspect.platformName}</p>
            <p className="mt-2 text-xl tracking-tight">{inspect.title || inspect.pageUrl}</p>
            {inspect.author ? <p className="mt-1 text-sm text-[var(--ink-soft)]">{inspect.author}</p> : null}
            {inspect.blockedReason ? (
              <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">{inspect.blockedReason}</p>
            ) : null}
          </div>
          {inspect.blockedReason && !listed.some((row) => row.kind === "video") ? (
            <div className="card border border-brand/30 p-5">
              <p className="label text-brand">Video file</p>
              <p className="mt-2 text-lg tracking-tight">Not available from this link</p>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                {inspect.platform === "youtube"
                  ? "A youtube.com / youtu.be watch URL is a player page, not an mp4. Download the video in the YouTube app if YouTube offers it, or paste a direct file URL that ends in .mp4 / .webm."
                  : "This is a watch page, not a public video file. Paste a direct .mp4 / .webm link if you have one."}
              </p>
            </div>
          ) : null}
          {inspect.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={inspect.thumbnail} alt="" className="max-h-56 w-full rounded-xl object-contain" />
          ) : null}
          {listed.length ? (
            <>
              <p className="label">
                {inspect.blockedReason && !listed.some((row) => row.kind === "video")
                  ? "Public thumbnails (images, not the video)"
                  : "Available public files"}
              </p>
              <ul className="grid gap-3">
                {listed.map((media) => (
                  <li key={media.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm tracking-tight">{media.label}</p>
                      <p className="text-xs text-[var(--ink-soft)]">
                        {media.kind.toUpperCase()} · {media.format.toUpperCase()}
                        {sizeLabel(media.bytes)}
                        {media.note ? ` · ${media.note}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className="btn btn-primary" onClick={() => void pull(media, "as-is")}>
                        {media.kind === "image" && inspect.blockedReason ? "Save thumbnail" : "Download"}
                      </button>
                      {media.kind === "image" ? (
                        <button type="button" className="btn btn-ghost" onClick={() => void pull(media, "image")}>
                          Convert
                        </button>
                      ) : null}
                      {media.kind === "video" ? (
                        <>
                          <button type="button" className="btn btn-ghost" onClick={() => void pull(media, "webm")}>
                            Re-encode
                          </button>
                          <button type="button" className="btn btn-ghost" onClick={() => void pull(media, "frame")}>
                            First frame
                          </button>
                        </>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
              {hasImage ? <FormatPicker value={format.id} onChange={setFormat} /> : null}
              <p className="text-xs text-[var(--ink-soft)]">
                Public files up to 48 MB. Download saves the original bytes. Image convert and video first-frame
                run in this tab via Canvas. Video re-encode is WebM (or MP4 in Safari) via MediaRecorder — not
                a DRM/player rip, and not MOV/MP3/GIF.
              </p>
            </>
          ) : (
            <p className="text-sm text-[var(--ink-soft)]">No public file listed for this URL.</p>
          )}
        </div>
      ) : null}

      {jobs.length ? (
        <ul className="grid gap-2 text-sm">
          {jobs.map((job) => (
            <li key={job.id} className="card px-4 py-3">
              <span className="label">{job.status}</span> {job.label} — {job.detail}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function safeName(title: string, ext: string) {
  const base = title
    .replace(/[^\w\s.-]+/g, "")
    .trim()
    .slice(0, 60) || "cherry-url";
  return `${base}.${ext}`;
}
