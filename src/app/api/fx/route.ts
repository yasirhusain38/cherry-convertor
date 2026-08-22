import { applyPairOverride, fetchLiveTable, fetchYahooPair, pairRate } from "@/lib/fx";
import { NextResponse } from "next/server";

type Body = {
  ok: boolean;
  base: string;
  rates: Record<string, number>;
  updated: string;
  source: string;
  pairFrom: string;
  pairTo: string;
  pairRate: number;
  pairSource: string;
  pairUpdated: string;
};

let tableCache: { at: number; table: Awaited<ReturnType<typeof fetchLiveTable>> } | null = null;
const pairCache = new Map<string, { at: number; rate: number; source: string; updated: string }>();
const TABLE_TTL = 20_000;
const PAIR_TTL = 10_000;

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const from = (url.searchParams.get("from") ?? "USD").toUpperCase();
  const to = (url.searchParams.get("to") ?? "INR").toUpperCase();

  try {
    const now = Date.now();
    if (!tableCache || now - tableCache.at > TABLE_TTL) {
      tableCache = { at: now, table: await fetchLiveTable() };
    }
    let table = tableCache.table;

    const key = `${from}:${to}`;
    let pair = pairCache.get(key);
    if (!pair || now - pair.at > PAIR_TTL) {
      const yahoo = await fetchYahooPair(from, to);
      if (yahoo) {
        pair = { at: now, rate: yahoo.rate, source: `Yahoo Finance ${yahoo.symbol}`, updated: yahoo.updated };
      } else {
        pair = {
          at: now,
          rate: pairRate(from, to, table),
          source: table.source,
          updated: table.updated,
        };
      }
      pairCache.set(key, pair);
    }

    table = applyPairOverride(table, from, to, pair.rate);

    const body: Body = {
      ok: true,
      base: table.base,
      rates: table.rates,
      updated: table.updated,
      source: table.source,
      pairFrom: from,
      pairTo: to,
      pairRate: pair.rate,
      pairSource: pair.source,
      pairUpdated: pair.updated,
    };

    return NextResponse.json(body, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "FX unavailable" },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
