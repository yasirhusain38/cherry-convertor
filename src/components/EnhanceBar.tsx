"use client";

import { WatermarkPanel } from "@/components/WatermarkPanel";
import { DEFAULT_ENHANCE, type EnhanceSettings } from "@/lib/enhance";

export function EnhanceBar({
  value,
  onChange,
  focus = "all",
}: {
  value: EnhanceSettings;
  onChange: (next: EnhanceSettings) => void;
  focus?: "all" | "rotate" | "flip" | "bw" | "watermark";
}) {
  function patch(partial: Partial<EnhanceSettings>) {
    onChange({ ...value, ...partial });
  }

  return (
    <div className="grid gap-5 md:col-span-2">
      <p className="label">Enhance</p>
      <div className="flex flex-wrap gap-2">
        {([0, 90, 180, 270] as const).map((deg) => (
          <button
            key={deg}
            type="button"
            className={`btn min-h-10 px-3 ${value.rotate === deg ? "btn-primary" : "btn-ghost"}`}
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
        <button type="button" className="btn btn-ghost min-h-10 px-3" onClick={() => onChange(DEFAULT_ENHANCE)}>
          Reset
        </button>
      </div>
      <label className="grid gap-2 text-sm">
        Brightness {value.brightness}%
        <input
          type="range"
          min={40}
          max={180}
          value={value.brightness}
          onChange={(event) => patch({ brightness: Number(event.target.value) })}
        />
      </label>
      <label className="grid gap-2 text-sm">
        Contrast {value.contrast}%
        <input
          type="range"
          min={40}
          max={180}
          value={value.contrast}
          onChange={(event) => patch({ contrast: Number(event.target.value) })}
        />
      </label>
      {focus === "watermark" ? null : (
        <WatermarkPanel value={value} onChange={onChange} />
      )}
    </div>
  );
}
