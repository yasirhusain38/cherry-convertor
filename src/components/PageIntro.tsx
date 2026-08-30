import type { ReactNode } from "react";

export function PageIntro({
  kicker,
  title,
  lede,
  children,
}: {
  kicker: string;
  title: string;
  lede?: string;
  children?: ReactNode;
}) {
  return (
    <section className="border-b border-[var(--line)]">
      <div className="container-page py-16 md:py-20">
        <p className="label">{kicker}</p>
        <h1 className="display mt-4 max-w-5xl text-5xl md:text-7xl">{title}</h1>
        {lede ? <p className="mt-6 max-w-xl text-base leading-7 text-[var(--ink-soft)]">{lede}</p> : null}
        {children}
      </div>
    </section>
  );
}
