"use client";

import { useState } from "react";
import { downloadBlob } from "@/lib/download";
import { copyBlob } from "@/lib/export";
import type { ConvertFormat } from "@/lib/formats";
import type { ProcessResult } from "@/lib/image";

export function OutputActions({
  result,
  fileName,
  format,
  busy,
  onFileName,
  compact = false,
}: {
  result: ProcessResult | null;
  fileName: string;
  format: ConvertFormat;
  busy?: boolean;
  onFileName?: (name: string) => void;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const name = `${fileName.replace(/\.[^.]+$/, "") || "image"}-cherry.${format.ext}`;

  return (
    <div className={compact ? "flex flex-wrap items-center gap-2" : "grid gap-3"}>
      {onFileName ? (
        <label className="grid max-w-md gap-2 text-sm">
          Download file name
          <input
            className="field"
            value={fileName}
            placeholder="my-photo"
            onChange={(event) => onFileName(event.target.value)}
          />
        </label>
      ) : null}
      <div className="flex flex-wrap gap-3">
      <button
        type="button"
        className="btn btn-primary"
        disabled={!result || busy || !format.supported}
        onClick={() => {
          if (!result) return;
          downloadBlob(result.blob, name);
        }}
      >
        {busy ? "Working…" : `Download .${format.ext}`}
      </button>
      <button
        type="button"
        className="btn btn-ghost"
        disabled={!result || busy}
        onClick={async () => {
          if (!result) return;
          try {
            await copyBlob(result.blob);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1600);
          } catch {
            setCopied(false);
          }
        }}
      >
        {copied ? "Copied" : "Copy"}
      </button>
      </div>
    </div>
  );
}
