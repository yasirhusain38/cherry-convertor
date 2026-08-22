import { FALLBACK_USD_RATES } from "@/data/fx-fallback";

export type FxTable = {
  base: string;
  rates: Record<string, number>;
  updated: string;
  source: string;
};

export type LiveQuote = {
  table: FxTable;
  pairRate: number;
  pairSource: string;
  pairUpdated: string;
};

function asTable(base: string, rates: Record<string, number | string>, updated: string, source: string): FxTable {
  const normalised: Record<string, number> = { [base.toUpperCase()]: 1 };
  for (const [code, value] of Object.entries(rates)) {
    const num = Number(value);
    if (Number.isFinite(num) && num > 0) normalised[code.toUpperCase()] = num;
  }
  if (Object.keys(normalised).length < 8) throw new Error(`${source} too few rates`);
  return { base: base.toUpperCase(), rates: normalised, updated, source };
}

async function getJson(url: string, ms = 8000): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: ctrl.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`${url} ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchCoinbaseUsd(): Promise<FxTable> {
  const json = (await getJson("https://api.coinbase.com/v2/exchange-rates?currency=USD")) as {
    data?: { currency?: string; rates?: Record<string, string> };
  };
  if (!json.data?.rates) throw new Error("coinbase payload");
  return asTable(json.data.currency ?? "USD", json.data.rates, new Date().toISOString(), "Coinbase live");
}

export async function fetchYahooPair(from: string, to: string): Promise<{ rate: number; updated: string; symbol: string } | null> {
  if (from === to) return { rate: 1, updated: new Date().toISOString(), symbol: `${from}${to}` };
  const symbols = [`${from}${to}=X`, `${to}${from}=X`];
  for (const symbol of symbols) {
    try {
      const json = (await getJson(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=1d`,
      )) as {
        chart?: {
          result?: Array<{
            meta?: { regularMarketPrice?: number; regularMarketTime?: number };
          }>;
        };
      };
      const meta = json.chart?.result?.[0]?.meta;
      const price = Number(meta?.regularMarketPrice);
      if (!Number.isFinite(price) || price <= 0) continue;
      const updated = meta?.regularMarketTime
        ? new Date(meta.regularMarketTime * 1000).toISOString()
        : new Date().toISOString();
      const rate = symbol.startsWith(from) ? price : 1 / price;
      return { rate, updated, symbol };
    } catch {
      /* next symbol */
    }
  }
  return null;
}

async function fetchOpenEr(): Promise<FxTable> {
  const json = (await getJson("https://open.er-api.com/v6/latest/USD")) as {
    result?: string;
    base_code?: string;
    rates?: Record<string, number>;
    time_last_update_utc?: string;
  };
  if (json.result !== "success" || !json.rates) throw new Error("open.er-api payload");
  return asTable(json.base_code ?? "USD", json.rates, json.time_last_update_utc ?? new Date().toISOString(), "ExchangeRate-API");
}

async function fetchFawaz(): Promise<FxTable> {
  const json = (await getJson("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json")) as {
    date?: string;
    usd?: Record<string, number>;
  };
  if (!json.usd) throw new Error("fawaz payload");
  return asTable("USD", json.usd, json.date ? `${json.date}T00:00:00Z` : new Date().toISOString(), "currency-api");
}

export function fallbackTable(): FxTable {
  return asTable("USD", FALLBACK_USD_RATES, new Date().toISOString(), "Offline estimate");
}

export async function fetchLiveTable(): Promise<FxTable> {
  for (const loader of [fetchCoinbaseUsd, fetchOpenEr, fetchFawaz]) {
    try {
      return await loader();
    } catch {
      /* next */
    }
  }
  return fallbackTable();
}

export function convertAmount(amount: number, from: string, to: string, table: FxTable): number {
  if (!Number.isFinite(amount)) return 0;
  if (from === to) return amount;
  const usdFrom = table.rates[from];
  const usdTo = table.rates[to];
  if (!usdFrom || !usdTo) return NaN;
  return (amount / usdFrom) * usdTo;
}

export function pairRate(from: string, to: string, table: FxTable): number {
  return convertAmount(1, from, to, table);
}

export function applyPairOverride(table: FxTable, from: string, to: string, live: number): FxTable {
  if (!Number.isFinite(live) || live <= 0 || from === to) return table;
  const usdFrom = table.rates[from] || 1;
  const rates = { ...table.rates, [to]: usdFrom * live };
  return { ...table, rates };
}

export async function loadLiveQuote(from: string, to: string): Promise<LiveQuote> {
  const table = await fetchLiveTable();
  const yahoo = await fetchYahooPair(from, to);
  if (yahoo) {
    return {
      table: applyPairOverride(table, from, to, yahoo.rate),
      pairRate: yahoo.rate,
      pairSource: `Yahoo Finance ${yahoo.symbol}`,
      pairUpdated: yahoo.updated,
    };
  }
  const rate = pairRate(from, to, table);
  return {
    table,
    pairRate: rate,
    pairSource: table.source,
    pairUpdated: table.updated,
  };
}
