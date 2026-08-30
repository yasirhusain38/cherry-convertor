"use client";

import { useEffect, useRef } from "react";

function interactive(node: Element | null): boolean {
  if (!node) return false;
  return Boolean(
    node.closest(
      "a, button, label, summary, select, [role='button'], [role='menuitem'], [role='option'], .card-hover, .btn, input[type='range']",
    ),
  );
}

function typing(node: Element | null): boolean {
  if (!node) return false;
  const el = node as HTMLElement;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  if (tag === "TEXTAREA") return true;
  if (tag !== "INPUT") return false;
  const type = (el as HTMLInputElement).type;
  return !["button", "submit", "reset", "checkbox", "radio", "range", "file", "color"].includes(type);
}

export function SiteCursor() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const html = document.documentElement;
    html.classList.add("has-site-cursor");

    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const lagged = { x: mouse.x, y: mouse.y };
    let down = false;
    let frame = 0;
    let visible = false;

    function mode(): string {
      const target = document.elementFromPoint(mouse.x, mouse.y);
      if (typing(target)) return "text";
      if (down) return "down";
      if (interactive(target)) return "hover";
      return "idle";
    }

    function onMove(event: PointerEvent) {
      if (event.pointerType !== "mouse") return;
      mouse.x = event.clientX;
      mouse.y = event.clientY;
      visible = true;
      root.current?.classList.add("is-on");
    }

    function onDown(event: PointerEvent) {
      if (event.pointerType !== "mouse") return;
      down = true;
      if (root.current) root.current.dataset.mode = mode();
    }

    function onUp(event: PointerEvent) {
      if (event.pointerType !== "mouse") return;
      down = false;
      if (root.current) root.current.dataset.mode = mode();
    }

    function onLeave() {
      visible = false;
      root.current?.classList.remove("is-on");
    }

    function tick() {
      lagged.x += (mouse.x - lagged.x) * 0.16;
      lagged.y += (mouse.y - lagged.y) * 0.16;
      if (dot.current) {
        dot.current.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0)`;
      }
      if (ring.current) {
        ring.current.style.transform = `translate3d(${lagged.x}px, ${lagged.y}px, 0)`;
      }
      if (root.current && visible) root.current.dataset.mode = mode();
      frame = requestAnimationFrame(tick);
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    document.addEventListener("mouseleave", onLeave);
    frame = requestAnimationFrame(tick);

    return () => {
      html.classList.remove("has-site-cursor");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      document.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={root} className="site-cursor" data-mode="idle" aria-hidden="true">
      <div ref={ring} className="site-cursor-ring" />
      <div ref={dot} className="site-cursor-dot" />
    </div>
  );
}
