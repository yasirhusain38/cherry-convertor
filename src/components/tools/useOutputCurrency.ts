"use client";

import { useEffect, useState } from "react";
import {
  COUNTRY_CURRENCY,
  CURRENCY_MAP,
  countryNameFromCode,
  currencyFromCountryCode,
  detectLocaleLocation,
} from "@/data/currencies";

const STORAGE = "cherry-output-currency";
export const DEFAULT_OUTPUT_CURRENCY = "USD";

export type DetectedLocation = {
  country: string;
  countryName: string;
  currency: string;
};

export function useOutputCurrency() {
  const [code, setCode] = useState(DEFAULT_OUTPUT_CURRENCY);
  const [detected, setDetected] = useState<DetectedLocation | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE);
      if (saved && CURRENCY_MAP.has(saved)) setCode(saved);
    } catch {
      /* ignore */
    }

    const locale = detectLocaleLocation();
    if (locale) {
      setDetected({
        country: locale.country,
        countryName: countryNameFromCode(locale.country),
        currency: locale.currency,
      });
    }

    const ctrl = new AbortController();
    fetch("https://ipwho.is/?fields=success,country,country_code", { signal: ctrl.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((json: { success?: boolean; country?: string; country_code?: string } | null) => {
        if (!json?.success || !json.country_code) return;
        const currency = currencyFromCountryCode(json.country_code) ?? COUNTRY_CURRENCY[json.country_code];
        if (!currency || !CURRENCY_MAP.has(currency)) return;
        setDetected({
          country: json.country_code,
          countryName: json.country || countryNameFromCode(json.country_code),
          currency,
        });
      })
      .catch(() => {
        /* locale fallback is enough */
      });

    return () => ctrl.abort();
  }, []);

  function select(next: string) {
    if (!CURRENCY_MAP.has(next)) return;
    setCode(next);
    try {
      localStorage.setItem(STORAGE, next);
    } catch {
      /* ignore */
    }
  }

  return { code, select, detected };
}
