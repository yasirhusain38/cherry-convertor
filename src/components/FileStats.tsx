import { formatBytes, formatPercent, reductionRatio } from "@/lib/format";

type FileStatsProps = {
  originalBytes: number;
  outputBytes?: number;
  width?: number;
  height?: number;
  extra?: Array<{ label: string; value: string }>;
};

export function FileStats({
  originalBytes,
  outputBytes,
  width,
  height,
  extra = [],
}: FileStatsProps) {
  const ratio = outputBytes != null ? reductionRatio(originalBytes, outputBytes) : null;
  const saved = ratio != null && ratio < 0;

  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[16px] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-4">
      <Stat label="Original" value={formatBytes(originalBytes)} />
      <Stat label="Output" value={outputBytes != null ? formatBytes(outputBytes) : "—"} />
      <Stat
        label="Change"
        value={ratio == null ? "—" : formatPercent(ratio)}
        tone={saved ? "good" : undefined}
      />
      <Stat
        label="Pixels"
        value={width && height ? `${width} × ${height}` : "—"}
      />
      {extra.map((item) => (
        <Stat key={item.label} label={item.label} value={item.value} />
      ))}
    </dl>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good";
}) {
  return (
    <div className="bg-[var(--bg-elevated)] px-4 py-4">
      <dt className="label">{label}</dt>
      <dd
        className={`stat mt-2 text-xl tracking-tight ${
          tone === "good" ? "text-brand" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
