"use client";

import type { EnhanceSettings, WatermarkPosition } from "@/lib/enhance";

const PLACES: Array<{ id: WatermarkPosition; label: string }> = [
  { id: "tl", label: "Top left" },
  { id: "tc", label: "Top centre" },
  { id: "tr", label: "Top right" },
  { id: "cl", label: "Middle left" },
  { id: "cc", label: "Centre" },
  { id: "cr", label: "Middle right" },
  { id: "bl", label: "Bottom left" },
  { id: "bc", label: "Bottom centre" },
  { id: "br", label: "Bottom right" },
];

export function WatermarkPanel({
  value,
  onChange,
  featured = false,
}: {
  value: EnhanceSettings;
  onChange: (next: EnhanceSettings) => void;
  featured?: boolean;
}) {
  function patch(partial: Partial<EnhanceSettings>) {
    onChange({ ...value, ...partial });
  }

  return (
    <div className={`grid gap-5 ${featured ? "md:col-span-2" : "md:col-span-2"}`}>
      {featured ? (
        <div>
          <p className="label">Watermark</p>
          <h2 className="mt-2 text-2xl tracking-tight">What should it say, and where?</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
            Type the line you want stamped on the photo — your name, a company,
            a copyright, a website. Then pick the corner (or tile it across the
            whole image).
          </p>
        </div>
      ) : (
        <p className="label">Watermark (optional)</p>
      )}

      <label className="grid gap-2 text-sm">
        What text do you want on the photo?
        <input
          className="field text-base"
          value={value.watermark}
          placeholder="e.g. © Priya Sharma  ·  cherryconvertor.com  ·  Confidential"
          onChange={(event) => patch({ watermark: event.target.value })}
        />
      </label>

      <div className="grid gap-2 text-sm">
        Where on the photo?
        <div className="grid grid-cols-3 gap-2 max-w-xs">
          {PLACES.map((place) => (
            <button
              key={place.id}
              type="button"
              className={`btn min-h-11 px-2 text-[10px] ${value.watermarkPosition === place.id ? "btn-primary" : "btn-ghost"}`}
              onClick={() => patch({ watermarkPosition: place.id })}
            >
              {place.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={`btn mt-1 max-w-xs ${value.watermarkPosition === "tile" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => patch({ watermarkPosition: "tile" })}
        >
          Repeat across the whole photo
        </button>
        <p className="text-sm text-[var(--ink-soft)]">
          {value.watermark.trim()
            ? `“${value.watermark.trim()}” will sit ${
                value.watermarkPosition === "tile"
                  ? "repeated diagonally over the image"
                  : `at the ${PLACES.find((p) => p.id === value.watermarkPosition)?.label.toLowerCase()}`
              }.`
            : "Type the text first. Nothing is stamped until you do."}
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <label className="grid gap-2 text-sm">
          Size {value.watermarkSize}
          <input
            type="range"
            min={12}
            max={70}
            value={value.watermarkSize}
            onChange={(event) => patch({ watermarkSize: Number(event.target.value) })}
          />
        </label>
        <label className="grid gap-2 text-sm">
          Opacity {value.watermarkOpacity}%
          <input
            type="range"
            min={15}
            max={100}
            value={value.watermarkOpacity}
            onChange={(event) => patch({ watermarkOpacity: Number(event.target.value) })}
          />
        </label>
        <label className="grid gap-2 text-sm">
          Colour
          <input
            className="field h-12"
            type="color"
            value={value.watermarkColor}
            onChange={(event) => patch({ watermarkColor: event.target.value })}
          />
        </label>
      </div>
    </div>
  );
}
