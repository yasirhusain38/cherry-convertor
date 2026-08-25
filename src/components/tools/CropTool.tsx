"use client";

import { useEffect, useRef, useState } from "react";
import { DropZone } from "@/components/DropZone";
import { UndoRedoBar } from "@/components/UndoRedoBar";
import { FileStats } from "@/components/FileStats";
import { FormatPicker } from "@/components/FormatPicker";
import { OutputActions } from "@/components/OutputActions";
import { clamp } from "@/lib/format";
import { useEditHistory } from "./useEditHistory";
import { canvasToFormat } from "@/lib/export";
import { getFormat, type ConvertFormat } from "@/lib/formats";
import {
  cropSource,
  fileToBitmap,
  revokeResult,
  type ProcessResult,
} from "@/lib/image";

type Rect = { x: number; y: number; w: number; h: number };

const ASPECTS: Array<{ id: string; label: string; value: number | null }> = [
  { id: "free", label: "Free", value: null },
  { id: "1", label: "1 : 1", value: 1 },
  { id: "34", label: "3 : 4", value: 3 / 4 },
  { id: "23", label: "2 : 3", value: 2 / 3 },
  { id: "169", label: "16 : 9", value: 16 / 9 },
  { id: "43", label: "4 : 3", value: 4 / 3 },
  { id: "45", label: "4 : 5", value: 4 / 5 },
  { id: "916", label: "9 : 16", value: 9 / 16 },
];

export function CropTool() {
  const [file, setFile] = useState<File | null>(null);
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const history = useEditHistory<Rect>(
    { x: 0.1, y: 0.1, w: 0.8, h: 0.8 },
    (rect) => ({ ...rect }),
  );
  const crop = history.present;
  const setCrop = (next: Rect) => history.set(next, "gesture");
  const [aspect, setAspect] = useState<number | null>(null);
  const [format, setFormat] = useState<ConvertFormat>(getFormat("jpeg")!);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [busy, setBusy] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ px: number; py: number; crop: Rect } | null>(null);

  async function load(files: File[]) {
    const next = files[0];
    if (!next) return;
    bitmap?.close();
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    revokeResult(result);
    const bmp = await fileToBitmap(next);
    setFile(next);
    setBitmap(bmp);
    setSourceUrl(URL.createObjectURL(next));
    history.reset({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
  }

  useEffect(() => {
    if (!bitmap) return;
    let cancelled = false;
    const handle = window.setTimeout(async () => {
      setBusy(true);
      const canvas = cropSource(
        bitmap,
        crop.x * bitmap.width,
        crop.y * bitmap.height,
        crop.w * bitmap.width,
        crop.h * bitmap.height,
      );
      const next = await canvasToFormat(canvas, format, 0.92);
      if (cancelled) {
        revokeResult(next);
        return;
      }
      setResult((prev) => {
        revokeResult(prev);
        return next;
      });
      setBusy(false);
    }, 80);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [bitmap, crop, format]);

  function applyAspect(nextAspect: number | null) {
    setAspect(nextAspect);
    if (!nextAspect || !bitmap) return;
    const imgAspect = bitmap.width / bitmap.height;
    let w = crop.w;
    let h = w / nextAspect / (1 / 1) ;
    // crop is normalized to image 0-1, so visual aspect = (w*imgW)/(h*imgH)
    h = (w * imgAspect) / nextAspect;
    if (h > 1) {
      h = Math.min(1, crop.h);
      w = (h * nextAspect) / imgAspect;
    }
    history.set(
      {
        x: clamp(crop.x, 0, 1 - w),
        y: clamp(crop.y, 0, 1 - h),
        w,
        h,
      },
      "instant",
    );
  }

  return (
    <div className="grid gap-6">
      {!file ? (
        <DropZone onFiles={load} label="Drop a photo to crop" />
      ) : (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <UndoRedoBar undo={history.undo} redo={history.redo} canUndo={history.canUndo} canRedo={history.canRedo} />
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              bitmap?.close();
              if (sourceUrl) URL.revokeObjectURL(sourceUrl);
              revokeResult(result);
              setFile(null);
              setBitmap(null);
              setSourceUrl(null);
              history.reset({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
            }}
          >
            New file
          </button>
        </div>
      )}

      {sourceUrl && bitmap ? (
        <div
          ref={frameRef}
          className="relative overflow-hidden rounded-[16px] border border-[var(--line)] bg-[#221F1F]"
          onPointerMove={(event) => {
            if (!drag.current || !frameRef.current) return;
            const box = frameRef.current.getBoundingClientRect();
            const dx = (event.clientX - drag.current.px) / box.width;
            const dy = (event.clientY - drag.current.py) / box.height;
            setCrop({
              ...drag.current.crop,
              x: clamp(drag.current.crop.x + dx, 0, 1 - drag.current.crop.w),
              y: clamp(drag.current.crop.y + dy, 0, 1 - drag.current.crop.h),
            });
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sourceUrl}
            alt="Crop source"
            className="block w-full object-contain"
            style={{ aspectRatio: `${bitmap.width} / ${bitmap.height}`, maxHeight: 520 }}
          />
          <div
            className="absolute cursor-move border-2 border-[#F5F5F1]"
            style={{
              left: `${crop.x * 100}%`,
              top: `${crop.y * 100}%`,
              width: `${crop.w * 100}%`,
              height: `${crop.h * 100}%`,
              boxShadow: "0 0 0 9999px rgba(34, 31, 31, 0.7)",
            }}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              drag.current = { px: event.clientX, py: event.clientY, crop };
            }}
          />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {ASPECTS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`btn min-h-10 px-3 ${aspect === item.value ? "btn-primary" : "btn-ghost"}`}
            onClick={() => applyAspect(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <FormatPicker value={format.id} onChange={setFormat} />

      {file && result ? (
        <>
          <FileStats originalBytes={file.size} outputBytes={result.bytes} width={result.width} height={result.height} />
          <OutputActions result={result} fileName={file.name} format={format} busy={busy} />
        </>
      ) : null}
    </div>
  );
}
