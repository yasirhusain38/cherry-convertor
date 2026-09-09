import Link from "next/link";
import { photoPixels, type PhotoSpec } from "@/data/photo-specs";
import { TOOLS } from "@/lib/tools";

const byPreset = new Map(
  TOOLS.filter((tool) => tool.photoPreset).map((tool) => [tool.photoPreset as string, tool.slug]),
);

export function SizeHub({
  kicker,
  title,
  lede,
  rows,
  extraNote,
}: {
  kicker: string;
  title: string;
  lede: string;
  rows: PhotoSpec[];
  extraNote?: string;
}) {
  return (
    <>
      <section className="border-b border-[var(--line)]">
        <div className="container-page py-14 md:py-20">
          <p className="label">{kicker}</p>
          <h1 className="display mt-5 max-w-4xl text-4xl md:text-7xl">{title}</h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-[var(--ink-soft)]">{lede}</p>
          <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--ink-soft)]">
            Millimetres below are from the workspace presets. KB caps are typical portal windows — confirm on the official form.
            Last checked: September 2026.
          </p>
          {extraNote ? <p className="mt-3 max-w-xl text-sm text-[var(--ink-soft)]">{extraNote}</p> : null}
        </div>
      </section>
      <section className="container-page overflow-x-auto py-12">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] text-[var(--ink-soft)]">
              <th className="py-3 pr-4 font-normal">Country</th>
              <th className="py-3 pr-4 font-normal">Document</th>
              <th className="py-3 pr-4 font-normal">mm</th>
              <th className="py-3 pr-4 font-normal">px @ DPI</th>
              <th className="py-3 pr-4 font-normal">KB</th>
              <th className="py-3 pr-4 font-normal">Background</th>
              <th className="py-3 font-normal">Open</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((spec) => {
              const px = photoPixels(spec);
              const slug = byPreset.get(spec.id);
              const kb =
                spec.maxKB != null
                  ? `${spec.minKB ? `${spec.minKB}–` : ""}${spec.maxKB}`
                  : "UNVERIFIED";
              return (
                <tr key={spec.id} className="border-b border-[var(--line)]">
                  <td className="py-3 pr-4">{spec.country}</td>
                  <td className="py-3 pr-4">{spec.document}</td>
                  <td className="py-3 pr-4 whitespace-nowrap">
                    {spec.widthMm}×{spec.heightMm}
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap">
                    {px.width}×{px.height} @ {spec.dpi}
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap">{kb}</td>
                  <td className="py-3 pr-4">{spec.backgroundLabel}</td>
                  <td className="py-3">
                    {slug ? (
                      <Link href={`/tools/${slug}`} className="text-brand no-underline">
                        Tool
                      </Link>
                    ) : spec.countrySlug === "global" ? (
                      <span className="text-[var(--ink-soft)]">Preset</span>
                    ) : (
                      <Link href={`/countries/${spec.countrySlug}`} className="text-[var(--ink-soft)] no-underline">
                        Hub
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </>
  );
}
