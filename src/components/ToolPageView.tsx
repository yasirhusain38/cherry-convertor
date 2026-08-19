import { Faq } from "@/components/Faq";
import { RelatedTools } from "@/components/RelatedTools";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
import type { ToolDef } from "@/lib/tools";

export function ToolPageView({ tool }: { tool: ToolDef }) {
  return (
    <>
      <section className="border-b border-[var(--line)]">
        <div className="container-page py-12 md:py-16">
          <p className="label">{tool.kicker}</p>
          <h1 className="display mt-4 max-w-4xl text-4xl md:text-6xl">{tool.h1}</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--ink-soft)]">{tool.lede}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <p className="inline-flex items-center gap-3 rounded-full bg-[#F2013F] px-4 py-2 text-xs tracking-[0.16em] text-[#F5F5F1] uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-[#F5F5F1]" />
              Processed in your browser · never uploaded
            </p>
            <p className="inline-flex items-center rounded-full border border-[#F2013F] px-4 py-2 text-xs tracking-[0.16em] text-[#F2013F] uppercase">
              Search any output format
            </p>
          </div>
        </div>
      </section>

      <section className="container-page py-10 md:py-14">
        <ToolWorkspace tool={tool} />
      </section>

      <section className="border-t border-[var(--line)] bg-[#221F1F]">
        <div className="container-page grid gap-10 py-16 md:grid-cols-3">
          {[
            {
              n: "01",
              t: "On this device",
              d: "Canvas, File, and WebAssembly do the work. Closing the tab clears the photo.",
            },
            {
              n: "02",
              t: "No account",
              d: "Basic tools are free and anonymous. There is nothing to sign in to.",
            },
            {
              n: "03",
              t: "Any output format",
              d: "Search JPG, PNG, WebP, BMP, ICO, SVG, PDF, HTML, JSON, and more. Desktop-only types stay listed, never uploaded.",
            },
          ].map((item) => (
            <div key={item.n}>
              <p className="label">{item.n}</p>
              <h2 className="mt-3 text-2xl tracking-tight">{item.t}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{item.d}</p>
            </div>
          ))}
        </div>
      </section>

      <Faq items={tool.faqs} />
      <RelatedTools slugs={tool.related} />
    </>
  );
}
