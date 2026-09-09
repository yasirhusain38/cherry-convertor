"use client";

import { useEffect, useState } from "react";
import { DropZone } from "@/components/DropZone";
import { FileStats } from "@/components/FileStats";
import { FormatPicker } from "@/components/FormatPicker";
import { OutputActions } from "@/components/OutputActions";
import { downloadBlob } from "@/lib/download";
import { canvasToFormat, copyBlob } from "@/lib/export";
import { getFormat, type ConvertFormat } from "@/lib/formats";
import {
  compressToTargetBytes,
  drawExact,
  fileToBitmap,
  inkSignature,
  removeBackground,
  revokeResult,
  setJpegDpi,
  type ProcessResult,
} from "@/lib/image";
import { SIGNATURE_PRESETS, mmToPx } from "@/lib/presets";
import type { ToolDef } from "@/lib/tools";
import { PhotoEditorShell } from "./PhotoEditorShell";

type SignatureId = (typeof SIGNATURE_PRESETS)[number]["id"];

function signatureId(raw?: string): SignatureId {
  return SIGNATURE_PRESETS.some((item) => item.id === raw) ? (raw as SignatureId) : "std-6x2";
}

function useLocalImage() {
  const [file, setFile] = useState<File | null>(null);
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load(files: File[]) {
    const next = files[0];
    if (!next) return;
    bitmap?.close();
    setError(null);
    try {
      const bmp = await fileToBitmap(next);
      setFile(next);
      setBitmap(bmp);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that image.");
    }
  }

  function clear() {
    bitmap?.close();
    setFile(null);
    setBitmap(null);
  }

  return { file, bitmap, error, load, clear, setError };
}

