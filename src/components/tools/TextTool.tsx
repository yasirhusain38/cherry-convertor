"use client";

import { useMemo, useState } from "react";
import { downloadBlob } from "@/lib/download";
import {
  base64Codec,
  convertCase,
  formatJson,
  formatMarkup,
  markdownToHtml,
  minifyCss,
  minifyHtml,
  minifyJs,
  removeDuplicateLines,
  removeExtraSpaces,
  reverseText,
  sortLines,
  textStats,
  toSlug,
  urlCodec,
  validateJson,
  type CaseMode,
} from "@/lib/text-ops";
import type { ToolDef } from "@/lib/tools";

type Kind =
  | "count"
  | "case"
  | "dedupe"
  | "spaces"
  | "sort"
  | "reverse"
  | "slug"
  | "url"
  | "base64"
  | "json-format"
  | "json-valid"
  | "xml"
  | "html-format"
  | "html-min"
  | "css-min"
  | "js-min"
  | "markdown";

function kindOf(slug: string): Kind {
  if (slug.includes("word-counter") || slug.includes("character-counter") || slug.includes("sentence-counter")) return "count";
  if (slug.includes("case")) return "case";
  if (slug.includes("duplicate")) return "dedupe";
  if (slug.includes("space")) return "spaces";
  if (slug.includes("sorter") || slug.includes("sort")) return "sort";
  if (slug.includes("reverser") || slug.includes("reverse")) return "reverse";
  if (slug.includes("slug")) return "slug";
  if (slug.includes("url")) return "url";
  if (slug.includes("base64")) return "base64";
  if (slug.includes("json-valid")) return "json-valid";
  if (slug.includes("json")) return "json-format";
  if (slug.includes("xml")) return "xml";
  if (slug.includes("html-min")) return "html-min";
  if (slug.includes("html")) return "html-format";
  if (slug.includes("css")) return "css-min";
  if (slug.includes("js-min") || slug.includes("javascript-min")) return "js-min";
  if (slug.includes("markdown")) return "markdown";
  return "count";
}

const SAMPLES: Partial<Record<Kind, string>> = {
  count: "Cherry Converter processes files in your browser.\n\nNothing is uploaded.",
  "json-format": `{\n  "name": "Cherry Converter",\n  "private": true\n}`,
  "json-valid": `{"ok": true, "n": 1}`,
  xml: `<?xml version="1.0"?><note><to>You</to><from>Cherry</from></note>`,
  "html-format": `<!doctype html><html><body><h1>Hi</h1></body></html>`,
  markdown: `# Title\n\nA **local** markdown preview.\n\n- one\n- two`,
};

