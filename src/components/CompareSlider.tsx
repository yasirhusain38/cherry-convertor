"use client";

import { useState } from "react";

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

  return (
    <div className="relative overflow-hidden rounded-[16px] border border-[var(--line)] bg-[#221F1F]">
      <div className="relative aspect-[4/3] w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={beforeUrl} alt={beforeAlt} className="absolute inset-0 h-full w-full object-contain" />
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={afterUrl} alt={afterAlt} className="h-full w-full object-contain" />
        </div>
        <div
          className="pointer-events-none absolute inset-y-0 w-px bg-[#F5F5F1]"
          style={{ left: `${pos}%` }}
        >
          <div className="absolute top-1/2 left-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#F5F5F1]/70 bg-[#F2013F] text-[10px] tracking-[0.14em] text-[#F5F5F1] uppercase">
            Drag
          </div>
        </div>
        <input
          type="range"
          min={1}
          max={99}
          value={pos}
          aria-label="Compare original and processed image"
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
          onChange={(event) => setPos(Number(event.target.value))}
        />
      </div>
      <div className="flex justify-between border-t border-[var(--line)] bg-[#221F1F] px-4 py-2 text-[10px] tracking-[0.18em] text-[#F5F5F1]/70 uppercase">
        <span>Original</span>
        <span>Processed</span>
      </div>
    </div>
  );
}
