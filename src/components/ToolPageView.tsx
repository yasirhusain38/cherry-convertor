import { Faq } from "@/components/Faq";
import { PresetTracker } from "@/components/PresetTracker";
import { RelatedTools } from "@/components/RelatedTools";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
import { getDocumentSpec } from "@/data/document-specs";
import { getPhotoSpec, photoPixels } from "@/data/photo-specs";
import { getLandingCopy } from "@/data/tool-landing-copy";
import type { ToolDef, ToolMode } from "@/lib/tools";

const PHOTO_EDITOR_MODES = new Set<ToolMode>([
  "photo",
  "crop",
  "dpi",
  "bg-remove",
  "signature",
  "color-grade",
  "heal",
  "photo-studio",
  "watermark-studio",
  "extra-edit",
  "image-fx",
  "compress",
  "resize",
  "target-size",
  "enhance",
  "convert",
]);

export function ToolPageView({ tool }: { tool: ToolDef }) {
  const capBytes =
    tool.targetBytes ??
    (tool.documentSpecId ? getDocumentSpec(tool.documentSpecId).defaultBytes : undefined);
  const copy = getLandingCopy(tool.slug);
  const steps = copy?.howTo ?? [
    "Drop the file. It stays in this browser tab.",
    tool.mode === "photo"
      ? "Confirm millimetres, background, and KB cap."
      : "Set the cap or preset for this job.",
    "Download from this device. Nothing is uploaded.",
  ];
  const editor = PHOTO_EDITOR_MODES.has(tool.mode);

  return (
    <>
      <PresetTracker slug={tool.slug} capBytes={capBytes} />
      {editor ? (
        <section className="flex min-h-[calc(100dvh-4.25rem)] flex-col border-b border-[var(--line)]">
          <div className="flex shrink-0 items-end justify-between gap-4 px-4 py-3 md:px-6">
            <div className="min-w-0">
              <p className="label">{tool.kicker}</p>
              <h1 className="display mt-1 truncate text-xl md:text-2xl">{tool.h1}</h1>
            </div>
            {tool.photoPreset ? <PhotoSpecTable presetId={tool.photoPreset} compact /> : null}
          </div>
          <div className="h-auto min-h-[32rem] px-3 pb-3 md:h-[calc(100dvh-8.5rem)] md:px-4">
            <ToolWorkspace tool={tool} />
          </div>
        </section>
      ) : (
        <section className="flex min-h-[100dvh] flex-col border-b border-[var(--line)]">
          <div className="container-page py-8 md:py-10">
            <p className="label">{tool.kicker}</p>
            <h1 className="display mt-4 max-w-4xl text-3xl md:text-5xl">{tool.h1}</h1>
            {tool.lede ? (
              <p className="mt-4 max-w-xl text-base leading-7 text-[var(--ink-soft)]">{tool.lede}</p>
            ) : null}
            {tool.photoPreset ? <PhotoSpecTable presetId={tool.photoPreset} /> : null}
            <p className="mt-4 max-w-xl text-xs leading-5 text-[var(--ink-soft)]">
              Last checked: September 2026. Confirm millimetres, pixels, and KB on the official form. Not a government
              website.
            </p>
          </div>
          <div className="container-page flex-1 pb-12 md:pb-16">
            <ToolWorkspace tool={tool} />
          </div>
        </section>
      )}

      <section className="border-t border-[var(--line)] bg-[#221F1F]">
        <div className="container-page grid gap-10 py-16 md:grid-cols-3">
          {steps.map((text, index) => (
            <div key={text}>
              <p className="label">{String(index + 1).padStart(2, "0")}</p>
              <h2 className="mt-3 text-2xl tracking-tight">
                {index === 0 ? "Drop" : index === 1 ? "Preset applied" : "Download"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {copy?.sections.length ? (
        <section className="container-page grid gap-10 py-16">
          {copy.sections.map((block) => (
            <article key={block.h2} className="max-w-2xl">
              <h2 className="display text-3xl">{block.h2}</h2>
              <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">{block.p}</p>
            </article>
          ))}
        </section>
      ) : null}

      <Faq items={tool.faqs} />
      <RelatedTools slugs={tool.related} />
    </>
  );
}

function PhotoSpecTable({ presetId, compact = false }: { presetId: string; compact?: boolean }) {
  const spec = getPhotoSpec(presetId);
  const px = photoPixels(spec);
  const kb = spec.maxKB != null ? `${spec.minKB ? `${spec.minKB}–` : ""}${spec.maxKB} KB` : "UNVERIFIED";
  return (
    <dl
      className={`grid grid-cols-2 gap-3 text-sm text-[var(--ink-soft)] md:grid-cols-4 ${
        compact ? "mt-0 max-w-md shrink-0" : "mt-8 max-w-xl"
      }`}
    >
      <div>
        <dt className="label">mm</dt>
        <dd>
          {spec.widthMm}×{spec.heightMm}
        </dd>
      </div>
      <div>
        <dt className="label">px</dt>
        <dd>
          {px.width}×{px.height}
        </dd>
      </div>
      <div>
        <dt className="label">KB</dt>
        <dd>{kb}</dd>
      </div>
      <div>
        <dt className="label">Background</dt>
        <dd>{spec.backgroundLabel}</dd>
      </div>
    </dl>
  );
}
