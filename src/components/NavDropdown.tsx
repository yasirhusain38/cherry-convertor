"use client";

import Link from "next/link";
import { useEffect, useId, useRef } from "react";
import type { NavGroup } from "@/lib/nav";

export function NavDropdown({
  group,
  open,
  onOpen,
  onClose,
  linkClass,
}: {
  group: NavGroup;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  linkClass: string;
}) {
  const panelId = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const leave = useRef<number>(0);

  useEffect(() => {
    if (!open) return;
    function onDoc(event: MouseEvent) {
      if (!wrap.current?.contains(event.target as Node)) onClose();
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  function cancelLeave() {
    window.clearTimeout(leave.current);
  }

  return (
    <div
      ref={wrap}
      className="relative"
      onMouseEnter={() => {
        cancelLeave();
        onOpen();
      }}
      onMouseLeave={() => {
        cancelLeave();
        leave.current = window.setTimeout(onClose, 140);
      }}
    >
      <button
        type="button"
        className={`label inline-flex items-center gap-1 no-underline transition-colors ${linkClass}`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={panelId}
        onClick={() => (open ? onClose() : onOpen())}
      >
        {group.label}
        <span className={`text-[10px] opacity-80 ${open ? "rotate-180" : ""}`} aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <div
          id={panelId}
          role="menu"
          className="nav-panel absolute left-0 top-[calc(100%+10px)] z-[80] min-w-56 rounded-xl border border-[#F5F5F1]/15 bg-[#221F1F] py-2 shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
        >
          <Link
            href={group.href}
            role="menuitem"
            className="block px-4 py-2 text-[11px] tracking-[0.16em] text-[#F2013F] no-underline uppercase hover:bg-[#F2013F] hover:text-[#F5F5F1]"
            onClick={onClose}
          >
            {group.label} overview
          </Link>
          {group.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              className="block px-4 py-2 text-sm tracking-tight text-[#F5F5F1] no-underline hover:bg-[#F2013F]"
              onClick={onClose}
            >
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
