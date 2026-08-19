"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getFormat, searchFormats, type ConvertFormat } from "@/lib/formats";

type FormatPickerProps = {
  value: string;
  onChange: (format: ConvertFormat) => void;
  label?: string;
};

export function FormatPicker({ value, onChange, label = "Convert to" }: FormatPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useMemo(() => searchFormats(query), [query]);
  const selected = getFormat(value);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const groups = useMemo(() => {
    const map = new Map<string, ConvertFormat[]>();
    for (const item of results) {
      const list = map.get(item.group) ?? [];
      list.push(item);
      map.set(item.group, list);
    }
    return Array.from(map.entries());
  }, [results]);

  return (
    <div ref={rootRef} className="relative grid gap-2 text-sm">
      <span>{label}</span>
      <button
        type="button"
        className="field flex items-center justify-between text-left"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
      >
        <span>
          {selected?.label ?? "Choose a format"}
          {selected && !selected.supported ? " · not in-browser" : ""}
        </span>
        <span className="label">{open ? "Close" : "Search"}</span>
      </button>
      {open ? (
        <div className="absolute top-[calc(100%+6px)] z-20 max-h-80 w-full overflow-auto rounded-[12px] border border-[var(--line)] bg-[#221F1F] p-2 shadow-lg">
          <input
            ref={inputRef}
            className="field"
            value={query}
            placeholder="Search JPG, PDF, ICO, MP4…"
            aria-label="Search formats"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setOpen(false);
              if (event.key === "Enter" && results[0]) {
                onChange(results[0]);
                setOpen(false);
                setQuery("");
              }
            }}
          />
          <div className="mt-2 grid gap-3">
            {groups.length ? (
              groups.map(([group, items]) => (
                <div key={group}>
                  <p className="label px-2 py-1">{group}</p>
                  <ul role="listbox">
                    {items.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={item.id === value}
                          className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                            item.id === value ? "bg-[#F2013F] text-[#F5F5F1]" : "hover:bg-[#F5F5F1]/8"
                          } ${item.supported ? "" : "opacity-50"}`}
                          onClick={() => {
                            onChange(item);
                            setOpen(false);
                            setQuery("");
                          }}
                        >
                          <span>
                            {item.label}
                            <span className="ml-2 text-[11px] tracking-[0.12em] uppercase opacity-70">
                              .{item.ext}
                            </span>
                          </span>
                          <span className="text-[11px] tracking-[0.12em] uppercase">
                            {item.supported ? "Ready" : "Desktop only"}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <p className="px-3 py-4 text-sm text-[var(--ink-soft)]">No format matches “{query}”.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
