import type { FaqItem } from "@/lib/tools";

export function Faq({ items }: { items: FaqItem[] }) {
  return (
    <section className="container-page py-20">
      <p className="label">FAQ</p>
      <h2 className="display mt-3 text-4xl md:text-5xl">Questions, answered</h2>
      <div className="mt-10 divide-y divide-[var(--line)] border-y border-[var(--line)]">
        {items.map((item) => (
          <details key={item.q} className="group py-5">
            <summary className="cursor-pointer list-none text-lg tracking-tight">
              <span className="flex items-start justify-between gap-6">
                {item.q}
                <span className="label mt-1 shrink-0 text-brand group-open:hidden">Open</span>
                <span className="label mt-1 hidden shrink-0 text-brand group-open:inline">Close</span>
              </span>
            </summary>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--ink-soft)]">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function faqJsonLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}
