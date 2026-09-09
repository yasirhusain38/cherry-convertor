"use client";

import type { PdfThumb } from "@/lib/pdf-raster";

export function PdfPageGrid({
  pages,
  selected,
  onSelect,
  onRemove,
  focusPage,
  removable = false,
  rotate = 0,
  rotatePages,
  grayscale = false,
}: {
  pages: PdfThumb[];
  selected: number[];
  onSelect: (page: number, event: { ctrl: boolean; shift: boolean }) => void;
  onRemove?: (pages: number[]) => void;
  focusPage?: number | null;
  removable?: boolean;
  rotate?: number;
  rotatePages?: number[];
  grayscale?: boolean;
}) {
  const picked = new Set(selected);
  if (!pages.length) return null;

  return (
    <div className="pdf-pages" role="listbox" aria-multiselectable="true" aria-label="PDF pages">
      {pages.map((thumb) => {
        const on = picked.has(thumb.page);
        return (
          <div
            key={thumb.page}
            role="option"
            aria-selected={on}
            data-on={on}
            data-focus={focusPage === thumb.page}
            className="pdf-page"
            onClick={(event) =>
              onSelect(thumb.page, { ctrl: event.ctrlKey || event.metaKey, shift: event.shiftKey })
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumb.url}
              alt={`Page ${thumb.page}`}
              style={{
                filter: grayscale ? "grayscale(1)" : undefined,
                transform:
                  rotate && (!rotatePages?.length || rotatePages.includes(thumb.page))
                    ? `rotate(${rotate}deg)`
                    : undefined,
              }}
            />
            <span className="pdf-page__n">{thumb.page}</span>
            {removable ? (
              <button
                type="button"
                className="pdf-page__x"
                aria-label={`Remove page ${thumb.page}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove?.([thumb.page]);
                }}
              >
                ×
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function selectPages(
  pages: number[],
  selected: number[],
  anchor: number | null,
  page: number,
  mods: { ctrl: boolean; shift: boolean },
): { selected: number[]; anchor: number } {
  if (mods.shift && anchor != null) {
    const a = pages.indexOf(anchor);
    const b = pages.indexOf(page);
    if (a < 0 || b < 0) return { selected: [page], anchor: page };
    const [lo, hi] = a < b ? [a, b] : [b, a];
    return { selected: pages.slice(lo, hi + 1), anchor };
  }
  if (mods.ctrl) {
    const set = new Set(selected);
    if (set.has(page)) set.delete(page);
    else set.add(page);
    const next = pages.filter((item) => set.has(item));
    return { selected: next, anchor: page };
  }
  return { selected: [page], anchor: page };
}
