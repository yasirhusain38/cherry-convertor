"use client";

import type { ChartSlice, FinanceChartSpec } from "@/lib/finance";

const PALETTE = ["#F2013F", "#F5F5F1", "#B81D24", "rgba(245,245,241,0.42)", "#8A1218"];

function compact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(abs >= 1e11 ? 0 : 1)}B`;
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(abs >= 1e8 ? 0 : 1)}M`;
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(abs >= 1e5 ? 0 : 1)}k`;
  return `${sign}${abs.toFixed(abs >= 10 ? 0 : 1)}`;
}

function polar(cx: number, cy: number, r: number, angle: number): [number, number] {
  const rad = ((angle - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function arcPath(cx: number, cy: number, r: number, start: number, end: number): string {
  const [x1, y1] = polar(cx, cy, r, start);
  const [x2, y2] = polar(cx, cy, r, end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

function Donut({ slices, title }: { slices: ChartSlice[]; title: string }) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  if (total <= 0) return null;
  const cx = 120;
  const cy = 120;
  const r = 74;
  let cursor = 0;
  const gap = slices.length > 1 ? 2.4 : 0;
  const usable = 360 - gap * slices.length;

  return (
    <div className="grid justify-items-center gap-4">
      <svg viewBox="0 0 240 240" className="w-full max-w-[260px]" role="img" aria-label={title}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(245,245,241,0.08)" strokeWidth="22" />
        {slices.map((slice, index) => {
          const sweep = (slice.value / total) * usable;
          const start = cursor + gap / 2;
          const end = start + Math.max(sweep, 0.4);
          cursor += sweep + gap;
          return (
            <path
              key={slice.label}
              d={arcPath(cx, cy, r, start, end)}
              fill="none"
              stroke={PALETTE[index % PALETTE.length]}
              strokeWidth="22"
              strokeLinecap="butt"
              pathLength={1}
              className="finance-draw"
            />
          );
        })}
        <text x={cx} y={cy - 8} textAnchor="middle" fill="#F5F5F1" fontSize="22" fontWeight="500">
          {compact(total)}
        </text>
        <text x={cx} y={cy + 16} textAnchor="middle" fill="rgba(245,245,241,0.55)" fontSize="10" letterSpacing="2">
          TOTAL
        </text>
      </svg>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[rgba(245,245,241,0.08)]">
        {slices.map((slice, index) => (
          <div
            key={`stack-${slice.label}`}
            className="h-full finance-bar"
            style={{
              width: `${(slice.value / total) * 100}%`,
              background: PALETTE[index % PALETTE.length],
            }}
          />
        ))}
      </div>
      <ul className="grid w-full gap-2">
        {slices.map((slice, index) => (
          <li key={slice.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-[var(--ink-soft)]">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: PALETTE[index % PALETTE.length] }} />
              {slice.label}
            </span>
            <span className="tabular-nums text-[#F5F5F1]">
              {compact(slice.value)} · {((slice.value / total) * 100).toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Area({
  labels,
  series,
  title,
}: {
  labels: string[];
  series: FinanceChartSpec["series"];
  title: string;
}) {
  if (!series?.length || !labels.length) return null;
  const width = 640;
  const height = 280;
  const pad = { l: 48, r: 16, t: 20, b: 36 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const all = series.flatMap((item) => item.values);
  const max = Math.max(...all, 1);
  const min = 0;
  const span = max - min || 1;
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => min + span * t);

  const point = (index: number, value: number, count: number): [number, number] => {
    const x = pad.l + (count <= 1 ? innerW / 2 : (index / (count - 1)) * innerW);
    const y = pad.t + innerH - ((value - min) / span) * innerH;
    return [x, y];
  };

  const colors = ["#F2013F", "rgba(245,245,241,0.72)"];
  const fills = ["url(#financeRed)", "url(#financePaper)"];

  return (
    <div className="grid gap-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label={title}>
        <defs>
          <linearGradient id="financeRed" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#F2013F" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#F2013F" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="financePaper" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#F5F5F1" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#F5F5F1" stopOpacity="0" />
          </linearGradient>
        </defs>
        {yTicks.map((tick) => {
          const y = pad.t + innerH - ((tick - min) / span) * innerH;
          return (
            <g key={tick}>
              <line x1={pad.l} x2={width - pad.r} y1={y} y2={y} stroke="rgba(245,245,241,0.1)" />
              <text x={pad.l - 8} y={y + 4} textAnchor="end" fill="rgba(245,245,241,0.45)" fontSize="11">
                {compact(tick)}
              </text>
            </g>
          );
        })}
        {series.map((item, seriesIndex) => {
          const count = item.values.length;
          const line = item.values
            .map((value, index) => {
              const [x, y] = point(index, value, count);
              return `${index === 0 ? "M" : "L"} ${x} ${y}`;
            })
            .join(" ");
          const [xFirst, yBase] = point(0, 0, count);
          const [xLast] = point(count - 1, 0, count);
          const area = `${line} L ${xLast} ${yBase} L ${xFirst} ${yBase} Z`;
          const last = item.values[item.values.length - 1] ?? 0;
          const [lx, ly] = point(count - 1, last, count);
          return (
            <g key={item.name}>
              <path d={area} fill={fills[seriesIndex % fills.length]} className="finance-fill" />
              <path
                d={line}
                fill="none"
                stroke={colors[seriesIndex % colors.length]}
                strokeWidth="2.5"
                strokeLinejoin="round"
                pathLength={1}
                className="finance-draw"
              />
              <circle cx={lx} cy={ly} r="4.5" fill={colors[seriesIndex % colors.length]} />
            </g>
          );
        })}
        {labels.map((label, index) => {
          const [x] = point(index, 0, labels.length);
          const show = labels.length <= 10 || index === 0 || index === labels.length - 1 || index % 2 === 0;
          if (!show) return null;
          return (
            <text key={`${label}-${index}`} x={x} y={height - 12} textAnchor="middle" fill="rgba(245,245,241,0.5)" fontSize="11">
              {label}
            </text>
          );
        })}
      </svg>
      <ul className="flex flex-wrap gap-4 text-sm text-[var(--ink-soft)]">
        {series.map((item, index) => (
          <li key={item.name} className="flex items-center gap-2">
            <span className="h-2 w-6 rounded-full" style={{ background: colors[index % colors.length] }} />
            {item.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Bars({
  labels,
  values,
  title,
}: {
  labels: string[];
  values: number[];
  title: string;
}) {
  const max = Math.max(...values, 1);
  return (
    <div className="grid gap-3" role="img" aria-label={title}>
      {labels.map((label, index) => {
        const value = values[index] ?? 0;
        const width = Math.max(2, (value / max) * 100);
        return (
          <div key={label} className="grid gap-1">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--ink-soft)]">{label}</span>
              <span className="tabular-nums">{compact(value)}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[rgba(245,245,241,0.08)]">
              <div
                className="h-full rounded-full bg-[#F2013F] finance-bar"
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function FinanceChart({ chart }: { chart: FinanceChartSpec }) {
  const slices = (chart.slices ?? []).filter((slice) => slice.value > 0);
  const series = chart.series ?? [];
  const labels = chart.labels ?? [];
  const timeSeries = labels.some((label) => label === "Now" || /y$/.test(label));
  const hasArea = series.length > 0 && labels.length > 2 && timeSeries;
  const hasBars = series.length === 1 && labels.length > 0 && !hasArea;

  if (!slices.length && !series.length) return null;

  return (
    <div className="grid gap-6">
      <p className="label">{chart.title}</p>
      {slices.length && hasArea ? (
        <div className="grid items-center gap-8 md:grid-cols-5">
          <div className="md:col-span-2">
            <Donut slices={slices} title={chart.title} />
          </div>
          <div className="md:col-span-3">
            <Area labels={labels} series={series} title={chart.title} />
          </div>
        </div>
      ) : slices.length && hasBars ? (
        <div className="grid items-center gap-8 md:grid-cols-2">
          <Donut slices={slices} title={chart.title} />
          <Bars labels={labels} values={series[0]?.values ?? []} title={chart.title} />
        </div>
      ) : slices.length ? (
        <div className="mx-auto w-full max-w-sm">
          <Donut slices={slices} title={chart.title} />
        </div>
      ) : hasArea ? (
        <Area labels={labels} series={series} title={chart.title} />
      ) : hasBars ? (
        <Bars labels={labels} values={series[0]?.values ?? []} title={chart.title} />
      ) : null}
    </div>
  );
}
