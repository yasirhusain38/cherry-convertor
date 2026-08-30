import Link from "next/link";
import type { ToolDef } from "@/lib/tools";

export function ToolCard({
  tool,
  index,
}: {
  tool: ToolDef;
  index?: number;
}) {
  return (
    <Link href={`/tools/${tool.slug}`} className="card card-hover flex h-full flex-col p-6 no-underline">
      <div className="flex items-center justify-between">
        <p className="label">
          {index != null ? `${String(index + 1).padStart(2, "0")}  /  ` : ""}
          {tool.category}
        </p>
        <span className="text-brand">→</span>
      </div>
      <h3 className="display mt-8 text-3xl">{tool.name}</h3>
      <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">{tool.lede}</p>
    </Link>
  );
}
