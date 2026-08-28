"use client";

import { useState } from "react";
import { DropZone } from "@/components/DropZone";
import { downloadBlob } from "@/lib/download";
import { ocrFiles } from "@/lib/ocr";
import { textToDocx } from "@/lib/office";
import type { ToolDef } from "@/lib/tools";

export function OcrTool({ tool }: { tool: ToolDef }) {
  const [files, setFiles] = useState<File[]>([]);
  const [lang, setLang] = useState("eng");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!files.length) return;
    setBusy(true);
    setError(null);
    try {
      const result = await ocrFiles(files, lang, (page, total, phase) => {
        setStatus(phase === "rasterising" ? "Preparing pages…" : `Reading page ${page} of ${total}…`);
      });
      setText(result.text);
      setStatus(result.text.trim() ? "Done — copy or download. English model loaded from a public CDN; the file stayed here." : "No text found.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "OCR failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6">
      <DropZone
        multiple
        media="document"
        label="Drop images or a PDF"
        hint={`${tool.name}: English OCR runs in this tab. A public language model is downloaded once; your file is not uploaded.`}
        onFiles={(next) => setFiles((prev) => [...prev, ...next])}
      />
      {files.length ? (
        <p className="text-sm text-[var(--ink-soft)]">{files.map((f) => f.name).join(" · ")}</p>
      ) : null}
      <div className="flex flex-wrap items-end gap-4">
        <label className="grid gap-2 text-sm">
          Language
          <select className="field min-w-40" value={lang} onChange={(event) => setLang(event.target.value)}>
            <option value="eng">English</option>
          </select>
        </label>
        <button type="button" className="btn btn-primary" disabled={!files.length || busy} onClick={run}>
          {busy ? "Reading…" : "Extract text"}
        </button>
        {text ? (
          <>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => downloadBlob(new Blob([text], { type: "text/plain;charset=utf-8" }), "ocr.txt")}
            >
              Download TXT
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={async () => downloadBlob(await textToDocx([text], "OCR"), "ocr.docx")}
            >
              Download Word
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => navigator.clipboard.writeText(text)}
            >
              Copy
            </button>
          </>
        ) : null}
      </div>
      {status ? <p className="text-sm text-[var(--ink-soft)]">{status}</p> : null}
      {error ? <p className="text-sm text-brand">{error}</p> : null}
      {text ? (
        <textarea className="field min-h-[320px] font-mono text-sm" value={text} onChange={(event) => setText(event.target.value)} />
      ) : null}
    </div>
  );
}
