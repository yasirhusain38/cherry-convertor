"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { CURRENCIES, CURRENCY_MAP, type Currency } from "@/data/currencies";

export function CurrencyPick({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (code: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const current = CURRENCY_MAP.get(value);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const hits = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = !q
      ? CURRENCIES
      : CURRENCIES.filter(
          (item) =>
            item.code.toLowerCase().includes(q) ||
            item.name.toLowerCase().includes(q) ||
            item.symbol.toLowerCase().includes(q),
        );
    return {
      popular: list.filter((item) => item.popular),
      rest: list.filter((item) => !item.popular),
      empty: list.length === 0,
    };
  }, [query]);

  function pick(code: string) {
    onChange(code);
    setOpen(false);
    setQuery("");
  }

  const modal =
    open && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-3 sm:items-center"
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label={`Select ${label} currency`}
          >
            <div
              className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[#221F1F]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
                <p className="label">Select {label}</p>
                <button type="button" className="btn btn-ghost min-h-10 px-4" onClick={() => setOpen(false)}>
                  Close
                </button>
              </div>
              <div className="border-b border-[var(--line)] p-4">
                <input
                  className="field"
                  autoFocus
                  value={query}
                  placeholder="Search USD, INR, rupee, dirham…"
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-2">
                {hits.empty ? (
                  <p className="px-3 py-8 text-sm text-[var(--ink-soft)]">No match for “{query}”.</p>
                ) : (
                  <>
                    {hits.popular.length ? <p className="label px-3 py-2">Popular</p> : null}
                    {hits.popular.map((item) => (
                      <PickRow key={item.code} item={item} active={item.code === value} onPick={pick} />
                    ))}
                    {hits.rest.length ? <p className="label px-3 py-2">All</p> : null}
                    {hits.rest.map((item) => (
                      <PickRow key={item.code} item={item} active={item.code === value} onPick={pick} />
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        className="field flex h-14 w-full items-center justify-between gap-2 text-left"
        onClick={() => {
          setQuery("");
          setOpen(true);
        }}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="text-xl">{current?.flag ?? "💱"}</span>
          <span className="truncate">
            <span className="block text-base tracking-tight">{current?.code ?? value}</span>
            <span className="block truncate text-xs text-[var(--ink-soft)]">{current?.name ?? "Choose"}</span>
          </span>
        </span>
        <span className="label shrink-0">Change</span>
      </button>
      {modal}
    </>
  );
}

function PickRow({
  item,
  active,
  onPick,
}: {
  item: Currency;
  active: boolean;
  onPick: (code: string) => void;
}) {
  return (
    <button
      type="button"
      className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left ${
        active ? "bg-[#F2013F] text-[#F5F5F1]" : "hover:bg-[rgba(245,245,241,0.08)]"
      }`}
      onClick={() => onPick(item.code)}
    >
      <span className="text-xl">{item.flag}</span>
      <span className="flex-1">
        <span className="block text-base tracking-tight">{item.code}</span>
        <span className={`block text-sm ${active ? "text-[#F5F5F1]/80" : "text-[var(--ink-soft)]"}`}>{item.name}</span>
      </span>
      <span className="text-sm opacity-80">{item.symbol}</span>
    </button>
  );
}
