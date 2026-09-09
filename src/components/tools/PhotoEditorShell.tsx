"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  PHOTOSHOP_SHORTCUTS,
  usePhotoshopShortcuts,
  type PhotoshopActions,
} from "./usePhotoshopShortcuts";

export function PhotoEditorShell({
  hasFile,
  empty,
  toolbar,
  canvas,
  panel,
  rail,
  actions,
  accept = "image/*",
  openMultiple = false,
}: {
  hasFile: boolean;
  empty: ReactNode;
  toolbar?: ReactNode;
  canvas: ReactNode;
  panel: ReactNode;
  rail?: ReactNode;
  actions?: Omit<PhotoshopActions, "open" | "togglePanel" | "toggleHelp" | "onHint"> & {
    onFiles?: (files: File[]) => void;
  };
  accept?: string;
  openMultiple?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [panelOn, setPanelOn] = useState(true);
  const [help, setHelp] = useState(false);
  const helpRef = useRef(false);
  const [hint, setHint] = useState<string | null>(null);
  const hintTimer = useRef(0);

  const onHint = useCallback((text: string) => {
    setHint(text);
    window.clearTimeout(hintTimer.current);
    hintTimer.current = window.setTimeout(() => setHint(null), 1400);
  }, []);

  const open = useCallback(() => {
    fileRef.current?.click();
  }, []);

  const bound = useMemo<PhotoshopActions>(
    () => ({
      ...actions,
      open: actions?.onFiles ? open : undefined,
      togglePanel: () => setPanelOn((on) => !on),
      toggleHelp: () => setHelp((on) => !on),
      deselect: () => {
        if (helpRef.current) {
          setHelp(false);
          return;
        }
        actions?.deselect?.();
      },
      onHint,
    }),
    [actions, onHint, open],
  );

  useEffect(() => {
    helpRef.current = help;
  }, [help]);

  usePhotoshopShortcuts(bound);

  return (
    <div className={`photo-editor h-full${panelOn ? "" : " photo-editor--panel-off"}`}>
      <input
        ref={fileRef}
        type="file"
        accept={accept}
        multiple={openMultiple}
        className="sr-only"
        onChange={(event) => {
          const list = event.target.files;
          if (list?.length) actions?.onFiles?.(Array.from(list));
          event.currentTarget.value = "";
        }}
      />
      {toolbar ? (
        <div className="photo-editor__toolbar">
          {toolbar}
          {hint ? <span className="photo-editor__hint">{hint}</span> : null}
          <button type="button" className="btn btn-ghost min-h-10 px-3" onClick={() => setHelp(true)}>
            Keys
          </button>
        </div>
      ) : null}
      <div className={`photo-editor__body${rail ? " photo-editor__body--rail" : ""}`}>
        {rail ? (
          <nav className="photo-editor__rail" aria-label="Editor tools">
            {rail}
          </nav>
        ) : null}
        <div className="photo-editor__canvas">{hasFile ? canvas : empty}</div>
        <aside className="photo-editor__panel">{panel}</aside>
      </div>
      {help ? (
        <div className="photo-editor__help" role="dialog" aria-label="Photoshop keyboard shortcuts">
          <div className="photo-editor__help-card">
            <div className="flex items-center justify-between gap-3">
              <p className="label">Photoshop keys</p>
              <button type="button" className="btn btn-ghost min-h-10 px-3" onClick={() => setHelp(false)}>
                Close · Esc
              </button>
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
              Same bindings as Photoshop where this editor has the tool. Ctrl is Cmd on Mac. Press ? anytime.
            </p>
            <dl className="photo-editor__help-list">
              {PHOTOSHOP_SHORTCUTS.map((row) => (
                <div key={row.keys} className="photo-editor__help-row">
                  <dt>{row.keys}</dt>
                  <dd>{row.does}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      ) : null}
    </div>
  );
}
