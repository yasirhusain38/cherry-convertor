"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolDef } from "@/lib/tools";

const BUTTONS = [
  { bit: 0, label: "Left" },
  { bit: 1, label: "Middle" },
  { bit: 2, label: "Right" },
  { bit: 3, label: "Back" },
  { bit: 4, label: "Forward" },
];

type Point = { x: number; y: number };

export function MouseChecker({ tool }: { tool: ToolDef }) {
  void tool;
  const [pos, setPos] = useState<Point>({ x: 0, y: 0 });
  const [down, setDown] = useState(0);
  const [clicks, setClicks] = useState(0);
  const [cps, setCps] = useState(0);
  const [dbl, setDbl] = useState<number | null>(null);
  const [scroll, setScroll] = useState({ y: 0, x: 0 });
  const [ready, setReady] = useState(false);
  const times = useRef<number[]>([]);
  const lastClick = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trail = useRef<Point[]>([]);

  useEffect(() => {
    setReady(true);
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
      trail.current.push(p);
      if (trail.current.length > 80) trail.current.shift();
      drawTrail();
    };
    const onDown = (event: PointerEvent) => {
      setDown(event.buttons);
    };
    const onUp = (event: PointerEvent) => {
      setDown(event.buttons);
    };
    const onClick = () => {
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
    };
    const onWheel = (event: WheelEvent) => {
      setScroll((s) => ({ y: s.y + event.deltaY, x: s.x + event.deltaX }));
    };
    const onContext = (event: MouseEvent) => event.preventDefault();
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("click", onClick);
    window.addEventListener("auxclick", onAux);
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("contextmenu", onContext);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("click", onClick);
      window.removeEventListener("auxclick", onAux);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("contextmenu", onContext);
    };
  }, [drawTrail, ready]);

  return (
    <div className="grid gap-6">
      <p className="text-sm text-[var(--ink-soft)]">
        Pointer events stay in this tab. Right-click menu is blocked here so button 2 can be tested.
        0 uploads.
      </p>
      <div className="grid gap-3 sm:grid-cols-5">
        {BUTTONS.map((btn) => {
          const on = (down & (1 << btn.bit)) !== 0;
          return (
            <div
              key={btn.bit}
              className={`card px-4 py-6 text-center text-sm ${on ? "bg-[#F2013F] text-[#F5F5F1]" : ""}`}
            >
              <p className="label">{btn.label}</p>
              <p className="mt-2">{on ? "Down" : "Up"}</p>
            </div>
          );
        })}
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <dt className="label">{label}</dt>
      <dd className="stat mt-1 text-2xl">{value}</dd>
    </div>
  );
}
