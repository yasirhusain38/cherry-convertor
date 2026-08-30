"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function internalPath(anchor: HTMLAnchorElement): string | null {
  if (anchor.target && anchor.target !== "_self") return null;
  if (anchor.hasAttribute("download")) return null;
  const raw = anchor.getAttribute("href");
  if (!raw || raw.startsWith("mailto:") || raw.startsWith("tel:") || raw.startsWith("javascript:")) return null;
  let url: URL;
  try {
    url = new URL(raw, window.location.href);
  } catch {
    return null;
  }
  if (url.origin !== window.location.origin) return null;
  const next = `${url.pathname}${url.search}`;
  const here = `${window.location.pathname}${window.location.search}`;
  if (next === here) return null;
  return next;
}

export function PageCurtain() {
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);
  const busy = useRef(false);

  useEffect(() => {
    function reduced() {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    async function go(href: string) {
      if (busy.current) return;
      const el = root.current;
      if (!el || reduced()) {
        router.push(href);
        return;
      }
      busy.current = true;
      el.dataset.state = "in";
      await wait(400);
      router.push(href);
      await wait(80);
      el.dataset.state = "out";
      await wait(360);
      el.dataset.state = "idle";
      busy.current = false;
    }

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;
      const href = internalPath(anchor);
      if (!href) return;
      event.preventDefault();
      event.stopPropagation();
      void go(href);
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  return (
    <div ref={root} className="page-curtain" data-state="idle" aria-hidden="true">
      <div className="page-curtain-layer page-curtain-ink" />
      <div className="page-curtain-layer page-curtain-brand" />
      <div className="page-curtain-mark">
        <svg viewBox="0 0 32 32" fill="none" className="h-12 w-12" aria-hidden>
          <path
            d="M21.2 8.4c-1.1-1.4-2.8-2.2-4.7-2.2C12.1 6.2 9 9.4 9 13.6c0 4.3 3.1 7.6 7.5 7.6 1.9 0 3.6-.8 4.8-2.2"
            stroke="#F5F5F1"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          <circle cx="22.4" cy="9.2" r="2.15" fill="#F5F5F1" />
          <path d="M22.5 7.2c.15-1.5 1.55-2.45 2.7-2" stroke="#F5F5F1" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
