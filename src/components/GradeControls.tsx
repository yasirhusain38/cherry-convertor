"use client";

import { useEffect, useRef } from "react";
import { clamp } from "@/lib/format";
import {
  DEFAULT_GRADE,
  LOOKS,
  type GradeSettings,
  type Histogram,
  type LookPreset,
} from "@/lib/grade";
import { cloneEnhance, DEFAULT_ENHANCE, type EnhanceSettings } from "@/lib/enhance";

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="flex items-center justify-between gap-3">
        <span>{label}</span>
        <input
          className="field h-9 w-[4.5rem] px-2 text-right"
          type="number"
          min={min}
          max={max}
          step={step}
          value={Number.isInteger(step) ? value : Math.round(value / step) * step}
          onChange={(event) => {
            const n = Number(event.target.value);
            if (Number.isFinite(n)) onChange(clamp(n, min, max));
          }}
        />
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

export function HistogramView({ hist }: { hist: Histogram | null }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !hist) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#221F1F";
    ctx.fillRect(0, 0, w, h);
    const max = Math.max(
      1,
      ...Array.from(hist.y),
      ...Array.from(hist.r),
      ...Array.from(hist.g),
      ...Array.from(hist.b),
    );
    const draw = (channel: Float32Array, color: string) => {
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let i = 0; i < 256; i += 1) {
        const x = (i / 255) * w;
        const y = h - (channel[i] / max) * h * 0.92;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    };
    draw(hist.r, "rgba(242,1,63,0.35)");
    draw(hist.g, "rgba(80,200,120,0.28)");
    draw(hist.b, "rgba(80,140,255,0.28)");
    draw(hist.y, "rgba(245,245,241,0.22)");
  }, [hist]);

  return (
    <canvas
      ref={ref}
      width={320}
      height={72}
      className="h-[72px] w-full rounded-[10px] border border-[var(--line)]"
      aria-hidden
    />
  );
}