export function DpiTool({ tool }: { tool?: ToolDef }) {
  const img = useLocalImage();
  const [dpi, setDpi] = useState(tool?.dpiDefault ?? 300);
  const [mode, setMode] = useState<"meta" | "resample">(tool?.dpiMode ?? "meta");
  const [printW, setPrintW] = useState(2);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [format, setFormat] = useState<ConvertFormat>(getFormat("jpeg")!);

  useEffect(() => {
    if (!img.bitmap) return;
    let cancelled = false;
    (async () => {
      setBusy(true);
      try {
        const width =
          mode === "resample" ? Math.round(printW * dpi) : img.bitmap!.width;
        const height =
          mode === "resample"
            ? Math.round((img.bitmap!.height / img.bitmap!.width) * width)
            : img.bitmap!.height;
        const canvas = drawExact(img.bitmap!, width, height);
        let next = await canvasToFormat(canvas, format, 0.92);
        const patched = format.id === "jpeg" ? await setJpegDpi(next.blob, dpi) : next.blob;
        if (cancelled) {
          revokeResult(next);
          return;
        }
        URL.revokeObjectURL(next.url);
        next = {
          ...next,
          blob: patched,
          url: URL.createObjectURL(patched),
          bytes: patched.size,
        };
        setResult((prev) => {
          revokeResult(prev);
          return next;
        });
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dpi, format, img.bitmap, mode, printW]);

  return (
    <EditorShell img={img} result={result} format={format} setFormat={setFormat} busy={busy}>
      <label className="grid gap-2 text-sm">
        Mode
        <select className="field" value={mode} onChange={(event) => setMode(event.target.value as typeof mode)}>
          <option value="meta">Metadata only — same pixels</option>
          <option value="resample">Resample to print size</option>
        </select>
      </label>
      <label className="grid gap-2 text-sm">
        DPI · {dpi}
        <input type="range" min={72} max={600} value={dpi} onChange={(event) => setDpi(Number(event.target.value))} />
      </label>
      {mode === "resample" ? (
        <label className="grid gap-2 text-sm">
          Print width (inches)
          <input
            className="field"
            type="number"
            min={0.5}
            step={0.1}
            value={printW}
            onChange={(event) => setPrintW(Number(event.target.value))}
          />
        </label>
      ) : null}
    </EditorShell>
  );
}

export function BgTool() {
  const img = useLocalImage();
  const [tolerance, setTolerance] = useState(46);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [format, setFormat] = useState<ConvertFormat>(getFormat("png")!);

  useEffect(() => {
    if (!img.bitmap) return;
    let cancelled = false;
    (async () => {
      setBusy(true);
      const canvas = removeBackground(img.bitmap!, tolerance);
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
    })();
    return () => {
      cancelled = true;
    };
  }, [format, img.bitmap, tolerance]);

  return (
    <EditorShell img={img} result={result} format={format} setFormat={setFormat} busy={busy} checker>
      <p className="text-sm leading-6 text-[var(--ink-soft)]">
        Basic chroma key from the corner colour. Best on a flat studio wall. An on-device AI
        model can be added later without sending photos to a server.
      </p>
      <label className="grid gap-2 text-sm">
        Tolerance · {tolerance}
        <input
          type="range"
          min={8}
          max={120}
          value={tolerance}
          onChange={(event) => setTolerance(Number(event.target.value))}
        />
      </label>
    </EditorShell>
  );
}

export function SignatureTool({ tool }: { tool?: ToolDef }) {
  const img = useLocalImage();
  const [presetId, setPresetId] = useState<SignatureId>(signatureId(tool?.signaturePreset));
  const [threshold, setThreshold] = useState(186);
  const [ink, setInk] = useState("#141212");
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [format, setFormat] = useState<ConvertFormat>(getFormat("jpeg")!);
  const preset = SIGNATURE_PRESETS.find((item) => item.id === presetId) ?? SIGNATURE_PRESETS[0];

  useEffect(() => {
    if (!img.bitmap) return;
    let cancelled = false;
    (async () => {
      setBusy(true);
      const inked = inkSignature(img.bitmap!, threshold, ink);
      const width = mmToPx(preset.widthMm, preset.dpi);
      const height = mmToPx(preset.heightMm, preset.dpi);
      const sized = drawExact(inked, width, height, "#ffffff");
      const source = await createImageBitmap(sized);
      const targeted = await compressToTargetBytes({
        source,
        targetBytes: preset.targetKB * 1024,
        mime: "image/jpeg",
        fill: "#ffffff",
      });
      source.close();
      const imgBit = await createImageBitmap(targeted.blob);
      const canvas = drawExact(imgBit, imgBit.width, imgBit.height);
      imgBit.close();
      URL.revokeObjectURL(targeted.url);
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
    })();
    return () => {
      cancelled = true;
    };
  }, [format, img.bitmap, ink, preset, threshold]);

  return (
    <EditorShell img={img} result={result} format={format} setFormat={setFormat} busy={busy}>
      <label className="grid gap-2 text-sm">
        Signature size
        <select
          className="field"
          value={presetId}
          onChange={(event) => setPresetId(event.target.value as typeof presetId)}
        >
          {SIGNATURE_PRESETS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label} · {item.targetKB} KB
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm">
        Ink colour
        <div className="flex gap-2">
          <button type="button" className={`btn min-h-10 px-3 ${ink === "#141212" ? "btn-primary" : "btn-ghost"}`} onClick={() => setInk("#141212")}>
            Black
          </button>
          <button type="button" className={`btn min-h-10 px-3 ${ink === "#1d4ed8" ? "btn-primary" : "btn-ghost"}`} onClick={() => setInk("#1d4ed8")}>
            Blue
          </button>
          <input className="field h-12 max-w-20" type="color" value={ink} onChange={(event) => setInk(event.target.value)} />
        </div>
      </label>
      <label className="grid gap-2 text-sm">
        Ink threshold · {threshold}
        <input
          type="range"
          min={80}
          max={240}
          value={threshold}
          onChange={(event) => setThreshold(Number(event.target.value))}
        />
      </label>
    </EditorShell>
  );
}

function EditorShell({
  img,
  result,
  format,
  setFormat,
  busy,
  checker,
  children,
}: {
  img: ReturnType<typeof useLocalImage>;
  result: ProcessResult | null;
  format: ConvertFormat;
  setFormat: (format: ConvertFormat) => void;
  busy: boolean;
  checker?: boolean;
  children: React.ReactNode;
}) {
  return (
    <PhotoEditorShell
      hasFile={Boolean(img.file)}
      actions={{
        onFiles: img.load,
        newFile: img.clear,
        save: () => {
          if (!result || !img.file) return;
          downloadBlob(result.blob, `${img.file.name.replace(/\.[^.]+$/, "")}-cherry.${format.ext}`);
        },
        copy: () => {
          if (result) void copyBlob(result.blob);
        },
      }}
      empty={<DropZone onFiles={img.load} />}
      toolbar={
        <>
          <p className="min-w-0 truncate text-sm">{img.file?.name} · local</p>
          <span className="ml-auto" />
          <OutputActions result={result} fileName={img.file?.name ?? "image"} format={format} busy={busy} compact />
          <button type="button" className="btn btn-ghost" onClick={img.clear}>
            New file
          </button>
        </>
      }
      canvas={
        result && result.mime.startsWith("image/") ? (
          <div className={checker ? "h-full w-full" : "h-full w-full bg-[#F5F5F1]"}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={result.url} alt="Result" className="h-full w-full object-contain" />
          </div>
        ) : (
          <p className="text-sm text-[var(--ink-soft)]">{busy ? "Working…" : "Preview"}</p>
        )
      }
      panel={
        <>
          {children}
          <FormatPicker value={format.id} onChange={setFormat} />
          {img.file && result ? (
            <FileStats
              originalBytes={img.file.size}
              outputBytes={result.bytes}
              width={result.width}
              height={result.height}
            />
          ) : null}
          {img.error ? <p className="text-sm text-brand">{img.error}</p> : null}
        </>
      }
    />
  );
}
