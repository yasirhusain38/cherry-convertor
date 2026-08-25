"use client";

import { GradeControls } from "@/components/GradeControls";
import { WatermarkPanel } from "@/components/WatermarkPanel";
import { cloneEnhance, DEFAULT_ENHANCE, type EnhanceSettings } from "@/lib/enhance";
import { clamp } from "@/lib/format";

export function EnhanceBar({
  value,
  onChange,
  focus = "all",
  matchAmount = 0,
  hasReference = false,
  onMatchAmount,
  onReference,
}: {
  value: EnhanceSettings;
  onChange: (next: EnhanceSettings) => void;
  focus?: "all" | "rotate" | "flip" | "bw" | "watermark";
  matchAmount?: number;
  hasReference?: boolean;
  onMatchAmount?: (n: number) => void;
  onReference?: (file: File | null) => void;
}) {
  function patch(partial: Partial<EnhanceSettings>) {
    onChange({ ...value, ...partial });
  }

  const rotate = ((value.rotate % 360) + 360) % 360;

  return (
    <div className="grid gap-6 md:col-span-2">
      <p className="label">Transform</p>
      <label className="grid gap-2 text-sm">
        <span className="flex items-center justify-between gap-3">
          <span>Rotate (0–360°)</span>
          <input
            className="field h-9 w-24 px-2 text-right"
            type="number"
            min={0}
            max={360}
            step={0.1}
            value={Number(rotate.toFixed(1))}
            onChange={(event) => {
              const n = Number(event.target.value);
              if (Number.isFinite(n)) patch({ rotate: clamp(n, 0, 360) });
            }}
          />
        </span>
        <input
          type="range"
          min={0}
          max={360}
          step={0.1}
          value={rotate}
          onChange={(event) => patch({ rotate: Number(event.target.value) })}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        {([0, 45, 90, 180, 270] as const).map((deg) => (
          <button
            key={deg}
            type="button"
            className={`btn min-h-10 px-3 ${Math.abs(rotate - deg) < 0.05 ? "btn-primary" : "btn-ghost"}`}
            onClick={() => patch({ rotate: deg })}
          >
            {deg}°
          </button>
        ))}
        <button
          type="button"
          className={`btn min-h-10 px-3 ${value.flipH ? "btn-primary" : "btn-ghost"}`}
          onClick={() => patch({ flipH: !value.flipH })}
        >
          Flip H
        </button>
        <button
          type="button"
          className={`btn min-h-10 px-3 ${value.flipV ? "btn-primary" : "btn-ghost"}`}
          onClick={() => patch({ flipV: !value.flipV })}
        >
          Flip V
        </button>
        <button type="button" className="btn btn-ghost min-h-10 px-3" onClick={() => onChange(cloneEnhance(DEFAULT_ENHANCE))}>
          Reset
        </button>
      </div>

      {onReference ? (
        <div className="grid gap-3">
          <p className="label">Match look from a reference</p>
          <p className="text-sm leading-6 text-[var(--ink-soft)]">
            Drop a still whose colour you want. The editor copies its mean and contrast onto your photo — locally, no
            upload.
          </p>
          <input
            className="field"
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              onReference(file);
              event.currentTarget.value = "";
            }}
          />
          {hasReference && onMatchAmount ? (
            <label className="grid gap-2 text-sm">
              <span className="flex justify-between">
                <span>Match strength</span>
                <span>{matchAmount}%</span>
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={matchAmount}
                onChange={(event) => onMatchAmount(Number(event.target.value))}
              />
            </label>
          ) : null}
        </div>
      ) : null}

      {focus === "watermark" ? <WatermarkPanel value={value} onChange={onChange} /> : null}

      <GradeControls value={value} onChange={onChange} />

      {focus === "watermark" ? null : <WatermarkPanel value={value} onChange={onChange} />}
    </div>
  );
}
