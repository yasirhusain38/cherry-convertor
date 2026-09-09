"use client";

import { useEffect, useRef } from "react";

export type PhotoshopActions = {
  undo?: () => void;
  redo?: () => void;
  save?: () => void;
  copy?: () => void;
  open?: () => void;
  newFile?: () => void;
  zoomIn?: () => void;
  zoomOut?: () => void;
  zoomFit?: () => void;
  zoom100?: () => void;
  brushSmaller?: () => void;
  brushLarger?: () => void;
  toolMove?: () => void;
  toolMarquee?: () => void;
  toolWand?: () => void;
  toolEyedropper?: () => void;
  toolBrush?: () => void;
  toolHeal?: () => void;
  toolGrade?: () => void;
  toolCutout?: () => void;
  deselect?: () => void;
  deleteSelection?: () => void;
  apply?: () => void;
  defaultColors?: () => void;
  swapColors?: () => void;
  nudge?: (dx: number, dy: number) => void;
  desaturate?: () => void;
  togglePanel?: () => void;
  toggleHelp?: () => void;
  onHint?: (text: string) => void;
};

function typingInField(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null;
  if (!target) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag !== "INPUT") return false;
  const type = (target as HTMLInputElement).type;
  return !["range", "checkbox", "radio", "button", "color", "file"].includes(type);
}

export const PHOTOSHOP_SHORTCUTS: Array<{ keys: string; does: string }> = [
  { keys: "Ctrl+Z", does: "Undo" },
  { keys: "Ctrl+Shift+Z / Ctrl+Y", does: "Redo" },
  { keys: "Ctrl+Alt+Z", does: "Step backward" },
  { keys: "Ctrl+S / Ctrl+Shift+S", does: "Save (download)" },
  { keys: "Ctrl+C / Ctrl+Shift+C", does: "Copy image" },
  { keys: "Ctrl+O", does: "Open file" },
  { keys: "Ctrl+N", does: "New file" },
  { keys: "Ctrl+0", does: "Fit / reset view" },
  { keys: "Ctrl+1", does: "100% view" },
  { keys: "Ctrl+ + / Ctrl+ −", does: "Zoom in / out" },
  { keys: "V", does: "Move" },
  { keys: "M", does: "Marquee (box)" },
  { keys: "W", does: "Magic wand" },
  { keys: "B", does: "Brush" },
  { keys: "J", does: "Healing brush" },
  { keys: "I", does: "Eyedropper" },
  { keys: "G", does: "Grade / adjust" },
  { keys: "E", does: "Eraser (clear mask)" },
  { keys: "[  ]", does: "Brush smaller / larger" },
  { keys: "X", does: "Swap background" },
  { keys: "D", does: "Default background" },
  { keys: "Ctrl+Shift+U", does: "Desaturate" },
  { keys: "Ctrl+D", does: "Deselect" },
  { keys: "Delete / Backspace", does: "Clear selection" },
  { keys: "Enter", does: "Apply" },
  { keys: "Esc", does: "Deselect / close help" },
  { keys: "Arrows / Shift+Arrows", does: "Nudge" },
  { keys: "Tab", does: "Hide / show panels" },
  { keys: "? / Ctrl+Alt+Shift+K", does: "Keyboard shortcuts" },
];

export function usePhotoshopShortcuts(actions: PhotoshopActions) {
  const actionsRef = useRef(actions);

  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const actions = actionsRef.current;
      const mod = event.ctrlKey || event.metaKey;
      const key = event.key;
      const lower = key.toLowerCase();
      const typing = typingInField(event);
      const hint = (text: string) => actions.onHint?.(text);
      const run = (fn: (() => void) | undefined, label: string) => {
        if (!fn) return false;
        event.preventDefault();
        fn();
        hint(label);
        return true;
      };

      if (mod && event.altKey && event.shiftKey && lower === "k") {
        run(actions.toggleHelp, "Keyboard shortcuts");
        return;
      }

      if (mod && lower === "z") {
        run(event.shiftKey ? actions.redo : actions.undo, event.shiftKey ? "Redo" : event.altKey ? "Step backward" : "Undo");
        return;
      }
      if (mod && lower === "y") {
        run(actions.redo, "Redo");
        return;
      }
      if (mod && lower === "s") {
        run(actions.save, "Save");
        return;
      }
      if (mod && lower === "c") {
        run(actions.copy, "Copy");
        return;
      }
      if (mod && lower === "o") {
        run(actions.open, "Open");
        return;
      }
      if (mod && lower === "n") {
        run(actions.newFile, "New file");
        return;
      }
      if (mod && lower === "0") {
        run(actions.zoomFit, "Fit on screen");
        return;
      }
      if (mod && lower === "1") {
        run(actions.zoom100, "100%");
        return;
      }
      if (mod && (key === "=" || key === "+" || event.code === "Equal" || event.code === "NumpadAdd")) {
        run(actions.zoomIn, "Zoom in");
        return;
      }
      if (mod && (key === "-" || key === "_" || event.code === "Minus" || event.code === "NumpadSubtract")) {
        run(actions.zoomOut, "Zoom out");
        return;
      }
      if (mod && lower === "d" && !event.shiftKey) {
        run(actions.deselect, "Deselect");
        return;
      }
      if (mod && event.shiftKey && lower === "u") {
        run(actions.desaturate, "Desaturate");
        return;
      }

      if (typing) return;

      if (key === "?") {
        run(actions.toggleHelp, "Keyboard shortcuts");
        return;
      }
      if (key === "Tab") {
        run(actions.togglePanel, "Toggle panels");
        return;
      }
      if (key === "Escape") {
        run(actions.deselect, "Deselect");
        return;
      }
      if (key === "Enter") {
        run(actions.apply, "Apply");
        return;
      }
      if (key === "Delete" || key === "Backspace") {
        run(actions.deleteSelection, "Clear");
        return;
      }
      if (key === "[") {
        run(actions.brushSmaller, "Brush smaller");
        return;
      }
      if (key === "]") {
        run(actions.brushLarger, "Brush larger");
        return;
      }
      if (key === "ArrowLeft" || key === "ArrowRight" || key === "ArrowUp" || key === "ArrowDown") {
        if (!actions.nudge) return;
        event.preventDefault();
        const step = event.shiftKey ? 0.08 : 0.02;
        const dx = key === "ArrowLeft" ? -step : key === "ArrowRight" ? step : 0;
        const dy = key === "ArrowUp" ? -step : key === "ArrowDown" ? step : 0;
        actions.nudge(dx, dy);
        hint("Nudge");
        return;
      }

      if (mod) return;

      if (lower === "v") run(actions.toolMove, "Move (V)");
      else if (lower === "m") run(actions.toolMarquee, "Marquee (M)");
      else if (lower === "w") run(actions.toolWand, "Wand (W)");
      else if (lower === "b") run(actions.toolBrush, "Brush (B)");
      else if (lower === "j") run(actions.toolHeal, "Healing brush (J)");
      else if (lower === "i") run(actions.toolEyedropper, "Eyedropper (I)");
      else if (lower === "g") run(actions.toolGrade, "Grade (G)");
      else if (lower === "e") run(actions.deleteSelection, "Eraser (E)");
      else if (lower === "x") run(actions.swapColors, "Swap colors (X)");
      else if (lower === "d") run(actions.defaultColors, "Default colors (D)");
      else if (lower === "h") run(actions.toolMove, "Hand (H)");
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
