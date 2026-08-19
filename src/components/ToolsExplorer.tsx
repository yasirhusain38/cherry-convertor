"use client";

import { useMemo, useState } from "react";
import { ToolCard } from "@/components/ToolCard";
import { CATEGORIES, TOOLS, type ToolCategory } from "@/lib/tools";

export function ToolsExplorer() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ToolCategory | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TOOLS.filter((tool) => {
      if (category !== "all" && tool.category !== category) return false;
      if (!q) return true;
      return [tool.name, tool.h1, tool.lede, tool.slug, ...tool.keywords]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [category, query]);

  return (
    <>
      <div className="container-page grid gap-4 py-8 md:grid-cols-[1fr_auto]">
        <label className="grid gap-2 text-sm">
          Search tools
          <input
            className="field"
            value={query}
            placeholder="50KB, HEIC, watermark, Aadhaar…"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label className="grid gap-2 text-sm">
          Family
          <select
            className="field min-w-44"
            value={category}
            onChange={(event) => setCategory(event.target.value as ToolCategory | "all")}
          >
            <option value="all">All</option>
            {CATEGORIES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="container-page pb-4 text-sm text-[var(--ink-soft)]">
        {filtered.length} tool{filtered.length === 1 ? "" : "s"}
      </p>
      {query || category !== "all" ? (
        <section className="container-page pb-16">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((tool, index) => (
              <ToolCard key={tool.slug} tool={tool} index={index} />
            ))}
          </div>
        </section>
      ) : (
        CATEGORIES.map((item) => {
          const tools = TOOLS.filter((tool) => tool.category === item.id);
          return (
            <section key={item.id} id={item.id} className="container-page scroll-mt-24 py-14">
              <p className="label">{item.label}</p>
              <h2 className="mt-2 text-3xl tracking-tight">{item.description}</h2>
              <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tools.map((tool, index) => (
                  <ToolCard key={tool.slug} tool={tool} index={index} />
                ))}
              </div>
            </section>
          );
        })
      )}
    </>
  );
}
