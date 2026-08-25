"use client";

import { useCallback, useRef, useState } from "react";

export type HistoryMode = "gesture" | "instant";

type Entry<T> = { before: T; after: T };

export function useEditHistory<T>(
  initial: T,
  clone: (value: T) => T,
  options?: {
    limit?: number;
    debounceMs?: number;
    onRestore?: (value: T) => void;
  },
) {
  const limit = options?.limit ?? 40;
  const debounceMs = options?.debounceMs ?? 450;
  const cloneRef = useRef(clone);
  cloneRef.current = clone;
  const restoreRef = useRef(options?.onRestore);
  restoreRef.current = options?.onRestore;

  const [present, setPresent] = useState(() => clone(initial));
  const presentRef = useRef(present);
  presentRef.current = present;

  const past = useRef<Entry<T>[]>([]);
  const future = useRef<Entry<T>[]>([]);
  const gesturing = useRef(false);
  const timer = useRef<number>(0);
  const [, setStamp] = useState(0);

  const bump = () => setStamp((n) => n + 1);

  const apply = useCallback((value: T) => {
    const next = cloneRef.current(value);
    presentRef.current = next;
    setPresent(next);
    restoreRef.current?.(value);
  }, []);

  const set = useCallback(
    (next: T, mode: HistoryMode = "gesture") => {
      const cloned = cloneRef.current(next);
      if (mode === "instant" || !gesturing.current) {
        past.current.push({ before: cloneRef.current(presentRef.current), after: cloned });
        if (past.current.length > limit) past.current.shift();
        future.current = [];
        gesturing.current = mode === "gesture";
      } else {
        const top = past.current[past.current.length - 1];
        if (top) top.after = cloned;
      }
      presentRef.current = cloned;
      setPresent(cloned);
      window.clearTimeout(timer.current);
      if (mode === "gesture") {
        timer.current = window.setTimeout(() => {
          gesturing.current = false;
          bump();
        }, debounceMs);
      } else {
        gesturing.current = false;
        bump();
      }
    },
    [debounceMs, limit],
  );

  const record = useCallback(
    (before: T, after: T) => {
      past.current.push({ before: cloneRef.current(before), after: cloneRef.current(after) });
      if (past.current.length > limit) past.current.shift();
      future.current = [];
      gesturing.current = false;
      window.clearTimeout(timer.current);
      bump();
    },
    [limit],
  );

  const undo = useCallback(() => {
    const entry = past.current.pop();
    if (!entry) return;
    future.current.push(entry);
    gesturing.current = false;
    window.clearTimeout(timer.current);
    apply(entry.before);
    bump();
  }, [apply]);

  const redo = useCallback(() => {
    const entry = future.current.pop();
    if (!entry) return;
    past.current.push(entry);
    gesturing.current = false;
    window.clearTimeout(timer.current);
    apply(entry.after);
    bump();
  }, [apply]);

  const reset = useCallback(
    (value: T) => {
      past.current = [];
      future.current = [];
      gesturing.current = false;
      window.clearTimeout(timer.current);
      const next = cloneRef.current(value);
      presentRef.current = next;
      setPresent(next);
      bump();
    },
    [],
  );

  return {
    present,
    set,
    record,
    undo,
    redo,
    reset,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  };
}
