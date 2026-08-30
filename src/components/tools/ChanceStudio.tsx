"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { parseWheelSlices, randomInt, sliceAngles, weightedIndex, type WheelSlice } from "@/lib/chance";
import type { ToolDef } from "@/lib/tools";

const WHEEL_COLORS = ["#F2013F", "#F5F5F1", "#B81D24", "#3a3737"];

export function ChanceStudio({ tool }: { tool: ToolDef }) {
  return tool.slug.includes("toss") ? <CoinToss /> : <SpinWheel />;
}

function SpinWheel() {
  const [raw, setRaw] = useState("Yes\nNo\nLater\nAsk again");
  const [turn, setTurn] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const slices = useMemo(() => parseWheelSlices(raw), [raw]);
  const angles = useMemo(() => sliceAngles(slices.map((s) => s.weight)), [slices]);
  const equal = slices.length > 0 && slices.every((s) => s.weight === slices[0]!.weight);

  function spin() {
    if (spinning || slices.length < 2) return;
    const index = weightedIndex(slices.map((s) => s.weight));
    const mid = angles[index]?.mid ?? 0;
    const extra = 360 * (5 + randomInt(3));
    setSpinning(true);
    setWinner(null);
    setTurn((prev) => {
      const current = ((prev % 360) + 360) % 360;
      const desired = (360 - mid) % 360;
      let delta = desired - current;
      if (delta <= 0) delta += 360;
      return prev + extra + delta;
    });
    window.setTimeout(() => {
      setWinner(slices[index]!.label);
      setSpinning(false);
    }, 4200);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
      <div className="grid place-items-center gap-4">
        <div className="relative">
          <div className="absolute left-1/2 top-0 z-10 h-0 w-0 -translate-x-1/2 -translate-y-1 border-x-[10px] border-t-[16px] border-x-transparent border-t-[#F5F5F1]" />
          <div
            className="h-[min(72vw,320px)] w-[min(72vw,320px)] rounded-full border-4 border-[#F5F5F1] shadow-[0_0_0_6px_#F2013F]"
            style={{
              transform: `rotate(${turn}deg)`,
              transition: spinning ? "transform 4.2s cubic-bezier(0.12, 0.82, 0.08, 1)" : "none",
            }}
          >
            <WheelDisk slices={slices} angles={angles} />
          </div>
        </div>
        <button type="button" className="btn btn-primary" disabled={spinning || slices.length < 2} onClick={spin}>
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
        <span className="text-[var(--ink-soft)]">
          {slices.length} slices (2–40) · {equal ? "equal parts" : "by ratio"}
        </span>
        <span className="text-xs text-[var(--ink-soft)]">
          Equal by default. For a bigger slice write <code>Pizza x3</code> or <code>No:2</code>.
        </span>
      </label>
    </div>
  );
}

const CX = 160;
const CY = 160;
const R = 156;

function polar(degFromTop: number, radius: number) {
  const rad = ((degFromTop - 90) * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) };
}

function slicePath(start: number, end: number): string {
  const span = end - start;
  const large = span > 180 ? 1 : 0;
  const a = polar(start, R);
  const b = polar(end, R);
  if (span >= 359.9) {
    return `M ${CX - R} ${CY} A ${R} ${R} 0 1 1 ${CX + R} ${CY} A ${R} ${R} 0 1 1 ${CX - R} ${CY} Z`;
  }
  return `M ${CX} ${CY} L ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)} Z`;
}

function WheelDisk({
  slices,
  angles,
}: {
  slices: WheelSlice[];
  angles: { start: number; end: number; mid: number }[];
}) {
  if (!slices.length) {
    return <div className="h-full w-full rounded-full bg-[#221F1F]" />;
  }
  return (
    <svg viewBox="0 0 320 320" className="h-full w-full" role="img" aria-label="Decision wheel">
      {slices.map((slice, i) => {
        const ang = angles[i]!;
        const fill = WHEEL_COLORS[i % WHEEL_COLORS.length]!;
        const light = fill === "#F5F5F1";
        const p = polar(ang.mid, slices.length > 8 ? 78 : 88);
        const label = slice.label.length > 14 ? `${slice.label.slice(0, 13)}…` : slice.label;
        return (
          <g key={`${slice.label}-${i}`}>
            <path d={slicePath(ang.start, ang.end)} fill={fill} stroke="#F5F5F1" strokeWidth="1.5" />
            <text
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={light ? "#221F1F" : "#F5F5F1"}
              fontSize={slices.length > 10 ? 11 : 13}
              fontWeight="600"
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
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
      <button
        type="button"
        className="h-40 w-40 border-0 bg-transparent p-0"
        style={{ perspective: 900 }}
        onClick={toss}
        disabled={busy}
        aria-label={busy ? "Coin in the air" : face ? `Landed on ${face}` : "Flip the coin"}
      >
        <span
          className="relative block h-full w-full"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateY(${spin}deg)`,
            transition: busy ? "transform 0.9s cubic-bezier(0.2, 0.8, 0.2, 1)" : "none",
          }}
        >
          <CoinFace legend="HEADS" rim className="bg-[#F2013F] text-[#F5F5F1]" />
          <CoinFace
            legend="TAILS"
            className="bg-[#F5F5F1] text-[#221F1F]"
            style={{ transform: "rotateY(180deg)" }}
          />
        </span>
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

function CoinFace({
  legend,
  className,
  style,
  rim,
}: {
  legend: string;
  className: string;
  style?: CSSProperties;
  rim?: boolean;
}) {
  return (
    <span
      className={`absolute inset-0 grid place-items-center rounded-full border-4 text-[1.35rem] font-semibold tracking-[0.2em] ${
        rim ? "border-[#F5F5F1]" : "border-[#221F1F]"
      } ${className}`}
      style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", ...style }}
    >
      {legend}
    </span>
  );
}
