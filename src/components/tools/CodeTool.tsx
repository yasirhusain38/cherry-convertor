"use client";

import { useEffect, useRef, useState } from "react";
import { DropZone } from "@/components/DropZone";
import {
  makeBarcodePng,
  makeQrPng,
  scanImageData,
  scanImageFile,
  type BarcodeFormatName,
  type ScanHit,
} from "@/lib/codes";
import type { ToolDef } from "@/lib/tools";

function isScan(slug: string) {
  return slug.includes("scanner") || slug.includes("scan");
}

function isQr(slug: string) {
  return slug.includes("qr");
}

export function CodeTool({ tool }: { tool: ToolDef }) {
  const scan = isScan(tool.slug);
  return scan ? <Scanner qr={isQr(tool.slug)} /> : isQr(tool.slug) ? <QrGenerator /> : <BarcodeGenerator />;
}

function QrGenerator() {
  const [text, setText] = useState("https://www.cherryconverter.com/");
  const [size, setSize] = useState(512);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function build() {
    setError(null);
    if (!text.trim()) {
      setError("Enter text or a URL.");
      return;
    }
    try {
      const blob = await makeQrPng(text.trim(), size, "#221F1F", "#F5F5F1");
      if (url) URL.revokeObjectURL(url);
      setUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not build QR.");
    }
  }

  useEffect(() => {
    const t = window.setTimeout(() => {
      void build();
    }, 200);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, size]);

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_auto]">
      <div className="grid gap-4">
        <label className="grid gap-2 text-sm">
          Text or URL
          <textarea className="field min-h-32" value={text} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="grid max-w-xs gap-2 text-sm">
          Size
          <select className="field" value={size} onChange={(event) => setSize(Number(event.target.value))}>
            <option value={256}>256</option>
            <option value={512}>512</option>
            <option value={1024}>1024</option>
          </select>
        </label>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn btn-primary" disabled={!url} onClick={() => url && downloadFromUrl(url, "qr.png")}>
            Download PNG
          </button>
        </div>
        {error ? <p className="text-sm text-brand">{error}</p> : null}
      </div>
      {url ? (
        <div className="card p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="QR code" width={size > 512 ? 320 : 256} height={size > 512 ? 320 : 256} />
        </div>
      ) : null}
    </div>
  );
}

function BarcodeGenerator() {
  const [value, setValue] = useState("CHERRY-2026");
  const [format, setFormat] = useState<BarcodeFormatName>("CODE128");
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function build() {
    setError(null);
    try {
      const blob = await makeBarcodePng(value.trim(), format);
      if (url) URL.revokeObjectURL(url);
      setUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not build barcode. Check the number length for EAN/UPC.");
    }
  }

  return (
    <div className="grid gap-6">
      <label className="grid gap-2 text-sm">
        Value
        <input className="field" value={value} onChange={(event) => setValue(event.target.value)} />
      </label>
      <label className="grid max-w-xs gap-2 text-sm">
        Format
        <select className="field" value={format} onChange={(event) => setFormat(event.target.value as BarcodeFormatName)}>
          <option value="CODE128">Code 128</option>
          <option value="CODE39">Code 39</option>
          <option value="EAN13">EAN-13</option>
          <option value="EAN8">EAN-8</option>
          <option value="UPC">UPC-A</option>
          <option value="ITF14">ITF-14</option>
        </select>
      </label>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn btn-primary" onClick={build}>
          Generate
        </button>
        <button type="button" className="btn btn-ghost" disabled={!url} onClick={() => url && downloadFromUrl(url, "barcode.png")}>
          Download PNG
        </button>
      </div>
      {error ? <p className="text-sm text-brand">{error}</p> : null}
      {url ? (
        <div className="card p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="Barcode" className="max-h-40 bg-[#F5F5F1]" />
        </div>
      ) : null}
    </div>
  );
}

function Scanner({ qr }: { qr: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hits, setHits] = useState<ScanHit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const loop = useRef<number>(0);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  async function onFiles(files: File[]) {
    setError(null);
    try {
      const found = await scanImageFile(files[0]);
      setHits(found);
      if (!found.length) setError("No code in that image.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that image.");
    }
  }

  async function startCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setLive(true);
      const tick = async () => {
        const video = videoRef.current;
        if (!video || video.readyState < 2) {
          loop.current = requestAnimationFrame(() => void tick());
          return;
        }
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const found = await scanImageData(data);
          if (found.length) {
            setHits(found);
            stopCamera();
            return;
          }
        }
        loop.current = requestAnimationFrame(() => void tick());
      };
      loop.current = requestAnimationFrame(() => void tick());
    } catch {
      setError("Camera permission denied. Drop a screenshot instead.");
    }
  }

  function stopCamera() {
    cancelAnimationFrame(loop.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLive(false);
  }

  return (
    <div className="grid gap-6">
      <DropZone
        media="image"
        label={qr ? "Drop a QR screenshot" : "Drop a barcode photo"}
        hint="Decoded in this tab. Optional camera never leaves the device."
        onFiles={onFiles}
      />
      <div className="flex flex-wrap gap-3">
        {live ? (
          <button type="button" className="btn btn-ghost" onClick={stopCamera}>
            Stop camera
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={startCamera}>
            Scan with camera
          </button>
        )}
      </div>
      <video ref={videoRef} className={live ? "card max-h-80 w-full object-contain" : "hidden"} muted playsInline />
      {error ? <p className="text-sm text-brand">{error}</p> : null}
      {hits.length ? (
        <ul className="card divide-y divide-[var(--line)]">
          {hits.map((hit, i) => (
            <li key={`${hit.text}-${i}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
              <span>
                <span className="label mr-3">{hit.format}</span>
                {hit.text}
              </span>
              <button type="button" className="text-brand" onClick={() => navigator.clipboard.writeText(hit.text)}>
                Copy
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function downloadFromUrl(url: string, name: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
}
