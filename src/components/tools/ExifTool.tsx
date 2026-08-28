"use client";

import { useState } from "react";
import { DropZone } from "@/components/DropZone";
import { downloadBlob } from "@/lib/download";
import { canvasToBlob, drawExact, fileToBitmap } from "@/lib/image";
import { readFileExif, stripJpegMetadata, type ExifField } from "@/lib/exif";
import type { ToolDef } from "@/lib/tools";

export function ExifTool({ tool }: { tool: ToolDef }) {
  const strip = tool.slug.includes("remover") || tool.slug.includes("strip");
  const [file, setFile] = useState<File | null>(null);
  const [fields, setFields] = useState<ExifField[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function load(files: File[]) {
    const next = files[0];
    if (!next) return;
    setFile(next);
    setError(null);
    setStatus(null);
    try {
      const info = await readFileExif(next);
      setFields(info.fields);
      setNote(info.note);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read metadata.");
    }
  }

  async function remove() {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const buffer = await file.arrayBuffer();
      const stripped = stripJpegMetadata(buffer);
      const jpeg = file.type.includes("jpeg") || /\.jpe?g$/i.test(file.name);
      if (jpeg && stripped) {
        downloadBlob(new Blob([stripped], { type: "image/jpeg" }), cleanName(file.name, "jpg"));
        setStatus("JPEG metadata segments removed. Pixels were not recompressed.");
      } else {
        const bitmap = await fileToBitmap(file);
        const canvas = drawExact(bitmap, bitmap.width, bitmap.height);
        bitmap.close();
        const blob = await canvasToBlob(canvas, "image/jpeg", 0.92);
        downloadBlob(blob, cleanName(file.name, "jpg"));
        setStatus("Re-encoded as JPEG without Exif. Slight quality change is possible.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not strip metadata.");
    } finally {
      setBusy(false);
    }
  }

  const groups = [...new Set(fields.map((f) => f.group))];

  return (
    <div className="grid gap-6">
      <DropZone
        onFiles={load}
        label="Drop a photo, or browse"
        hint={strip ? "Strip camera Exif and GPS. JPEG can be stripped without a re-encode." : "Read camera, date, and GPS if the file stored them."}
      />
      {file ? <p className="text-sm text-[var(--ink-soft)]">{file.name} · {(file.size / 1024).toFixed(1)} KB</p> : null}
      {note ? <p className="text-sm text-[var(--ink-soft)]">{note}</p> : null}
      {fields.length ? (
        <div className="grid gap-6 md:grid-cols-2">
          {groups.map((group) => (
            <div key={group} className="card overflow-hidden">
              <p className="label px-5 pt-4">{group}</p>
              <dl className="divide-y divide-[var(--line)]">
                {fields
                  .filter((f) => f.group === group)
                  .map((f) => (
                    <div key={`${f.group}-${f.label}`} className="flex justify-between gap-4 px-5 py-3 text-sm">
                      <dt className="text-[var(--ink-soft)]">{f.label}</dt>
                      <dd className="text-right">{f.value}</dd>
                    </div>
                  ))}
              </dl>
            </div>
          ))}
        </div>
      ) : null}
      {strip ? (
        <button type="button" className="btn btn-primary w-fit" disabled={!file || busy} onClick={remove}>
          {busy ? "Stripping…" : "Download without Exif"}
        </button>
      ) : null}
      {status ? <p className="text-sm text-[var(--ink-soft)]">{status}</p> : null}
      {error ? <p className="text-sm text-brand">{error}</p> : null}
    </div>
  );
}

function cleanName(name: string, ext: string) {
  return `${name.replace(/\.[^.]+$/, "")}-no-exif.${ext}`;
}
