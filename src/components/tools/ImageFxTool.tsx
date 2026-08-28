"use client";

import { useEffect, useRef, useState } from "react";
import { DropZone } from "@/components/DropZone";
import { FileStats } from "@/components/FileStats";
import { FormatPicker } from "@/components/FormatPicker";
import { OutputActions } from "@/components/OutputActions";
import { downloadBlob } from "@/lib/download";
import { canvasToFormat } from "@/lib/export";
import { getFormat, type ConvertFormat } from "@/lib/formats";
import {
  addBorder,
  blurCanvas,
  blurRects,
  cartoonCanvas,
  collageCanvases,
  detectFaces,
  joinCanvases,
  memeCanvas,
  mosaicRects,
  pixelateCanvas,
  roundedImage,
  sketchCanvas,
  splitCanvas,
  type CollageLayout,
  type NormRect,
} from "@/lib/image-fx";
import { drawExact, fileToBitmap, revokeResult, type ProcessResult } from "@/lib/image";
import type { ToolDef } from "@/lib/tools";
import JSZip from "jszip";

type Kind =
  | "sketch"
  | "cartoon"
  | "pixelate"
  | "blur"
  | "blur-face"
  | "mosaic"
  | "collage"
  | "meme"
  | "split"
  | "join"
  | "border"
  | "rounded"
  | "circle";

function kindOf(slug: string): Kind {
  if (slug.includes("sketch")) return "sketch";
  if (slug.includes("cartoon")) return "cartoon";
  if (slug.includes("pixelate")) return "pixelate";
  if (slug.includes("blur-face") || slug.includes("face")) return "blur-face";
  if (slug.includes("mosaic") || slug.includes("censor")) return "mosaic";
  if (slug.includes("blur")) return "blur";
  if (slug.includes("collage")) return "collage";
  if (slug.includes("meme")) return "meme";
  if (slug.includes("split")) return "split";
  if (slug.includes("join")) return "join";
  if (slug.includes("border")) return "border";
  if (slug.includes("circle")) return "circle";
  return "rounded";
}

