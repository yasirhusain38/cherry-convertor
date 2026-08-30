"use client";

import { useEffect, useRef, useState } from "react";
import { LiveSpeedProvider, useLiveSpeed } from "@/components/LiveSpeed";
import { connectionHint, formatMbps, formatMs, runSpeedTest, type SpeedProgress } from "@/lib/speed-test";
import type { ToolDef } from "@/lib/tools";

export function SpeedTest({ tool }: { tool: ToolDef }) {
  return (
    <LiveSpeedProvider>
      <SpeedTestBody tool={tool} />
    </LiveSpeedProvider>
  );
}

function SpeedTestBody({ tool }: { tool: ToolDef }) {
  const { snap, setHot, setPaused } = useLiveSpeed();
  const [deep, setDeep] = useState<SpeedProgress>({ phase: "idle" });
  const [meta, setMeta] = useState<{ colo?: string; loc?: string; ipHint?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  void tool;

  useEffect(() => {
    setHot(true);
    setPaused(false);
    setHint(connectionHint());
    return () => setHot(false);
  }, [setHot, setPaused]);

  async function startDeep() {
    abort.current?.abort();
    const ac = new AbortController();
    abort.current = ac;
    setError(null);
    setDeep({ phase: "ping", note: "Full pass against Cloudflare…" });
    try {
      const result = await runSpeedTest(setDeep, ac.signal);
      setMeta({ colo: result.colo, loc: result.loc, ipHint: result.ipHint });
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        setDeep({ phase: "idle", note: "Stopped." });
        return;
      }
      setDeep({ phase: "error" });
      setError(
        err instanceof Error
          ? err.message
          : "Could not reach the speed-test host. A firewall or extension may be blocking Cloudflare.",
      );
    }
  }

  const running = deep.phase === "ping" || deep.phase === "download" || deep.phase === "upload";
  const maxPing = Math.max(80, ...snap.history.map((h) => h.ping));
  const maxDown = Math.max(1, ...snap.history.map((h) => h.down ?? 0));

  return (
    <div className="grid gap-6">
      <p className="text-sm leading-6 text-[var(--ink-soft)]">
        Live probes run on this page only. A full test uses larger generated payloads. Photos and
        PDFs are never sent.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Live ping" value={formatMs(snap.pingMs)} />
        <Stat label="Live jitter" value={formatMs(snap.jitterMs)} />
        <Stat label="Live down" value={formatMbps(snap.downloadMbps)} hot />
        <Stat label="Live up" value={formatMbps(snap.uploadMbps)} hot />
      </div>

      {snap.history.length > 2 ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Spark label="Ping" values={snap.history.map((h) => h.ping)} max={maxPing} unit="ms" />
          <Spark
            label="Download"
            values={snap.history.map((h) => h.down ?? 0)}
            max={maxDown}
            unit="Mbps"
          />
        </div>
      ) : (
        <p className="text-sm text-[var(--ink-soft)]">Collecting live samples…</p>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn btn-primary" disabled={running} onClick={() => void startDeep()}>
          {running ? "Full test…" : "Run a full test"}
        </button>
        {running ? (
          <button type="button" className="btn btn-ghost" onClick={() => abort.current?.abort()}>
            Stop
          </button>
        ) : null}
      </div>

      {deep.phase !== "idle" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Full ping" value={formatMs(deep.pingMs)} />
          <Stat label="Full jitter" value={formatMs(deep.jitterMs)} />
          <Stat label="Full down" value={formatMbps(deep.downloadMbps)} hot />
          <Stat label="Full up" value={formatMbps(deep.uploadMbps)} hot />
        </div>
      ) : null}

      {deep.note ? <p className="text-sm text-[var(--ink-soft)]">{deep.note}</p> : null}
      {meta.colo || meta.loc ? (
        <p className="text-sm text-[var(--ink-soft)]">
          Cloudflare colo {meta.colo ?? "—"}
          {meta.loc ? ` · ${meta.loc}` : ""}
          {meta.ipHint ? ` · public IP as seen by the host ${meta.ipHint}` : ""}
        </p>
      ) : null}
      {hint ? <p className="text-sm text-[var(--ink-soft)]">{hint}</p> : null}
      {error ? <p className="text-sm text-brand">{error}</p> : null}
    </div>
  );
}

function Stat({ label, value, hot }: { label: string; value: string; hot?: boolean }) {
  return (
    <div className="card p-5">
      <p className="label">{label}</p>
      <p className={`stat mt-2 text-3xl ${hot ? "text-[#F2013F]" : ""}`}>{value}</p>
    </div>
  );
}

function Spark({
  label,
  values,
  max,
  unit,
}: {
  label: string;
  values: number[];
  max: number;
  unit: string;
}) {
  const w = 320;
  const h = 64;
  const pts = values
    .map((v, i) => {
      const x = values.length === 1 ? 0 : (i / (values.length - 1)) * w;
      const y = h - (Math.max(0, v) / max) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  const last = values[values.length - 1];
  return (
    <div className="card p-4">
      <p className="label">
        {label} · {last != null ? `${last.toFixed(unit === "ms" ? 0 : 1)} ${unit}` : "—"}
      </p>
      <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 h-16 w-full" aria-hidden>
        <polyline fill="none" stroke="#F2013F" strokeWidth="2" points={pts} />
      </svg>
    </div>
  );
}
