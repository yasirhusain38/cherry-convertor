"use client";

import { useCallback, useEffect, useState } from "react";
import { CURRENCY_MAP, POPULAR_PAIRS, formatMoney, localeCurrency } from "@/data/currencies";
import { convertAmount, fallbackTable, loadLiveQuote, pairRate, type FxTable } from "@/lib/fx";
import { CurrencyPick } from "./CurrencyPick";

const SNAPSHOT = ["USD", "EUR", "GBP", "INR", "AED", "JPY", "AUD", "CAD", "SGD", "SAR"];
const TABLE_AMOUNTS = [1, 5, 10, 25, 50, 100, 250, 500, 1000, 5000];
const STORAGE = "cherry-fx";

function parseAmt(value: string): number {
  const n = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : 0;
}

function pretty(n: number): string {
  if (!Number.isFinite(n)) return "";
  const abs = Math.abs(n);
  const digits = abs >= 1000 ? 2 : abs >= 1 ? 4 : 6;
  return n.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}

export function CurrencyConverter() {
  const [draft, setDraft] = useState("1");
  const [editing, setEditing] = useState<"from" | "to">("from");
  const [from, setFrom] = useState("EUR");
  const [to, setTo] = useState("USD");
  const [table, setTable] = useState<FxTable>(() => fallbackTable());
  const [liveRate, setLiveRate] = useState<number>(NaN);
  const [pairSource, setPairSource] = useState("Connecting");
  const [pairUpdated, setPairUpdated] = useState("");
  const [status, setStatus] = useState<"loading" | "live" | "offline">("loading");
  const [copied, setCopied] = useState(false);
  const [clock, setClock] = useState("");

  const load = useCallback(async (fromCode: string, toCode: string) => {
    setStatus((prev) => (prev === "live" ? "live" : "loading"));
    try {
      const res = await fetch(`/api/fx?from=${encodeURIComponent(fromCode)}&to=${encodeURIComponent(toCode)}&t=${Date.now()}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const json = (await res.json()) as {
          ok?: boolean;
          rates?: Record<string, number>;
          base?: string;
          updated?: string;
          source?: string;
          pairRate?: number;
          pairSource?: string;
          pairUpdated?: string;
        };
        if (json.ok !== false && json.rates && json.pairRate) {
          setTable({
            base: json.base ?? "USD",
            rates: json.rates,
            updated: json.updated ?? new Date().toISOString(),
            source: json.source ?? "Live",
          });
          setLiveRate(json.pairRate);
          setPairSource(json.pairSource ?? json.source ?? "Live");
          setPairUpdated(json.pairUpdated ?? json.updated ?? new Date().toISOString());
          setStatus("live");
          return;
        }
      }
      const quote = await loadLiveQuote(fromCode, toCode);
      setTable(quote.table);
      setLiveRate(quote.pairRate);
      setPairSource(quote.pairSource);
      setPairUpdated(quote.pairUpdated);
      setStatus(quote.table.source.includes("Offline") ? "offline" : "live");
    } catch {
      setTable(fallbackTable());
      setLiveRate(NaN);
      setPairSource("Offline estimate");
      setStatus("offline");
    }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) {
        const saved = JSON.parse(raw) as { draft?: string; fromAmt?: string; from?: string; to?: string };
        const start = saved.draft || saved.fromAmt;
        if (start && parseAmt(start) > 0) setDraft(start);
        if (saved.from && CURRENCY_MAP.has(saved.from)) setFrom(saved.from);
        if (saved.to && CURRENCY_MAP.has(saved.to)) setTo(saved.to);
      } else {
        const guessed = localeCurrency();
        setFrom(guessed.from);
        setTo(guessed.to);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void load(from, to);
    const id = window.setInterval(() => void load(from, to), 30_000);
    return () => window.clearInterval(id);
  }, [from, to, load]);

  useEffect(() => {
    function tick() {
      const stamp = pairUpdated || table.updated;
      const then = Date.parse(stamp);
      if (!Number.isFinite(then)) {
        setClock(stamp);
        return;
      }
      const sec = Math.max(0, Math.round((Date.now() - then) / 1000));
      setClock(sec < 5 ? "just now" : sec < 60 ? `${sec}s ago` : `${Math.max(1, Math.round(sec / 60))}m ago`);
    }
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [pairUpdated, table.updated]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE, JSON.stringify({ draft, from, to }));
    } catch {
      /* ignore */
    }
  }, [draft, from, to]);

  const rate = Number.isFinite(liveRate) && liveRate > 0 ? liveRate : pairRate(from, to, table);
  const inverse = Number.isFinite(rate) && rate > 0 ? 1 / rate : pairRate(to, from, table);
  const ready = Number.isFinite(rate) && rate > 0;
  const typed = parseAmt(draft);
  const fromValue = editing === "from" ? typed : ready ? typed / rate : NaN;
  const toValue = editing === "from" ? (ready ? typed * rate : NaN) : typed;

  const fromText = editing === "from" ? draft : pretty(fromValue);
  const toText = editing === "to" ? draft : pretty(toValue);

  async function copy() {
    if (!ready || !Number.isFinite(toValue)) return;
    try {
      await navigator.clipboard.writeText(`${formatMoney(fromValue, from)} = ${formatMoney(toValue, to)}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  function swap() {
    setFrom(to);
    setTo(from);
    setEditing((side) => (side === "from" ? "to" : "from"));
  }

  return (
    <div className="grid gap-8">
      <div className="grid gap-8 lg:grid-cols-12">
        <form className="card grid gap-5 p-6 lg:col-span-5" onSubmit={(event) => event.preventDefault()}>
          <div className="flex items-center justify-between gap-3">
            <p className="label">Live convert</p>
            <p className="label flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${status === "live" ? "bg-[#22c55e]" : "bg-[#F2013F]"}`} />
              {status === "live" ? `Live · ${clock || "now"}` : status === "loading" ? "Fetching live rate" : "Offline estimate"}
            </p>
          </div>

          <div className="grid gap-2">
            <span className="text-sm">From</span>
            <input
              className="field text-3xl"
              inputMode="decimal"
              autoComplete="off"
              value={fromText}
              onChange={(event) => {
                setEditing("from");
                setDraft(event.target.value);
              }}
            />
            <CurrencyPick label="from" value={from} onChange={setFrom} />
          </div>

          <button type="button" className="btn btn-ghost" onClick={swap}>
            Swap {from} ↔ {to}
          </button>

          <div className="grid gap-2">
            <span className="text-sm">To</span>
            <input
              className="field text-3xl"
              inputMode="decimal"
              autoComplete="off"
              value={toText}
              onChange={(event) => {
                setEditing("to");
                setDraft(event.target.value);
              }}
            />
            <CurrencyPick label="to" value={to} onChange={setTo} />
          </div>

          <div className="flex flex-wrap gap-2">
            {["1", "10", "50", "100", "500", "1000"].map((value) => (
              <button
                key={value}
                type="button"
                className={`rounded-full border px-3 py-1 text-xs ${
                  editing === "from" && draft === value
                    ? "border-[#F2013F] bg-[#F2013F] text-[#F5F5F1]"
                    : "border-[var(--line)] text-[var(--ink-soft)]"
                }`}
                onClick={() => {
                  setEditing("from");
                  setDraft(value);
                }}
              >
                {value}
              </button>
            ))}
          </div>
        </form>

        <aside className="card grid gap-6 p-6 lg:col-span-7">
          <p className="label">Result</p>
          <p className="display text-4xl text-brand md:text-5xl">
            {ready && Number.isFinite(toValue) ? formatMoney(toValue, to) : "—"}
          </p>
          <p className="text-lg text-[var(--ink-soft)]">
            {CURRENCY_MAP.get(from)?.flag} {ready ? formatMoney(fromValue, from) : "—"} → {CURRENCY_MAP.get(to)?.flag}{" "}
            {to}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--line)] p-4">
              <p className="label">Mid-market rate</p>
              <p className="mt-2 text-xl tracking-tight">1 {from} = {ready ? pretty(rate) : "—"} {to}</p>
            </div>
            <div className="rounded-2xl border border-[var(--line)] p-4">
              <p className="label">Inverse</p>
              <p className="mt-2 text-xl tracking-tight">1 {to} = {ready && inverse ? pretty(inverse) : "—"} {from}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn btn-ghost min-h-10 px-4" onClick={() => void load(from, to)}>
              Refresh now
            </button>
            <button type="button" className="btn btn-ghost min-h-10 px-4" onClick={() => void copy()}>
              {copied ? "Copied" : "Copy result"}
            </button>
            <span className="self-center text-sm text-[var(--ink-soft)]">
              {pairSource}
              {clock ? ` · ${clock}` : ""}
            </span>
          </div>
          <div>
            <p className="label mb-4">Same amount in other currencies</p>
            <div className="grid grid-cols-2 gap-3">
              {[...new Set([to, ...SNAPSHOT])]
                .filter((code) => table.rates[code])
                .map((code) => {
                  const value = convertAmount(fromValue, from, code, table);
                  return (
                    <button
                      key={code}
                      type="button"
                      className={`rounded-2xl border p-4 text-left ${code === to ? "border-[#F2013F]" : "border-[var(--line)]"}`}
                      onClick={() => setTo(code)}
                    >
                      <p className="label">
                        {CURRENCY_MAP.get(code)?.flag} {code}
                      </p>
                      <p className={`mt-2 text-lg tracking-tight ${code === to ? "text-brand" : ""}`}>
                        {Number.isFinite(value) ? formatMoney(value, code) : "—"}
                      </p>
                    </button>
                  );
                })}
            </div>
          </div>
        </aside>
      </div>

      <div className="flex flex-wrap gap-2">
        {POPULAR_PAIRS.map(([a, b]) => (
          <button
            key={`${a}-${b}`}
            type="button"
            className={`rounded-full border px-4 py-2 text-sm ${
              from === a && to === b ? "border-[#F2013F] bg-[#F2013F] text-[#F5F5F1]" : "border-[var(--line)]"
            }`}
            onClick={() => {
              setFrom(a);
              setTo(b);
            }}
          >
            {CURRENCY_MAP.get(a)?.flag} {a} → {CURRENCY_MAP.get(b)?.flag} {b}
          </button>
        ))}
      </div>

      {ready ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <RateTable from={from} to={to} rate={rate} />
          <RateTable from={to} to={from} rate={inverse} />
        </div>
      ) : null}
    </div>
  );
}

function RateTable({ from, to, rate }: { from: string; to: string; rate: number }) {
  return (
    <div className="card overflow-hidden p-0">
      <div className="border-b border-[var(--line)] px-5 py-4">
        <p className="label">
          {from} → {to}
        </p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[var(--ink-faint)]">
            <th className="px-5 py-3 font-normal">{from}</th>
            <th className="px-5 py-3 font-normal">{to}</th>
          </tr>
        </thead>
        <tbody>
          {TABLE_AMOUNTS.map((value) => (
            <tr key={value} className="border-t border-[var(--line)]">
              <td className="px-5 py-3">{formatMoney(value, from)}</td>
              <td className="px-5 py-3 text-brand">{formatMoney(value * rate, to)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
