"use client";

import { CURRENCY_MAP } from "@/data/currencies";
import { CurrencyPick } from "./CurrencyPick";
import { DEFAULT_OUTPUT_CURRENCY, type DetectedLocation } from "./useOutputCurrency";

export function FinanceCurrencyBar({
  code,
  onChange,
  detected,
}: {
  code: string;
  onChange: (code: string) => void;
  detected: DetectedLocation | null;
}) {
  const current = CURRENCY_MAP.get(code);
  const showDetect = detected && detected.currency !== code;

  return (
    <div className="card grid gap-4 p-5 md:grid-cols-[1fr_minmax(16rem,20rem)] md:items-end">
      <div>
        <p className="label">Output currency</p>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Results show in {current?.name ?? code}. Default is USD. Pick any currency, or use the one for your location.
        </p>
        {showDetect ? (
          <button
            type="button"
            className="mt-3 rounded-full border border-[var(--line)] px-4 py-2 text-sm"
            onClick={() => onChange(detected.currency)}
          >
            Detected {detected.countryName} · use {detected.currency}
          </button>
        ) : null}
        {code !== DEFAULT_OUTPUT_CURRENCY ? (
          <button
            type="button"
            className="mt-3 ml-2 rounded-full border border-[var(--line)] px-4 py-2 text-sm"
            onClick={() => onChange(DEFAULT_OUTPUT_CURRENCY)}
          >
            Reset to USD
          </button>
        ) : null}
      </div>
      <CurrencyPick label="output" value={code} onChange={onChange} />
    </div>
  );
}
