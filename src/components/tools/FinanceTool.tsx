"use client";

import { useMemo, useState } from "react";
import type { FinanceTool as FinanceToolDef } from "@/data/finance-tools";
import { runFinance } from "@/lib/finance";
import { CurrencyConverter } from "./CurrencyConverter";
import { FinanceChart } from "./FinanceChart";
import { FinanceCurrencyBar } from "./FinanceCurrencyBar";
import { useOutputCurrency } from "./useOutputCurrency";

export function FinanceTool({ tool }: { tool: FinanceToolDef }) {
  if (tool.engine === "currency") {
    return <CurrencyConverter />;
  }
  return <GenericFinanceTool tool={tool} />;
}

const MONEY_KEYS = new Set([
  "principal",
  "contribution",
  "amount",
  "income",
  "housing",
  "food",
  "living",
  "transport",
  "other",
  "savings",
  "final",
  "monthly",
  "extra",
  "compare",
  "base",
  "salary",
  "hra",
  "rent",
  "basic",
  "gain",
  "exemption",
  "yearly",
]);

function GenericFinanceTool({ tool }: { tool: FinanceToolDef }) {
  const global = tool.countrySlug === "global";
  const output = useOutputCurrency();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(tool.fields.map((field) => [field.key, field.def])),
  );

  const currency = global ? output.code : tool.currency;

  const result = useMemo(() => {
    const input: Record<string, string | number> = { currency };
    for (const field of tool.fields) {
      input[field.key] = values[field.key] ?? "";
    }
    return runFinance(tool.engine, input);
  }, [tool, values, currency]);

  return (
    <div className="grid gap-8">
      {global ? <FinanceCurrencyBar code={output.code} onChange={output.select} detected={output.detected} /> : null}
      <div className="grid gap-8 lg:grid-cols-12">
        <form className="card grid gap-4 p-6 lg:col-span-5" onSubmit={(event) => event.preventDefault()}>
          <p className="label">Inputs{global ? ` · ${output.code}` : ""}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {tool.fields.map((field) => (
              <label key={field.key} className="grid gap-2 text-sm">
                {field.label}
                {field.kind === "select" || field.key === "frequency" ? (
                  <select
                    className="field"
                    value={values[field.key]}
                    onChange={(event) => setValues((prev) => ({ ...prev, [field.key]: event.target.value }))}
                  >
                    {(field.options ?? [
                      { value: "1", label: "Annually (1)" },
                      { value: "2", label: "Half-yearly (2)" },
                      { value: "4", label: "Quarterly (4)" },
                      { value: "12", label: "Monthly (12)" },
                      { value: "365", label: "Daily (365)" },
                    ]).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <input
                      className="field text-lg"
                      inputMode="decimal"
                      autoComplete="off"
                      value={values[field.key]}
                      onChange={(event) => setValues((prev) => ({ ...prev, [field.key]: event.target.value }))}
                    />
                    {MONEY_KEYS.has(field.key) && global ? (
                      <span className="label self-center">{output.code}</span>
                    ) : field.suffix ? (
                      <span className="label self-center">{field.suffix}</span>
                    ) : null}
                  </div>
                )}
              </label>
            ))}
          </div>
          <p className="text-sm text-[var(--ink-soft)]">Numbers stay in this tab. Nothing is sent to a server.</p>
        </form>
        <aside className="card p-6 lg:col-span-7">
          {result.chart ? <FinanceChart chart={result.chart} /> : <p className="label">Result</p>}
        </aside>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {result.rows.map((row) => (
          <div key={row.label} className="card p-5">
            <p className="label">{row.label}</p>
            <p className={`mt-2 tracking-tight ${row.emphasize ? "text-3xl text-brand" : "text-2xl"}`}>{row.value}</p>
          </div>
        ))}
      </div>
      {result.note ? <p className="text-sm leading-6 text-[var(--ink-soft)]">{result.note}</p> : null}
      {result.table ? (
        <div className="card overflow-x-auto p-0">
          <div className="border-b border-[var(--line)] px-5 py-4">
            <p className="label">{result.table.title}</p>
          </div>
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="text-[var(--ink-faint)]">
                {result.table.headers.map((header) => (
                  <th key={header} className="px-5 py-3 font-normal">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.table.rows.map((row, index) => (
                <tr key={index} className="border-t border-[var(--line)]">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className={`px-5 py-3 ${cellIndex === row.length - 1 ? "text-brand" : ""}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
