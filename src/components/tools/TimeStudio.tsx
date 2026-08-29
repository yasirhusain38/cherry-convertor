"use client";

import { useEffect, useMemo, useState } from "react";
import {
  WORLD_CITIES,
  bestSlotThisWeek,
  convertInstant,
  overlapHours,
  zonedParts,
} from "@/lib/datetime";
import type { ToolDef } from "@/lib/tools";

function kindOf(slug: string): "convert" | "meeting" | "clock" {
  if (slug.includes("meeting")) return "meeting";
  if (slug.includes("world-clock")) return "clock";
  return "convert";
}

export function TimeStudio({ tool }: { tool: ToolDef }) {
  const kind = kindOf(tool.slug);
  const [from, setFrom] = useState("America/New_York");
  const [to, setTo] = useState("Europe/London");
  const [when, setWhen] = useState(() => new Date().toISOString().slice(0, 16));
  const [picked, setPicked] = useState(["America/New_York", "Europe/London", "Asia/Kolkata"]);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(id);
  }, []);

  const converted = useMemo(() => {
    try {
      return convertInstant(when, from, to);
    } catch {
      return null;
    }
  }, [when, from, to]);

  const overlap = useMemo(() => overlapHours(now, picked), [now, picked]);
  const suggestion = useMemo(() => bestSlotThisWeek(picked), [picked]);

  return (
    <div className="grid gap-6">
      <p className="text-sm text-[var(--ink-soft)]">DST-aware via IANA time zones in this browser. 0 uploads.</p>
      {kind === "convert" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm">
            From
            <select className="field" value={from} onChange={(e) => setFrom(e.target.value)}>
              {WORLD_CITIES.map((c) => (
                <option key={c.id} value={c.tz}>
                  {c.city} — {c.tz}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            To
            <select className="field" value={to} onChange={(e) => setTo(e.target.value)}>
              {WORLD_CITIES.map((c) => (
                <option key={`to-${c.id}`} value={c.tz}>
                  {c.city} — {c.tz}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm md:col-span-2">
            Local date and time in the From zone
            <input className="field" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
          </label>
          {converted ? (
            <div className="card p-5 md:col-span-2">
              <p className="label">In {to}</p>
              <p className="mt-2 text-2xl tracking-tight">{converted.label}</p>
              <p className="mt-1 font-mono text-sm text-[var(--ink-soft)]">{converted.iso}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {kind === "meeting" ? (
        <div className="grid gap-4">
          <p className="text-sm">Pick 2–8 cities. Green hours are 09:00–18:00 in every zone.</p>
          <div className="flex flex-wrap gap-2">
            {WORLD_CITIES.map((c) => {
              const on = picked.includes(c.tz);
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`btn ${on ? "btn-primary" : "btn-ghost"}`}
                  onClick={() =>
                    setPicked((prev) => {
                      if (on) return prev.filter((z) => z !== c.tz);
                      if (prev.length >= 8) return prev;
                      return [...prev, c.tz];
                    })
                  }
                >
                  {c.city}
                </button>
              );
            })}
          </div>
          <p className="text-sm">
            Overlap UTC hours today: {overlap.length ? overlap.map((h) => `${String(h).padStart(2, "0")}:00`).join(", ") : "none"}
          </p>
          {suggestion ? (
            <div className="card p-5">
              <p className="label">Suggested slot this week</p>
              <p className="mt-2">{suggestion.day} · UTC {String(suggestion.utcHour).padStart(2, "0")}:00</p>
              <ul className="mt-2 grid gap-1 text-sm text-[var(--ink-soft)]">
                {suggestion.labels.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-brand">No 09:00–18:00 overlap this week for that set.</p>
          )}
        </div>
      ) : null}

      {kind === "clock" ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {WORLD_CITIES.map((c) => {
            const p = zonedParts(now, c.tz);
            return (
              <li key={c.id} className="card p-4">
                <p className="label">{c.country}</p>
                <p className="mt-1 text-lg">{c.city}</p>
                <p className="mt-2 font-mono text-sm">{p.label}</p>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
