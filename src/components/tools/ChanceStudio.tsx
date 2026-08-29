"use client";

import { useMemo, useState } from "react";
import { parseWheelLines, randomInt } from "@/lib/chance";
import type { ToolDef } from "@/lib/tools";

const WHEEL_COLORS = ["#F2013F", "#221F1F", "#B81D24", "#3a3737"];

export function ChanceStudio({ tool }: { tool: ToolDef }) {
  return tool.slug.includes("toss") ? <CoinToss /> : <SpinWheel />;
}

function SpinWheel() {
  const [raw, setRaw] = useState("Yes\nNo\nLater\nAsk again");
  const [turn, setTurn] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const options = useMemo(() => parseWheelLines(raw), [raw]);
  const slice = options.length ? 360 / options.length : 360;

  function spin() {
    if (spinning || options.length < 2) return;
    const index = randomInt(options.length);
    const extra = 360 * (5 + randomInt(3));
    const target = extra + (360 - (index * slice + slice / 2));
    setSpinning(true);
    setWinner(null);
    setTurn((prev) => prev + target);
    window.setTimeout(() => {
      setWinner(options[index]!);
      setSpinning(false);
    }, 4200);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
      <div className="grid place-items-center gap-4">
        <p className="text-sm text-[var(--ink-soft)]">crypto.getRandomValues in this tab. 0 uploads.</p>
        <div className="relative">
          <div className="absolute left-1/2 top-0 z-10 h-0 w-0 -translate-x-1/2 -translate-y-1 border-x-[10px] border-t-[16px] border-x-transparent border-t-[#F5F5F1]" />
          <div
            className="h-[min(72vw,320px)] w-[min(72vw,320px)] rounded-full border-4 border-[#F5F5F1] shadow-[0_0_0_6px_#F2013F]"
            style={{
              background: conic(options),
              transform: `rotate(${turn}deg)`,
              transition: spinning ? "transform 4.2s cubic-bezier(0.12, 0.82, 0.08, 1)" : "none",
            }}
            role="img"
            aria-label="Decision wheel"
          />
        </div>
        <button type="button" className="btn btn-primary" disabled={spinning || options.length < 2} onClick={spin}>
          {spinning ? "Spinning…" : "Spin the wheel"}
        </button>
        {winner ? (
          <p className="display text-4xl text-[#F2013F]" aria-live="polite">
            {winner}
          </p>
        ) : null}
      </div>
      <label className="grid gap-2 text-sm">
        One option per line
        <textarea
          className="field min-h-[280px] font-mono text-sm"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
        />
        <span className="text-[var(--ink-soft)]">{options.length} slices (2–40)</span>
      </label>
    </div>
  );
}

function conic(options: string[]): string {
  if (!options.length) return "#221F1F";
  const parts = options.map((label, i) => {
    const color = WHEEL_COLORS[i % WHEEL_COLORS.length]!;
    const a = (i / options.length) * 360;
    const b = ((i + 1) / options.length) * 360;
    void label;
    return `${color} ${a}deg ${b}deg`;
  });
  return `conic-gradient(from -90deg, ${parts.join(", ")})`;
}

function CoinToss() {
  const [face, setFace] = useState<"Heads" | "Tails" | null>(null);
  const [flips, setFlips] = useState(0);
  const [spin, setSpin] = useState(0);
  const [busy, setBusy] = useState(false);

  function toss() {
    if (busy) return;
    const next = randomInt(2) === 0 ? "Heads" : "Tails";
    setBusy(true);
    setFace(null);
    setSpin((n) => {
      const base = Math.ceil(n / 360) * 360;
      return base + 1800 + (next === "Tails" ? 180 : 0);
    });
    window.setTimeout(() => {
      setFace(next);
      setFlips((n) => n + 1);
      setBusy(false);
    }, 900);
  }

  return (
    <div className="grid place-items-center gap-6">
      <p className="text-sm text-[var(--ink-soft)]">Fair coin. crypto.getRandomValues. Nothing is uploaded.</p>
      <button
        type="button"
        className="grid h-40 w-40 place-items-center rounded-full border-4 border-[#F5F5F1] bg-[#F2013F] text-2xl text-[#F5F5F1]"
        style={{
          transform: `rotateY(${spin}deg)`,
          transition: busy ? "transform 0.9s cubic-bezier(0.2, 0.8, 0.2, 1)" : "none",
        }}
        onClick={toss}
        disabled={busy}
      >
        {busy ? "…" : face ?? "Toss"}
      </button>
      <button type="button" className="btn btn-primary" disabled={busy} onClick={toss}>
        {busy ? "In the air…" : "Flip the coin"}
      </button>
      {face ? (
        <p className="display text-5xl" aria-live="polite">
          {face}
        </p>
      ) : null}
      <p className="text-sm text-[var(--ink-soft)]">{flips} toss{flips === 1 ? "" : "es"} this session</p>
    </div>
  );
}