export function TextTool({ tool }: { tool: ToolDef }) {
  const kind = kindOf(tool.slug);
  const [input, setInput] = useState(SAMPLES[kind] ?? "");
  const [caseMode, setCaseMode] = useState<CaseMode>("title");
  const [decode, setDecode] = useState(false);
  const [reverseMode, setReverseMode] = useState<"chars" | "words" | "lines">("chars");
  const stats = useMemo(() => textStats(input), [input]);

  const { output, error } = useMemo(() => {
    try {
      const ok = (value: string) => ({ output: value, error: null as string | null });
      switch (kind) {
        case "count":
          return ok(input);
        case "case":
          return ok(convertCase(input, caseMode));
        case "dedupe":
          return ok(removeDuplicateLines(input, true));
        case "spaces":
          return ok(removeExtraSpaces(input));
        case "sort":
          return ok(sortLines(input));
        case "reverse":
          return ok(reverseText(input, reverseMode));
        case "slug":
          return ok(toSlug(input));
        case "url":
          return ok(urlCodec(input, decode));
        case "base64":
          return ok(base64Codec(input, decode));
        case "json-format":
          return ok(input.trim() ? formatJson(input) : "");
        case "json-valid": {
          if (!input.trim()) return ok("");
          const v = validateJson(input);
          return ok(v.ok ? "Valid JSON." : v.message);
        }
        case "xml":
          return ok(input.trim() ? formatMarkup(input, "xml") : "");
        case "html-format":
          return ok(input.trim() ? formatMarkup(input, "html") : "");
        case "html-min":
          return ok(minifyHtml(input));
        case "css-min":
          return ok(minifyCss(input));
        case "js-min":
          return ok(minifyJs(input));
        case "markdown":
          return ok(markdownToHtml(input));
        default:
          return ok(input);
      }
    } catch (err) {
      return { output: "", error: err instanceof Error ? err.message : "Could not transform that text." };
    }
  }, [caseMode, decode, input, kind, reverseMode]);

  const highlight =
    tool.slug.includes("character") ? "characters" : tool.slug.includes("sentence") ? "sentences" : "words";

  return (
    <div className="grid gap-6">
      {kind === "count" ? (
        <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {(
            [
              ["Words", stats.words, "words"],
              ["Characters", stats.characters, "characters"],
              ["Sentences", stats.sentences, "sentences"],
              ["Paragraphs", stats.paragraphs, "paragraphs"],
              ["No spaces", stats.charactersNoSpaces, "nospaces"],
              ["Lines", stats.lines, "lines"],
              ["Read time", `${stats.readingMinutes < 1 ? "< 1" : stats.readingMinutes.toFixed(1)} min`, "read"],
            ] as Array<[string, string | number, string]>
          ).map(([label, value, key]) => (
            <div
              key={label}
              className={`card p-4 ${highlight === key || (highlight === "characters" && key === "characters") || (highlight === "sentences" && key === "sentences") || (highlight === "words" && key === "words") ? "ring-1 ring-[#F2013F]" : ""}`}
            >
              <dt className="label">{label}</dt>
              <dd className="stat mt-2 text-2xl">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm">
          Input
          <textarea
            className="field min-h-[280px] font-mono text-sm"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Paste text"
          />
        </label>
        {kind !== "count" ? (
          <label className="grid gap-2 text-sm">
            Output
            {kind === "markdown" ? (
              <div
                className="card min-h-[280px] overflow-auto p-4 text-sm leading-6 [&_h1]:text-2xl [&_h2]:text-xl [&_code]:font-mono"
                dangerouslySetInnerHTML={{ __html: output }}
              />
            ) : (
              <textarea className="field min-h-[280px] font-mono text-sm" readOnly value={output} />
            )}
          </label>
        ) : null}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        {kind === "case" ? (
          <select className="field min-w-40" value={caseMode} onChange={(event) => setCaseMode(event.target.value as CaseMode)}>
            <option value="upper">UPPERCASE</option>
            <option value="lower">lowercase</option>
            <option value="title">Title Case</option>
            <option value="sentence">Sentence case</option>
            <option value="camel">camelCase</option>
            <option value="snake">snake_case</option>
            <option value="kebab">kebab-case</option>
          </select>
        ) : null}
        {kind === "reverse" ? (
          <select className="field min-w-40" value={reverseMode} onChange={(event) => setReverseMode(event.target.value as typeof reverseMode)}>
            <option value="chars">Characters</option>
            <option value="words">Words</option>
            <option value="lines">Lines</option>
          </select>
        ) : null}
        {kind === "url" || kind === "base64" ? (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={decode} onChange={(event) => setDecode(event.target.checked)} />
            Decode
          </label>
        ) : null}
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigator.clipboard.writeText(kind === "count" ? input : output)}
        >
          Copy
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() =>
            downloadBlob(
              new Blob([kind === "count" ? input : kind === "markdown" ? output : output], {
                type: kind === "markdown" ? "text/html;charset=utf-8" : "text/plain;charset=utf-8",
              }),
              kind === "markdown" ? "converted.html" : "text.txt",
            )
          }
        >
          Download
        </button>
      </div>
      {error ? <p className="text-sm text-brand">{error}</p> : null}
      {kind === "json-valid" && output === "Valid JSON." ? (
        <p className="text-sm text-[var(--ink-soft)]">Parses in this tab. Schema checking is not included.</p>
      ) : null}
    </div>
  );
}
