"use client";

import { useEffect } from "react";

export function UndoRedoBar({
  undo,
  redo,
  canUndo,
  canRedo,
}: {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const mod = event.ctrlKey || event.metaKey;
      if (!mod) return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable) {
        return;
      }
      const key = event.key.toLowerCase();
      if (key === "z" && event.shiftKey) {
        event.preventDefault();
        redo();
        return;
      }
      if (key === "y") {
        event.preventDefault();
        redo();
        return;
      }
      if (key === "z") {
        event.preventDefault();
        undo();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [redo, undo]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className="btn btn-ghost min-h-10 px-3" disabled={!canUndo} onClick={undo}>
        Undo
      </button>
      <button type="button" className="btn btn-ghost min-h-10 px-3" disabled={!canRedo} onClick={redo}>
        Redo
      </button>
      <span className="text-[11px] tracking-wide text-[var(--ink-soft)] uppercase">Ctrl+Z · Ctrl+Y</span>
    </div>
  );
}
