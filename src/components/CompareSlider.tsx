"use client";

import { useRef, useState } from "react";
import { clamp } from "@/lib/format";

type CompareSliderProps = {
  beforeUrl: string;
  afterUrl: string;
  beforeAlt?: string;
  afterAlt?: string;
};

export function CompareSlider({
  beforeUrl,
  afterUrl,
  beforeAlt = "Original",
  afterAlt = "Processed",
}: CompareSliderProps) {
  const [pos, setPos] = useState(52);
  const frameRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  function setFromClientX(clientX: number) {
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    if (rect.width < 1) return;
    setPos(clamp(((clientX - rect.left) / rect.width) * 100, 1, 99));
  }

  return (
    <div className="relative overflow-hidden rounded-[16px] border border-[var(--line)] bg-[#221F1F]">
      <div
        ref={frameRef}
        className="relative aspect-[4/3] w-full touch-none cursor-ew-resize select-none"
        onPointerDown={(event) => {
          dragging.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          setFromClientX(event.clientX);
        }}
        onPointerMove={(event) => {
          if (!dragging.current) return;
          setFromClientX(event.clientX);
        }}
        onPointerUp={() => {
          dragging.current = false;
        }}
        onPointerCancel={() => {
          dragging.current = false;
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={beforeUrl}
          alt={beforeAlt}
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full object-contain"
        />
        <div className="pointer-events-none absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={afterUrl} alt={afterAlt} draggable={false} className="h-full w-full object-contain" />
        </div>
        <div
          className="pointer-events-none absolute inset-y-0 z-10 w-px bg-[#F5F5F1]"
          style={{ left: `${pos}%` }}
        >
          <div className="absolute top-1/2 left-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#F5F5F1]/70 bg-[#F2013F] text-[10px] tracking-[0.14em] text-[#F5F5F1] uppercase">
            Drag
          </div>
        </div>
      </div>
      <div className="flex justify-between border-t border-[var(--line)] bg-[#221F1F] px-4 py-2 text-[10px] tracking-[0.18em] text-[#F5F5F1]/70 uppercase">
        <span>Original</span>
        <span>Processed · drag to compare</span>
      </div>
    </div>
  );
}
