"use client";

import { useEffect, useRef, useState } from "react";
import { DropZone } from "@/components/DropZone";
import { downloadBlob } from "@/lib/download";
import { blobToDataUrl, imagesToPdf } from "@/lib/pdf";
import { fileToBitmap } from "@/lib/image";
import {
  makeBarcodePng,
  makeQrPng,
  makeQrSvg,
  scanImageData,
  scanImageFile,
  type BarcodeFormatName,
  type QrEcc,
  type ScanHit,
} from "@/lib/codes";
import { buildQrPayload, type QrKind } from "@/lib/qr-payload";
import type { ToolDef } from "@/lib/tools";
import JSZip from "jszip";

function isScan(slug: string) {
  return slug.includes("scanner") || slug.includes("scan");
}

function isQr(slug: string) {
  return slug.includes("qr");
}

export function CodeTool({ tool }: { tool: ToolDef }) {
  const scan = isScan(tool.slug);
  return scan ? <Scanner qr={isQr(tool.slug)} /> : isQr(tool.slug) ? <QrGenerator sizeDefault={tool.qrSize} /> : <BarcodeGenerator />;
}

function QrGenerator({ sizeDefault }: { sizeDefault?: number }) {
  const [kind, setKind] = useState<QrKind>("url");
  const [fields, setFields] = useState<Record<string, string>>({ text: "https://www.cherryconverter.com/" });
  const [size, setSize] = useState(sizeDefault ?? 512);
  const [ecc, setEcc] = useState<QrEcc>("M");
  const [dark, setDark] = useState("#221F1F");
  const [light, setLight] = useState("#F5F5F1");
  const [url, setUrl] = useState<string | null>(null);
  const [logo, setLogo] = useState<ImageBitmap | null>(null);
  const [csv, setCsv] = useState("");
  const [error, setError] = useState<string | null>(null);

  const payload = buildQrPayload(kind, fields);

  async function build() {
    setError(null);
    if (!payload.trim()) {
      setError("Enter a value.");
      return;
    }
    try {
      const blob = await makeQrPng(payload, size, dark, light, logo ? "H" : ecc, logo);
      if (url) URL.revokeObjectURL(url);
      setUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not build QR.");
    }
  }

  useEffect(() => {
    const t = window.setTimeout(() => void build(), 200);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload, size, ecc, dark, light, logo]);

  function set(key: string, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_auto]">
      <div className="grid gap-4">
        <p className="text-sm text-[var(--ink-soft)]">Payload never leaves this tab. Logo needs error-correction H.</p>
        <label className="grid max-w-xs gap-2 text-sm">
          Type
          <select
            className="field"
            value={kind}
            onChange={(e) => {
              const next = e.target.value as QrKind;
              setKind(next);
              if (next === "url") setFields({ text: "https://www.cherryconverter.com/" });
            }}
          >
            <option value="url">URL</option>
            <option value="text">Plain text</option>
            <option value="wifi">Wi-Fi</option>
            <option value="vcard">vCard</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="geo">Geo</option>
            <option value="event">Event</option>
            <option value="crypto">Crypto address</option>
          </select>
        </label>
        {kind === "url" || kind === "text" || kind === "crypto" ? (
          <textarea className="field min-h-28" value={fields.text || ""} onChange={(e) => set("text", e.target.value)} />
        ) : null}
        {kind === "wifi" ? (
          <>
            <input className="field" placeholder="SSID" value={fields.ssid || ""} onChange={(e) => set("ssid", e.target.value)} />
            <input className="field" placeholder="Password" value={fields.password || ""} onChange={(e) => set("password", e.target.value)} />
            <select className="field max-w-xs" value={fields.security || "WPA"} onChange={(e) => set("security", e.target.value)}>
              <option value="WPA">WPA/WPA2</option>
              <option value="WEP">WEP</option>
              <option value="nopass">No password</option>
            </select>
          </>
        ) : null}
        {kind === "vcard" ? (
          <>
            <input className="field" placeholder="First name" value={fields.first || ""} onChange={(e) => set("first", e.target.value)} />
            <input className="field" placeholder="Last name" value={fields.last || ""} onChange={(e) => set("last", e.target.value)} />
            <input className="field" placeholder="Phone" value={fields.phone || ""} onChange={(e) => set("phone", e.target.value)} />
            <input className="field" placeholder="Email" value={fields.email || ""} onChange={(e) => set("email", e.target.value)} />
            <input className="field" placeholder="Org" value={fields.org || ""} onChange={(e) => set("org", e.target.value)} />
          </>
        ) : null}
        {kind === "email" ? (
          <>
            <input className="field" placeholder="email" value={fields.email || ""} onChange={(e) => set("email", e.target.value)} />
            <input className="field" placeholder="subject" value={fields.subject || ""} onChange={(e) => set("subject", e.target.value)} />
          </>
        ) : null}
        {kind === "sms" || kind === "whatsapp" ? (
          <>
            <input className="field" placeholder="Phone" value={fields.phone || ""} onChange={(e) => set("phone", e.target.value)} />
            <input className="field" placeholder="Message" value={fields.body || ""} onChange={(e) => set("body", e.target.value)} />
          </>
        ) : null}
        {kind === "geo" ? (
          <div className="grid grid-cols-2 gap-3">
            <input className="field" placeholder="lat" value={fields.lat || ""} onChange={(e) => set("lat", e.target.value)} />
            <input className="field" placeholder="lng" value={fields.lng || ""} onChange={(e) => set("lng", e.target.value)} />
          </div>
        ) : null}
        {kind === "event" ? (
          <>
            <input className="field" placeholder="Title" value={fields.title || ""} onChange={(e) => set("title", e.target.value)} />
            <input className="field" type="datetime-local" value={fields.start || ""} onChange={(e) => set("start", e.target.value)} />
          </>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <select className="field max-w-28" value={size} onChange={(e) => setSize(Number(e.target.value))}>
            <option value={256}>256</option>
            <option value={512}>512</option>
            <option value={1024}>1024</option>
          </select>
          <select className="field max-w-28" value={ecc} onChange={(e) => setEcc(e.target.value as QrEcc)}>
            <option value="L">ECC L</option>
            <option value="M">ECC M</option>
            <option value="Q">ECC Q</option>
            <option value="H">ECC H</option>
          </select>
          <input type="color" className="field h-12 w-16 p-1" value={dark} onChange={(e) => setDark(e.target.value)} />
          <input type="color" className="field h-12 w-16 p-1" value={light} onChange={(e) => setLight(e.target.value)} />
        </div>
        <DropZone
          onFiles={async (files) => {
            logo?.close();
            setLogo(await fileToBitmap(files[0]));
          }}
          label="Optional centre logo"
          hint="Keep it small. H correction is forced when a logo is set."
        />
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn btn-primary" disabled={!url} onClick={() => url && downloadFromUrl(url, "qr.png")}>
            PNG
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={async () => {
              const svg = await makeQrSvg(payload, dark, light, ecc);
              downloadBlob(new Blob([svg], { type: "image/svg+xml" }), "qr.svg");
            }}
          >
            SVG
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={!url}
            onClick={async () => {
              if (!url) return;
              const dataUrl = await (await fetch(url)).blob().then(blobToDataUrl);
              const pdf = await imagesToPdf({ images: [{ dataUrl, width: size, height: size }] });
              downloadBlob(pdf, "qr.pdf");
            }}
          >
            PDF
          </button>
        </div>
        <label className="grid gap-2 text-sm">
          Batch CSV of URLs (one per line) → ZIP
          <textarea className="field min-h-24 font-mono text-sm" value={csv} onChange={(e) => setCsv(e.target.value)} />
        </label>
        <button
          type="button"
          className="btn btn-ghost w-fit"
          onClick={async () => {
            const lines = csv.split(/\n/).map((l) => l.trim()).filter(Boolean);
            if (!lines.length) return;
            const zip = new JSZip();
            for (let i = 0; i < lines.length; i += 1) {
              zip.file(`qr-${String(i + 1).padStart(2, "0")}.png`, await makeQrPng(lines[i], 512, dark, light, ecc));
            }
            downloadBlob(await zip.generateAsync({ type: "blob" }), "qr-batch.zip");
          }}
        >
          ZIP batch
        </button>
        {error ? <p className="text-sm text-brand">{error}</p> : null}
      </div>
      {url ? (
        <div className="card p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="QR code" width={256} height={256} />
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