export function ImageFxTool({ tool }: { tool: ToolDef }) {
  const kind = kindOf(tool.slug);
  const multi = kind === "collage" || kind === "join";
  const [files, setFiles] = useState<File[]>([]);
  const [bitmaps, setBitmaps] = useState<ImageBitmap[]>([]);
  const [format, setFormat] = useState<ConvertFormat>(getFormat(kind === "circle" || kind === "rounded" ? "png" : "jpeg")!);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [block, setBlock] = useState(16);
  const [blurPx, setBlurPx] = useState(12);
  const [border, setBorder] = useState(24);
  const [color, setColor] = useState("#F5F5F1");
  const [radius, setRadius] = useState(48);
  const [rows, setRows] = useState(2);
  const [cols, setCols] = useState(2);
  const [layout, setLayout] = useState<CollageLayout>("2x2");
  const [dir, setDir] = useState<"horizontal" | "vertical">("horizontal");
  const [top, setTop] = useState("ONE DOES NOT SIMPLY");
  const [bottom, setBottom] = useState("UPLOAD A PHOTO");
  const [rects, setRects] = useState<NormRect[]>([]);
  const [drawing, setDrawing] = useState<NormRect | null>(null);
  const dragOrigin = useRef<{ x: number; y: number } | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  async function load(next: File[]) {
    setError(null);
    revokeResult(result);
    setResult(null);
    const list = multi ? [...files, ...next] : next.slice(0, 1);
    setFiles(list);
    bitmaps.forEach((b) => b.close());
    try {
      const loaded = await Promise.all(list.map((f) => fileToBitmap(f)));
      setBitmaps(loaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that image.");
    }
  }

  useEffect(() => {
    if (!bitmaps.length) return;
    if (kind === "split") return;
    let cancelled = false;
    const handle = window.setTimeout(async () => {
      setBusy(true);
      try {
        const canvas = render(kind, bitmaps, {
          block,
          blurPx,
          border,
          color,
          radius,
          layout,
          dir,
          top,
          bottom,
          rects: drawing ? [...rects, drawing] : rects,
          circle: kind === "circle",
        });
        const mime = kind === "circle" || kind === "rounded" ? getFormat("png")! : format;
        const next = await canvasToFormat(canvas, mime, 0.92);
        if (cancelled) {
          revokeResult(next);
          return;
        }
        setResult((prev) => {
          revokeResult(prev);
          return next;
        });
        if (kind === "circle" || kind === "rounded") setFormat(mime);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Processing failed.");
      } finally {
        if (!cancelled) setBusy(false);
      }
    }, 80);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [bitmaps, block, blurPx, border, bottom, color, dir, drawing, format, kind, layout, radius, rects, top]);

  async function autoFaces() {
    if (!bitmaps[0]) return;
    const found = await detectFaces(bitmaps[0]);
    if (!found.length) {
      setError("This browser has no FaceDetector. Drag boxes over faces instead.");
      return;
    }
    setRects(found);
    setError(null);
  }

  async function splitZip() {
    if (!bitmaps[0]) return;
    setBusy(true);
    try {
      const canvas = drawExact(bitmaps[0], bitmaps[0].width, bitmaps[0].height);
      const tiles = splitCanvas(canvas, rows, cols);
      const zip = new JSZip();
      for (let i = 0; i < tiles.length; i += 1) {
        const encoded = await canvasToFormat(tiles[i], format, 0.92);
        zip.file(`tile-${String(i + 1).padStart(2, "0")}.${format.ext}`, encoded.blob);
        URL.revokeObjectURL(encoded.url);
      }
      downloadBlob(await zip.generateAsync({ type: "blob" }), "split-tiles.zip");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not split.");
    } finally {
      setBusy(false);
    }
  }

  const preview = result?.url;
  const source = bitmaps[0];

  return (
    <div className="grid gap-6">
      <DropZone
        multiple={multi}
        onFiles={load}
        label={multi ? "Drop images, or browse" : "Drop a photo, or browse"}
        hint="Local filters and crops. Not a cloud generative model."
      />
      {files.length ? <p className="text-sm text-[var(--ink-soft)]">{files.map((f) => f.name).join(" · ")}</p> : null}

      <div className="flex flex-wrap items-end gap-4">
        {kind === "pixelate" || kind === "mosaic" ? (
          <label className="grid gap-2 text-sm">
            Block
            <input className="field w-28" type="number" min={4} max={80} value={block} onChange={(e) => setBlock(Number(e.target.value))} />
          </label>
        ) : null}
        {kind === "blur" || kind === "blur-face" ? (
          <label className="grid gap-2 text-sm">
            Blur
            <input className="field w-28" type="number" min={2} max={60} value={blurPx} onChange={(e) => setBlurPx(Number(e.target.value))} />
          </label>
        ) : null}
        {kind === "border" ? (
          <>
            <label className="grid gap-2 text-sm">
              Width
              <input className="field w-28" type="number" min={1} max={200} value={border} onChange={(e) => setBorder(Number(e.target.value))} />
            </label>
            <label className="grid gap-2 text-sm">
              Colour
              <input className="field w-20 p-1" type="color" value={color} onChange={(e) => setColor(e.target.value)} />
            </label>
          </>
        ) : null}
        {kind === "rounded" ? (
          <label className="grid gap-2 text-sm">
            Radius
            <input className="field w-28" type="number" min={4} max={400} value={radius} onChange={(e) => setRadius(Number(e.target.value))} />
          </label>
        ) : null}
        {kind === "split" ? (
          <>
            <label className="grid gap-2 text-sm">
              Rows
              <input className="field w-24" type="number" min={1} max={10} value={rows} onChange={(e) => setRows(Number(e.target.value))} />
            </label>
            <label className="grid gap-2 text-sm">
              Columns
              <input className="field w-24" type="number" min={1} max={10} value={cols} onChange={(e) => setCols(Number(e.target.value))} />
            </label>
          </>
        ) : null}
        {kind === "collage" ? (
          <label className="grid gap-2 text-sm">
            Layout
            <select className="field" value={layout} onChange={(e) => setLayout(e.target.value as CollageLayout)}>
              <option value="2x2">2 × 2</option>
              <option value="3x3">3 × 3</option>
              <option value="1x2">1 × 2</option>
              <option value="2x1">2 × 1</option>
              <option value="1x3">1 × 3</option>
            </select>
          </label>
        ) : null}
        {kind === "join" ? (
          <label className="grid gap-2 text-sm">
            Direction
            <select className="field" value={dir} onChange={(e) => setDir(e.target.value as typeof dir)}>
              <option value="horizontal">Horizontal</option>
              <option value="vertical">Vertical</option>
            </select>
          </label>
        ) : null}
        {kind === "blur-face" ? (
          <button type="button" className="btn btn-ghost" onClick={autoFaces}>
            Detect faces
          </button>
        ) : null}
        {kind === "split" ? (
          <button type="button" className="btn btn-primary" disabled={!source || busy} onClick={splitZip}>
            Download ZIP
          </button>
        ) : null}
        {kind !== "split" && kind !== "circle" && kind !== "rounded" ? (
          <FormatPicker value={format.id} onChange={setFormat} />
        ) : null}
      </div>

      {kind === "meme" ? (
        <div className="grid gap-3 md:grid-cols-2">
          <input className="field" value={top} placeholder="Top text" onChange={(e) => setTop(e.target.value)} />
          <input className="field" value={bottom} placeholder="Bottom text" onChange={(e) => setBottom(e.target.value)} />
        </div>
      ) : null}

      {(kind === "blur-face" || kind === "mosaic") && source ? (
        <p className="text-sm text-[var(--ink-soft)]">Drag on the preview to mark a region. {kind === "mosaic" ? "Pixelates the box." : "Blurs the box."}</p>
      ) : null}

      {preview && kind !== "split" ? (
        <div
          ref={frameRef}
          className="relative max-w-3xl overflow-hidden"
          onPointerDown={(event) => {
            if (kind !== "blur-face" && kind !== "mosaic") return;
            const box = event.currentTarget.getBoundingClientRect();
            const x = (event.clientX - box.left) / box.width;
            const y = (event.clientY - box.top) / box.height;
            dragOrigin.current = { x, y };
            setDrawing({ x, y, w: 0, h: 0 });
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            const origin = dragOrigin.current;
            if (!origin) return;
            const box = event.currentTarget.getBoundingClientRect();
            const nx = (event.clientX - box.left) / box.width;
            const ny = (event.clientY - box.top) / box.height;
            setDrawing({
              x: Math.min(origin.x, nx),
              y: Math.min(origin.y, ny),
              w: Math.abs(nx - origin.x),
              h: Math.abs(ny - origin.y),
            });
          }}
          onPointerUp={() => {
            setDrawing((current) => {
              if (current && current.w > 0.01 && current.h > 0.01) {
                setRects((prev) => [...prev, current]);
              }
              return null;
            });
            dragOrigin.current = null;
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Result" className="max-h-[640px] w-full object-contain" />
        </div>
      ) : source && kind === "split" ? (
        <p className="text-sm text-[var(--ink-soft)]">
          {source.width} × {source.height} → {rows} × {cols} tiles
        </p>
      ) : null}

      {result && kind !== "split" ? (
        <>
          <FileStats originalBytes={files[0]?.size ?? 0} outputBytes={result.bytes} width={result.width} height={result.height} />
          <OutputActions result={result} fileName={files[0]?.name.replace(/\.[^.]+$/, "") || "image"} format={format} busy={busy} />
        </>
      ) : null}
      {error ? <p className="text-sm text-brand">{error}</p> : null}
    </div>
  );
}

function render(
  kind: Kind,
  bitmaps: ImageBitmap[],
  opts: {
    block: number;
    blurPx: number;
    border: number;
    color: string;
    radius: number;
    layout: CollageLayout;
    dir: "horizontal" | "vertical";
    top: string;
    bottom: string;
    rects: NormRect[];
    circle: boolean;
  },
): HTMLCanvasElement {
  const first = bitmaps[0];
  if (kind === "collage") {
    const canvases = bitmaps.map((b) => drawExact(b, b.width, b.height));
    return collageCanvases(canvases, opts.layout);
  }
  if (kind === "join") {
    const canvases = bitmaps.map((b) => drawExact(b, b.width, b.height));
    return joinCanvases(canvases, opts.dir);
  }
  if (!first) throw new Error("Add an image.");
  if (kind === "meme") return memeCanvas(first, first.width, first.height, opts.top, opts.bottom);
  if (kind === "border") return addBorder(first, first.width, first.height, opts.border, opts.color);
  if (kind === "rounded" || kind === "circle") {
    return roundedImage(first, first.width, first.height, opts.radius, opts.circle);
  }
  const canvas = drawExact(first, first.width, first.height);
  if (kind === "sketch") sketchCanvas(canvas);
  if (kind === "cartoon") cartoonCanvas(canvas);
  if (kind === "pixelate") pixelateCanvas(canvas, opts.block);
  if (kind === "blur") blurCanvas(canvas, opts.blurPx);
  if (kind === "blur-face") blurRects(canvas, opts.rects, opts.blurPx);
  if (kind === "mosaic") mosaicRects(canvas, opts.rects, opts.block);
  return canvas;
}
