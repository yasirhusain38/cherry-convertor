"use client";

import { useMemo, useState } from "react";
import {
  addYmd,
  ageOn,
  businessDaysBetween,
  diffDays,
  formatYmd,
  isoToUnix,
  isoWeek,
  nextBirthday,
  parseYmd,
  unixToIso,
  type HolidayPack,
} from "@/lib/datetime";
import type { ToolDef } from "@/lib/tools";

function kindOf(slug: string): "age" | "diff" | "business" | "unix" {
  if (slug.includes("age")) return "age";
  if (slug.includes("business")) return "business";
  if (slug.includes("unix") || slug.includes("timestamp")) return "unix";
  return "diff";
}

function todayYmd() {
  return formatYmd(new Date());
}

export function DateStudio({ tool }: { tool: ToolDef }) {
  const kind = kindOf(tool.slug);
  const [dob, setDob] = useState("1990-06-15");
  const [a, setA] = useState("2026-01-01");
  const [b, setB] = useState(todayYmd());
  const [pack, setPack] = useState<HolidayPack>("us");
  const [add, setAdd] = useState({ y: "0", m: "0", d: "14" });
  const [unix, setUnix] = useState(String(Math.floor(Date.now() / 1000)));
  const [error, setError] = useState<string | null>(null);

  const result = useMemo(() => {
    try {
      if (kind === "age") {
        const d = parseYmd(dob);
        const t = parseYmd(todayYmd());
        const age = ageOn(d, t);
        const next = nextBirthday(d, t);
        return `Age ${age.years} years, ${age.months} months, ${age.days} days. Next birthday ${next.y}-${String(next.m).padStart(2, "0")}-${String(next.d).padStart(2, "0")} (${diffDays(t, next)} days).`;
      }
      if (kind === "diff") {
        const A = parseYmd(a);
        const B = parseYmd(b);
        const days = diffDays(A, B);
        const added = addYmd(A, Number(add.y) || 0, Number(add.m) || 0, Number(add.d) || 0);
        const week = isoWeek(B);
        return `${days} calendar days between. ISO week of the end date: ${week.year}-W${String(week.week).padStart(2, "0")}. Start + offsets = ${added.y}-${String(added.m).padStart(2, "0")}-${String(added.d).padStart(2, "0")}.`;
      }
      if (kind === "business") {
        const days = businessDaysBetween(parseYmd(a), parseYmd(b), pack);
        return `${days} business days (Sat/Sun skipped; ${pack.toUpperCase()} holiday pack is a short built-in list, not a gazette).`;
      }
      return unixToIso(Number(unix));
    } catch (err) {
      return err instanceof Error ? err.message : "Could not calculate.";
    }
  }, [a, add.d, add.m, add.y, b, dob, kind, pack, unix]);

  return (
    <div className="grid gap-6">
      <p className="text-sm text-[var(--ink-soft)]">Calendar math in this tab. Dates never leave the device.</p>
      {kind === "age" ? (
        <label className="grid max-w-sm gap-2 text-sm">
          Date of birth
          <input className="field" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
        </label>
      ) : null}
      {kind === "diff" || kind === "business" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm">
            Start
            <input className="field" type="date" value={a} onChange={(e) => setA(e.target.value)} />
          </label>
          <label className="grid gap-2 text-sm">
            End
            <input className="field" type="date" value={b} onChange={(e) => setB(e.target.value)} />
          </label>
        </div>
      ) : null}
      {kind === "diff" ? (
        <div className="grid grid-cols-3 gap-3 max-w-md">
          <label className="grid gap-2 text-sm">
            + years
            <input className="field" value={add.y} onChange={(e) => setAdd({ ...add, y: e.target.value })} />
          </label>
          <label className="grid gap-2 text-sm">
            + months
            <input className="field" value={add.m} onChange={(e) => setAdd({ ...add, m: e.target.value })} />
          </label>
          <label className="grid gap-2 text-sm">
            + days
            <input className="field" value={add.d} onChange={(e) => setAdd({ ...add, d: e.target.value })} />
          </label>
        </div>
      ) : null}
      {kind === "business" ? (
        <label className="grid max-w-sm gap-2 text-sm">
          Holiday pack
          <select className="field" value={pack} onChange={(e) => setPack(e.target.value as HolidayPack)}>
            <option value="none">Weekends only</option>
            <option value="us">US federal (sample)</option>
            <option value="uk">UK bank (sample)</option>
            <option value="uae">UAE (sample)</option>
            <option value="in">India gazetted (sample)</option>
          </select>
        </label>
      ) : null}
      {kind === "unix" ? (
        <div className="grid gap-3 max-w-lg">
          <label className="grid gap-2 text-sm">
            Unix seconds
            <input className="field font-mono" value={unix} onChange={(e) => setUnix(e.target.value)} />
          </label>
          <button
            type="button"
            className="btn btn-ghost w-fit"
            onClick={() => {
              try {
                setUnix(String(isoToUnix(new Date().toISOString())));
              } catch (err) {
                setError(err instanceof Error ? err.message : "fail");
              }
            }}
          >
            Now
          </button>
        </div>
      ) : null}
      <div className="card p-5 text-lg tracking-tight">{result}</div>
      {error ? <p className="text-sm text-brand">{error}</p> : null}
    </div>
  );
}
