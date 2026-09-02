"use client";

import { parseTypedSize, type SizeUnit } from "@/lib/target-size";
import { formatBytes } from "@/lib/format";

const PRESETS: Array<{ label: string; value: string; unit: SizeUnit }> = [
  { label: "1 KB", value: "1", unit: "KB" },
  { label: "2 KB", value: "2", unit: "KB" },
  { label: "3 KB", value: "3", unit: "KB" },
  { label: "10 KB", value: "10", unit: "KB" },
  { label: "20 KB", value: "20", unit: "KB" },
  { label: "30 KB", value: "30", unit: "KB" },
  { label: "50 KB", value: "50", unit: "KB" },
  { label: "100 KB", value: "100", unit: "KB" },
  { label: "200 KB", value: "200", unit: "KB" },
  { label: "500 KB", value: "500", unit: "KB" },
  { label: "1 MB", value: "1", unit: "MB" },
  { label: "2 MB", value: "2", unit: "MB" },
];

export function TargetSizeField({
  value,
  unit,
  onValue,
  onUnit,
}: {
  value: string;
  unit: SizeUnit;
  onValue: (next: string) => void;
  onUnit: (next: SizeUnit) => void;
}) {
  return (
    <div className="grid gap-3 md:col-span-2">
      <label className="grid gap-2 text-sm">
        Type any file size
        <div className="flex gap-2">
          <input
            className="field text-lg"
            inputMode="decimal"
            autoComplete="off"
            placeholder="1, 2, 3, 50, 1.5…"
            value={value}
            onChange={(event) => {
              const next = event.target.value;
              onValue(next);
              const parsed = parseTypedSize(next, unit);
              if (parsed && /[kmgb]/i.test(next)) onUnit(parsed.unit);
            }}
          />
          <select
            className="field max-w-28"
            value={unit}
            onChange={(event) => onUnit(event.target.value as SizeUnit)}
          >
            <option value="KB">KB</option>
            <option value="MB">MB</option>
            <option value="GB">GB</option>
          </select>
        </div>
      </label>
      <p className="text-sm text-[var(--ink-soft)]">
        Type <strong className="text-[#F5F5F1]">2</strong> and pick MB, or type{" "}
        <strong className="text-[#F5F5F1]">2mb</strong> /{" "}
        <strong className="text-[#F5F5F1]">50kb</strong> in the box. The file
        will come out at or under that size.
      </p>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((item) => (
          <button
            key={item.label}
            type="button"
            className={`btn min-h-10 px-3 ${value === item.value && unit === item.unit ? "btn-primary" : "btn-ghost"}`}
            onClick={() => {
              onValue(item.value);
              onUnit(item.unit);
            }}
          >
            {item.label}
          </button>
        ))}
        <button type="button" className="btn btn-ghost min-h-10 px-3" onClick={() => onValue("")}>
          Clear
        </button>
      </div>
      {parseTypedSize(value, unit) ? (
        <p className="text-sm text-brand">
          Output will be {formatBytes(parseTypedSize(value, unit)!.bytes)} or smaller.
        </p>
      ) : value.trim() ? (
        <p className="text-sm text-brand">Type a number such as 2, 50, 1.5mb, or 1gb.</p>
      ) : null}
    </div>
  );
}
