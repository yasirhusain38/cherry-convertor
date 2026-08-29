"use client";

import { useState } from "react";
import { normalizeCheckUrl, probeFromBrowser, type ProbeResult } from "@/lib/status-check";
import type { ToolDef } from "@/lib/tools";

export function ServerDown({ tool }: { tool: ToolDef }) {
  void tool;
  const [input, setInput] = useState("https://www.cherryconverter.com");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ProbeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const url = normalizeCheckUrl(input);
      setResult(await probeFromBrowser(url));
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Could not check that host.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6">
      <p className="text-sm leading-6 text-[var(--ink-soft)]">
        This is a <strong>reachability check from this browser</strong>, not a global outage map
        and not a file tool. Cherry Converter does not proxy or log the URL. Your photos stay
        untouched.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <label className="grid min-w-[16rem] flex-1 gap-2 text-sm">
          Hostname or URL
          <input
            className="field"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void run();
            }}
            placeholder="example.com"
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void run()}>
          {busy ? "Checking…" : "Check from this browser"}
        </button>
      </div>
      {result ? (
        <div className="card p-6">
          <p className="label">{labelFor(result.status)}</p>
          <p className="mt-3 display text-4xl">{headline(result.status)}</p>
          <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">{result.detail}</p>
          <p className="mt-2 font-mono text-xs text-[var(--ink-faint)]">{result.url}</p>
        </div>
      ) : null}
      {error ? <p className="text-sm text-brand">{error}</p> : null}
    </div>
  );
}

function headline(status: ProbeResult["status"]) {
  if (status === "up" || status === "blocked") return "Reachable from here";
  if (status === "offline") return "You are offline";
  if (status === "invalid") return "Invalid URL";
  return "Not reachable from here";
}

function labelFor(status: ProbeResult["status"]) {
  if (status === "up") return "HTTP response";
  if (status === "blocked") return "Network answered · CORS opaque";
  if (status === "offline") return "Device";
  return "Failed";
}
