"use client";

import { useMemo, useState } from "react";
import { DropZone } from "@/components/DropZone";
import {
  analogous,
  androidHex,
  complementary,
  contrastRatio,
  cssVars,
  monochromeScale,
  paletteFromImageData,
  parseColor,
  rgbToCmyk,
  rgbToHex,
  rgbToHsl,
  rgbToHsv,
  rgbToOklch,
  simulateBlindness,
  suggestPassingColor,
  swiftColor,
  tailwindLike,
  wcagText,
  wcagUi,
} from "@/lib/color";
import { fileToBitmap } from "@/lib/image";
import type { ToolDef } from "@/lib/tools";

type Panel = "picker" | "convert" | "contrast" | "palette" | "gradient";

function panelOf(slug: string): Panel {
  if (slug.includes("contrast")) return "contrast";
  if (slug.includes("palette")) return "palette";
  if (slug.includes("gradient")) return "gradient";
  if (slug.includes("hex") || slug.includes("rgb") || slug.includes("hsl")) return "convert";
  return "picker";
}

export function ColorStudio({ tool }: { tool: ToolDef }) {
  const panel = panelOf(tool.slug);
  const [hex, setHex] = useState("#F2013F");
  const [hexB, setHexB] = useState("#F5F5F1");
  const [raw, setRaw] = useState("#F2013F");
  const [error, setError] = useState<string | null>(null);
  const [palette, setPalette] = useState<string[]>([]);
  const [g2, setG2] = useState("#221F1F");

  const rgb = useMemo(() => {
    try {
      return parseColor(hex);
    } catch {
      return { r: 242, g: 1, b: 63 };
    }
  }, [hex]);
  const hsl = rgbToHsl(rgb);
  const hsv = rgbToHsv(rgb);
  const cmyk = rgbToCmyk(rgb);
  const oklch = rgbToOklch(rgb);
  const bg = useMemo(() => {
    try {
      return parseColor(hexB);
    } catch {
      return { r: 245, g: 245, b: 241 };
    }
  }, [hexB]);
  const ratio = contrastRatio(rgb, bg);
  const suggest = suggestPassingColor(rgb, bg);

  function apply(value: string) {
    setError(null);
    try {
      const parsed = parseColor(value);
      const next = rgbToHex(parsed);
      setHex(next);
      setRaw(value);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not parse.");
    }
  }

  async function fromImage(files: File[]) {
    const bmp = await fileToBitmap(files[0]);
    const canvas = document.createElement("canvas");
    canvas.width = bmp.width;
    canvas.height = bmp.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(bmp, 0, 0);
    bmp.close();
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const colors = paletteFromImageData(data.data, 6);
    setPalette(colors);
    if (colors[0]) apply(colors[0]);
  }

  async function eyedrop() {
    const Eye = (window as unknown as { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper;
    if (!Eye) {
      setError("EyeDropper API is Chromium-only. Upload an image and click, or paste a hex.");
      return;
    }
    const { sRGBHex } = await new Eye().open();
    apply(sRGBHex);
  }

  return (
    <div className="grid gap-6">
      <p className="text-sm text-[var(--ink-soft)]">0 uploads. Color math stays in this tab.</p>
      <div className="flex flex-wrap gap-3">
        <input className="field max-w-xs font-mono" value={raw} onChange={(e) => apply(e.target.value)} />
        <input type="color" className="field h-12 w-16 p-1" value={hex} onChange={(e) => apply(e.target.value)} />
        <button type="button" className="btn btn-ghost" onClick={() => void eyedrop()}>
          Screen eyedropper
        </button>
      </div>

      {panel === "picker" || panel === "convert" ? (
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["HEX", hex.toUpperCase()],
            ["RGB", `${rgb.r}, ${rgb.g}, ${rgb.b}`],
            ["HSL", `${Math.round(hsl.h)}°, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%`],
            ["HSV", `${Math.round(hsv.h)}°, ${Math.round(hsv.s * 100)}%, ${Math.round(hsv.v * 100)}%`],
            ["CMYK (approx)", `${Math.round(cmyk.c * 100)} / ${Math.round(cmyk.m * 100)} / ${Math.round(cmyk.y * 100)} / ${Math.round(cmyk.k * 100)}`],
            ["OKLCH", `${oklch.l.toFixed(3)} ${oklch.c.toFixed(3)} ${oklch.h.toFixed(1)}`],
          ].map(([k, v]) => (
            <div key={k} className="card p-4">
              <dt className="label">{k}</dt>
              <dd className="mt-1 font-mono text-sm">{v}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {panel === "contrast" ? (
        <div className="grid gap-4">
          <label className="grid max-w-xs gap-2 text-sm">
            Background
            <input className="field font-mono" value={hexB} onChange={(e) => setHexB(e.target.value)} />
          </label>
          <div className="card p-6" style={{ background: hexB, color: hex }}>
            <p className="text-base">Normal text 16px — WCAG 2.2 contrast sample.</p>
            <p className="mt-2 text-2xl font-medium">Large text 24px.</p>
          </div>
          <ul className="grid gap-2 text-sm">
            <li>Ratio {ratio.toFixed(2)} : 1</li>
            <li>Normal text: {wcagText(ratio, false)}</li>
            <li>Large text: {wcagText(ratio, true)}</li>
            <li>UI components: {wcagUi(ratio)}</li>
            <li>
              Nearby AA color:{" "}
              <button type="button" className="text-brand" onClick={() => apply(rgbToHex(suggest))}>
                {rgbToHex(suggest)}
              </button>
            </li>
          </ul>
        </div>
      ) : null}

      {panel === "palette" || panel === "picker" ? (
        <div className="grid gap-4">
          <DropZone onFiles={(f) => void fromImage(f)} label="Drop an image for a palette" hint="Samples pixels here. Not a cloud palette API." />
          <div className="flex flex-wrap gap-2">
            {(palette.length ? palette : analogous(hex)).map((c) => (
              <button
                key={c}
                type="button"
                className="h-14 w-14 rounded-lg border border-[var(--line)]"
                style={{ background: c }}
                onClick={() => apply(c)}
                aria-label={c}
              />
            ))}
          </div>
          <p className="label">Complementary {complementary(hex)}</p>
          <div className="flex gap-1">
            {monochromeScale(hex).map((c) => (
              <div key={c} className="h-8 flex-1" style={{ background: c }} title={c} />
            ))}
          </div>
        </div>
      ) : null}

      {panel === "gradient" ? (
        <div className="grid gap-3">
          <label className="grid max-w-xs gap-2 text-sm">
            Second stop
            <input className="field font-mono" value={g2} onChange={(e) => setG2(e.target.value)} />
          </label>
          <div className="h-24 rounded-xl" style={{ background: `linear-gradient(90deg, ${hex}, ${g2})` }} />
          <pre className="card overflow-auto p-4 text-sm">{`background: linear-gradient(90deg, ${hex}, ${g2});`}</pre>
        </div>
      ) : null}

      <details className="card p-4 text-sm">
        <summary className="cursor-pointer">Copy as CSS / Tailwind / Swift / Android</summary>
        <pre className="mt-3 overflow-auto whitespace-pre-wrap">{cssVars(hex)}</pre>
        <pre className="mt-2 overflow-auto">{JSON.stringify(tailwindLike(hex), null, 2)}</pre>
        <p className="mt-2 font-mono">{swiftColor(hex)}</p>
        <p className="font-mono">{androidHex(hex)}</p>
      </details>

      <div className="grid gap-2 text-sm">
        <p className="label">Color blindness simulation (approx)</p>
        <div className="flex gap-2">
          {(["protanopia", "deuteranopia", "tritanopia"] as const).map((k) => (
            <div key={k} className="h-12 flex-1 rounded-lg" style={{ background: rgbToHex(simulateBlindness(rgb, k)) }} title={k} />
          ))}
        </div>
      </div>
      {error ? <p className="text-sm text-brand">{error}</p> : null}
    </div>
  );
}
