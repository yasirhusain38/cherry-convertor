"use client";

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
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className="btn btn-ghost min-h-10 px-3" disabled={!canUndo} onClick={undo}>
        Undo
      </button>
      <button type="button" className="btn btn-ghost min-h-10 px-3" disabled={!canRedo} onClick={redo}>
        Redo
      </button>
    </div>
  );
}
