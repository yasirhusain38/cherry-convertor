"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";

/** Desktop-only pull toward the pointer. Skips touch and reduced-motion. */
export function Magnetic({ children, strength = 12 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  function reset() {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "translate3d(0,0,0)";
  }

  function onMove(event: PointerEvent<HTMLSpanElement>) {
    if (event.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width - 0.5) * strength;
    const y = ((event.clientY - box.top) / box.height - 0.5) * strength;
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }

  return (
    <span
      ref={ref}
      className="inline-flex will-change-transform"
      style={{ transition: "transform 140ms ease" }}
      onPointerMove={onMove}
      onPointerLeave={reset}
    >
      {children}
    </span>
  );
}