export function GradeControls({
  value,
  onChange,
}: {
  value: EnhanceSettings;
  onChange: (next: EnhanceSettings) => void;
  compact?: boolean;
}) {
  const grade = { ...DEFAULT_GRADE, ...value.grade };

  function patch(partial: Partial<EnhanceSettings>) {
    onChange({ ...value, ...partial, grade: { ...grade, ...(partial.grade ?? {}) } });
  }

  function patchGrade(partial: Partial<GradeSettings>) {
    onChange({ ...value, grade: { ...grade, ...partial } });
  }

  function applyLook(look: LookPreset) {
    onChange({
      ...value,
      contrast: look.contrast ?? 100,
      saturation: look.saturation ?? 100,
      brightness: look.brightness ?? 100,
      grayscale: look.grayscale ?? false,
      sepia: look.sepia ?? 0,
      grade: { ...DEFAULT_GRADE, ...look.grade },
    });
  }

  return (
    <div className="grid gap-6">
      <div>
        <p className="label">Looks</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {LOOKS.map((look) => (
            <button
              key={look.id}
              type="button"
              className="btn btn-ghost min-h-10 px-3"
              title={look.note}
              onClick={() => applyLook(look)}
            >
              {look.label}
            </button>
          ))}
        </div>
      </div>

      <p className="label">Primary</p>
      <div className="grid gap-4 md:grid-cols-2">
        <Slider label="Exposure" min={-2} max={2} step={0.05} value={grade.exposure} onChange={(n) => patchGrade({ exposure: n })} />
        <Slider label="Brightness" min={40} max={180} value={value.brightness} onChange={(n) => patch({ brightness: n })} />
        <Slider label="Contrast" min={40} max={180} value={value.contrast} onChange={(n) => patch({ contrast: n })} />
        <Slider label="Highlights" min={-100} max={100} value={grade.highlights} onChange={(n) => patchGrade({ highlights: n })} />
        <Slider label="Shadows" min={-100} max={100} value={grade.shadows} onChange={(n) => patchGrade({ shadows: n })} />
        <Slider label="Whites" min={-100} max={100} value={grade.whites} onChange={(n) => patchGrade({ whites: n })} />
        <Slider label="Blacks" min={-100} max={100} value={grade.blacks} onChange={(n) => patchGrade({ blacks: n })} />
        <Slider label="Temperature" min={-100} max={100} value={grade.temperature} onChange={(n) => patchGrade({ temperature: n })} />
        <Slider label="Tint" min={-100} max={100} value={grade.tint} onChange={(n) => patchGrade({ tint: n })} />
        <Slider label="Saturation" min={0} max={200} value={value.saturation ?? 100} onChange={(n) => patch({ saturation: n })} />
        <Slider label="Vibrance" min={-100} max={100} value={grade.vibrance} onChange={(n) => patchGrade({ vibrance: n })} />
        <Slider label="Hue" min={-180} max={180} value={value.hue ?? 0} onChange={(n) => patch({ hue: n })} />
      </div>

      <p className="label">Lift · gamma · gain</p>
      <div className="grid gap-4 md:grid-cols-3">
        <Slider label="Lift" min={-40} max={40} value={grade.lift} onChange={(n) => patchGrade({ lift: n })} />
        <Slider label="Gamma" min={0.4} max={2.2} step={0.01} value={grade.gamma} onChange={(n) => patchGrade({ gamma: n })} />
        <Slider label="Gain" min={0.5} max={1.5} step={0.01} value={grade.gain} onChange={(n) => patchGrade({ gain: n })} />
      </div>

      <p className="label">Split tone</p>
      <div className="grid gap-4 md:grid-cols-2">
        <Slider label="Shadow hue" min={0} max={360} value={grade.splitShadowHue} onChange={(n) => patchGrade({ splitShadowHue: n })} />
        <Slider label="Shadow sat" min={0} max={100} value={grade.splitShadowSat} onChange={(n) => patchGrade({ splitShadowSat: n })} />
        <Slider label="Highlight hue" min={0} max={360} value={grade.splitHighlightHue} onChange={(n) => patchGrade({ splitHighlightHue: n })} />
        <Slider label="Highlight sat" min={0} max={100} value={grade.splitHighlightSat} onChange={(n) => patchGrade({ splitHighlightSat: n })} />
      </div>

      <p className="label">Finish</p>
      <div className="grid gap-4 md:grid-cols-2">
        <Slider label="Fade" min={0} max={100} value={grade.fade} onChange={(n) => patchGrade({ fade: n })} />
        <Slider label="Vignette" min={0} max={100} value={grade.vignette} onChange={(n) => patchGrade({ vignette: n })} />
        <Slider label="Grain" min={0} max={100} value={grade.grain} onChange={(n) => patchGrade({ grain: n })} />
        <Slider label="Sharpen" min={0} max={100} value={grade.sharpen} onChange={(n) => patchGrade({ sharpen: n })} />
        <Slider label="Sepia" min={0} max={100} value={value.sepia ?? 0} onChange={(n) => patch({ sepia: n })} />
        <Slider label="Blur" min={0} max={24} value={value.blur ?? 0} onChange={(n) => patch({ blur: n })} />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`btn min-h-10 px-3 ${value.grayscale ? "btn-primary" : "btn-ghost"}`}
          onClick={() => patch({ grayscale: !value.grayscale })}
        >
          B&W
        </button>
        <button
          type="button"
          className={`btn min-h-10 px-3 ${value.invert ? "btn-primary" : "btn-ghost"}`}
          onClick={() => patch({ invert: !value.invert })}
        >
          Invert
        </button>
        <button type="button" className="btn btn-ghost min-h-10 px-3" onClick={() => onChange(cloneEnhance(DEFAULT_ENHANCE))}>
          Reset grade
        </button>
      </div>
    </div>
  );
}
