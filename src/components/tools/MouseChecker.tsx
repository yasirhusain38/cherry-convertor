"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import type { ToolDef } from "@/lib/tools";

const BUTTONS = [
  { bit: 0, label: "Left" },
  { bit: 1, label: "Middle" },
  { bit: 2, label: "Right" },
  { bit: 3, label: "Back" },
  { bit: 4, label: "Forward" },
] as const;

type Point = { x: number; y: number };

function isOn(mask: number, bit: number) {
  return (mask & (1 << bit)) !== 0;
}

export function MouseChecker({ tool }: { tool: ToolDef }) {
  void tool;
  const [pos, setPos] = useState<Point>({ x: 0, y: 0 });
  const [down, setDown] = useState(0);
  const [flash, setFlash] = useState(0);
  const [clicks, setClicks] = useState(0);
  const [cps, setCps] = useState(0);
  const [dbl, setDbl] = useState<number | null>(null);
  const [scroll, setScroll] = useState({ y: 0, x: 0 });
  const [wheelDir, setWheelDir] = useState<"up" | "down" | "left" | "right" | null>(null);
  const [ready, setReady] = useState(false);
  const times = useRef<number[]>([]);
  const lastClick = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trail = useRef<Point[]>([]);
  const flashTimers = useRef<number[]>([]);

  useEffect(() => {
    setReady(true);
    return () => {
      for (const id of flashTimers.current) window.clearTimeout(id);
    };
  }, []);

  const pulse = useCallback((bit: number) => {
    setFlash((prev) => prev | (1 << bit));
    const id = window.setTimeout(() => {
      setFlash((prev) => prev & ~(1 << bit));
    }, 280);
    flashTimers.current.push(id);
  }, []);

  const drawTrail = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width, height } = canvas;
    ctx.fillStyle = "#221F1F";
    ctx.fillRect(0, 0, width, height);
    const pts = trail.current;
    if (pts.length < 2) return;
    ctx.strokeStyle = "#F2013F";
    ctx.lineWidth = 2;
    ctx.beginPath();
    pts.forEach((p, i) => {
      const x = (p.x / window.innerWidth) * width;
      const y = (p.y / window.innerHeight) * height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, []);

  useEffect(() => {
    if (!ready) return;
    const onMove = (event: PointerEvent) => {
      const p = { x: event.clientX, y: event.clientY };
      setPos(p);
      setDown(event.buttons);
      trail.current.push(p);
      if (trail.current.length > 80) trail.current.shift();
      drawTrail();
    };
    const onDown = (event: PointerEvent) => {
      const bit = event.button;
      setDown(event.buttons || (1 << bit));
      if (bit >= 0 && bit <= 4) pulse(bit);
    };
    const onUp = (event: PointerEvent) => {
      setDown(event.buttons);
    };
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0) return;
      const now = performance.now();
      times.current.push(now);
      times.current = times.current.filter((t) => now - t < 1000);
      setClicks((n) => n + 1);
      setCps(times.current.length);
      if (lastClick.current) setDbl(now - lastClick.current);
      lastClick.current = now;
    };
    const onAux = (event: MouseEvent) => {
      event.preventDefault();
      pulse(event.button);
    };
    const onWheel = (event: WheelEvent) => {
      setScroll((s) => ({ y: s.y + event.deltaY, x: s.x + event.deltaX }));
      if (Math.abs(event.deltaY) >= Math.abs(event.deltaX)) {
        setWheelDir(event.deltaY < 0 ? "up" : "down");
      } else {
        setWheelDir(event.deltaX < 0 ? "left" : "right");
      }
      pulse(1);
    };
    const onContext = (event: MouseEvent) => event.preventDefault();
    const opts = { capture: true } as const;
    window.addEventListener("pointermove", onMove, { passive: true, capture: true });
    window.addEventListener("pointerdown", onDown, opts);
    window.addEventListener("pointerup", onUp, opts);
    window.addEventListener("pointercancel", onUp, opts);
    window.addEventListener("click", onClick, opts);
    window.addEventListener("auxclick", onAux, opts);
    window.addEventListener("wheel", onWheel, { passive: true, capture: true });
    window.addEventListener("contextmenu", onContext, opts);
    return () => {
      window.removeEventListener("pointermove", onMove, true);
      window.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("pointerup", onUp, true);
      window.removeEventListener("pointercancel", onUp, true);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("auxclick", onAux, true);
      window.removeEventListener("wheel", onWheel, true);
      window.removeEventListener("contextmenu", onContext, true);
    };
  }, [drawTrail, pulse, ready]);

  const live = BUTTONS.filter((btn) => isOn(down | flash, btn.bit)).map((btn) => btn.label);
  const lit = down | flash;

  return (
    <div className="grid gap-6">
      <p className="text-sm text-[var(--ink-soft)]">
        Click anywhere on this page. The mouse below lights the button you press. Right-click menu
        is blocked here so button 2 can be tested. 0 uploads.
      </p>

      <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,280px)_1fr]">
        <MouseFigure
          left={isOn(lit, 0)}
          middle={isOn(lit, 1)}
          right={isOn(lit, 2)}
          back={isOn(lit, 3)}
          forward={isOn(lit, 4)}
          wheel={wheelDir}
        />
        <div className="grid gap-4">
          <p className="display text-3xl tracking-tight" aria-live="polite">
            {live.length ? live.join(" + ") : "Waiting for a click"}
          </p>
          <p className="text-sm text-[var(--ink-soft)]">
            {down
              ? "Held down right now."
              : flash
                ? "Just pressed — watch it blink."
                : "Press left, right, middle, back, or forward."}
          </p>
          <div className="grid gap-3 sm:grid-cols-5">
            {BUTTONS.map((btn) => {
              const on = isOn(lit, btn.bit);
              return (
                <div
                  key={btn.bit}
                  className={`card px-4 py-5 text-center text-sm ${on ? "bg-[#F2013F] text-[#F5F5F1]" : ""}`}
                  style={on ? { animation: "mouse-btn-blink 0.45s ease-in-out infinite" } : undefined}
                >
                  <p className="label">{btn.label}</p>
                  <p className="mt-2">{on ? "Down" : "Up"}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="X" value={ready ? String(Math.round(pos.x)) : "—"} />
        <Stat label="Y" value={ready ? String(Math.round(pos.y)) : "—"} />
        <Stat label="Clicks" value={String(clicks)} />
        <Stat label="CPS" value={String(cps)} />
        <Stat label="Last gap" value={dbl != null ? `${Math.round(dbl)} ms` : "—"} />
        <Stat label="Scroll Y" value={String(Math.round(scroll.y))} />
      </dl>
      <canvas
        ref={canvasRef}
        width={640}
        height={180}
        className="h-40 w-full rounded-[16px] border border-[var(--line)]"
        aria-label="Mouse trail"
      />
      <button
        type="button"
        className="btn btn-ghost w-fit"
        onClick={() => {
          setClicks(0);
          setCps(0);
          setDbl(null);
          setScroll({ x: 0, y: 0 });
          setWheelDir(null);
          times.current = [];
          trail.current = [];
          drawTrail();
        }}
      >
        Reset counters
      </button>
    </div>
  );
}

function MouseFigure({
  left,
  middle,
  right,
  back,
  forward,
  wheel,
}: {
  left: boolean;
  middle: boolean;
  right: boolean;
  back: boolean;
  forward: boolean;
  wheel: "up" | "down" | "left" | "right" | null;
}) {
  const hot = (on: boolean) => (on ? "#F2013F" : "#3a3737");
  const blink = (on: boolean): CSSProperties | undefined =>
    on ? { animation: "mouse-btn-blink 0.45s ease-in-out infinite" } : undefined;

  return (
    <div className="mx-auto w-full max-w-[280px]">
      <svg viewBox="0 0 220 320" className="h-auto w-full" role="img" aria-label="Mouse with live buttons">
        <ellipse cx="110" cy="188" rx="78" ry="112" fill="#2c2929" stroke="#F5F5F1" strokeWidth="3" />
        <path d="M32 140 C32 72 110 48 110 48 C110 48 188 72 188 140" fill="#2c2929" stroke="#F5F5F1" strokeWidth="3" />
        <rect
          x="40"
          y="58"
          width="64"
          height="88"
          rx="18"
          fill={hot(left)}
          stroke="#F5F5F1"
          strokeWidth="2"
          style={blink(left)}
        />
        <rect
          x="116"
          y="58"
          width="64"
          height="88"
          rx="18"
          fill={hot(right)}
          stroke="#F5F5F1"
          strokeWidth="2"
          style={blink(right)}
        />
        <rect
          x="98"
          y="70"
          width="24"
          height="64"
          rx="12"
          fill={hot(middle)}
          stroke="#F5F5F1"
          strokeWidth="2"
          style={blink(middle)}
        />
        <circle cx="110" cy="102" r="7" fill={middle ? "#F5F5F1" : "#F2013F"} />
        {wheel === "up" ? <path d="M110 78 l-6 8 h12 z" fill="#F5F5F1" /> : null}
        {wheel === "down" ? <path d="M110 126 l-6 -8 h12 z" fill="#F5F5F1" /> : null}
        <rect
          x="18"
          y="168"
          width="16"
          height="28"
          rx="6"
          fill={hot(back)}
          stroke="#F5F5F1"
          strokeWidth="2"
          style={blink(back)}
        />
        <rect
          x="18"
          y="204"
          width="16"
          height="28"
          rx="6"
          fill={hot(forward)}
          stroke="#F5F5F1"
          strokeWidth="2"
          style={blink(forward)}
        />
        <text x="72" y="110" textAnchor="middle" fill="#F5F5F1" fontSize="11" letterSpacing="0.12em">
          L
        </text>
        <text x="148" y="110" textAnchor="middle" fill="#F5F5F1" fontSize="11" letterSpacing="0.12em">
          R
        </text>
        <text x="26" y="186" textAnchor="middle" fill="#F5F5F1" fontSize="8">
          B
        </text>
        <text x="26" y="222" textAnchor="middle" fill="#F5F5F1" fontSize="8">
          F
        </text>
      </svg>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <dt className="label">{label}</dt>
      <dd className="stat mt-1 text-2xl">{value}</dd>
    </div>
  );
}
