"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { searchBrowse, type SearchBrowse, type SearchChip } from "@/lib/search-popular";

function chips(now: Date): SearchBrowse {
  return searchBrowse(now);
}

export function SearchPopular({
  onPick,
  dark = true,
}: {
  onPick?: () => void;
  dark?: boolean;
}) {
  const [pack, setPack] = useState<SearchBrowse | null>(null);

  useEffect(() => {
    const tick = () => setPack(chips(new Date()));
    tick();
    const id = window.setInterval(tick, 20_000);
    const onVis = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  if (!pack) {
    return <p className={`text-sm ${dark ? "text-[#F5F5F1]/50" : "text-[var(--ink-soft)]"}`}>Loading shortcuts…</p>;
  }

  const btn = dark ? "btn btn-ghost text-[#F5F5F1]" : "btn btn-ghost";
  const label = dark ? "label mb-3 text-[#F2013F]" : "label mb-3";

  return (
    <div className="grid gap-8">
      <ChipRow
        title={`Now · ${pack.slot} · ${pack.clock}`}
        items={pack.now}
        className={label}
        btn={btn}
        onPick={onPick}
      />
      <ChipRow title="Frequently used" items={pack.frequent} className={label} btn={btn} onPick={onPick} />
      <ChipRow title="More" items={pack.more} className={label} btn={btn} onPick={onPick} />
    </div>
  );
}

function ChipRow({
  title,
  items,
  className,
  btn,
  onPick,
}: {
  title: string;
  items: SearchChip[];
  className: string;
  btn: string;
  onPick?: () => void;
}) {
  return (
    <section>
      <p className={className}>{title}</p>
      <div className="flex flex-wrap gap-3">
        {items.map((item) => (
          <Link key={`${title}-${item.href}-${item.label}`} href={item.href} className={btn} onClick={onPick}>
            {item.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
