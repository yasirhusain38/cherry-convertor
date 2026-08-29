"use client";

import { useMemo, useState } from "react";
import { DropZone } from "@/components/DropZone";
import { decodeJwt, hmacSha256, isUuid, md5, runRegex, sha, uuidV4, uuidV7 } from "@/lib/crypto-tools";
import type { ToolDef } from "@/lib/tools";

function kindOf(slug: string): "uuid" | "hash" | "hmac" | "regex" | "jwt" {
  if (slug.includes("regex")) return "regex";
  if (slug.includes("jwt")) return "jwt";
  if (slug.includes("hmac")) return "hmac";
  if (slug.includes("uuid")) return "uuid";
  return "hash";
}

export function DevStudio({ tool }: { tool: ToolDef }) {
  const kind = kindOf(tool.slug);
  const [count, setCount] = useState(5);
  const [ver, setVer] = useState<"v4" | "v7">("v4");
  const [ids, setIds] = useState<string[]>([]);
  const [text, setText] = useState("Cherry Converter");
  const [hashes, setHashes] = useState<Record<string, string>>({});
  const [key, setKey] = useState("secret");
  const [hmac, setHmac] = useState("");
  const [pattern, setPattern] = useState("\\b[A-Z][a-z]+\\b");
  const [flags, setFlags] = useState("g");
  const [replace, setReplace] = useState("");
  const [jwt, setJwt] = useState("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0IiwibmFtZSI6IkNoZXJyeSIsImlhdCI6MTUxNjIzOTAyMn0.signature");
  const [error, setError] = useState<string | null>(null);

  const regex = useMemo(() => runRegex(pattern, flags, text, replace), [flags, pattern, replace, text]);
  const jwtOut = useMemo(() => {
    try {
      return decodeJwt(jwt);
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Invalid JWT" };
    }
  }, [jwt]);

  function mint() {
    const n = Math.min(100, Math.max(1, count));
    const next = Array.from({ length: n }, () => (ver === "v7" ? uuidV7() : uuidV4()));
    setIds(next);
  }

  async function hashText() {
    const bytes = new TextEncoder().encode(text);
    const sha256 = await sha("SHA-256", bytes);
    const sha1 = await sha("SHA-1", bytes);
    setHashes({ "SHA-256": sha256, "SHA-1": sha1, "MD5 (checksum only)": md5(bytes) });
  }

  async function hashFile(files: File[]) {
    const buf = new Uint8Array(await files[0].arrayBuffer());
    const sha256 = await sha("SHA-256", buf);
    const sha1 = await sha("SHA-1", buf);
    setHashes({
      file: files[0].name,
      "SHA-256": sha256,
      "SHA-1": sha1,
      "MD5 (checksum only)": md5(buf),
    });
  }

  return (
    <div className="grid gap-6">
      <p className="text-sm text-[var(--ink-soft)]">Runs in this tab. 0 uploads. MD5 is a checksum, not security.</p>
      {kind === "uuid" ? (
        <div className="grid gap-3">
          <div className="flex flex-wrap gap-3">
            <select className="field max-w-32" value={ver} onChange={(e) => setVer(e.target.value as "v4" | "v7")}>
              <option value="v4">UUID v4</option>
              <option value="v7">UUID v7</option>
            </select>
            <input className="field max-w-24" type="number" min={1} max={100} value={count} onChange={(e) => setCount(Number(e.target.value))} />
            <button type="button" className="btn btn-primary" onClick={mint}>
              Generate
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => navigator.clipboard.writeText(ids.join("\n"))}>
              Copy
            </button>
          </div>
          <pre className="card max-h-80 overflow-auto p-4 font-mono text-sm">{ids.join("\n")}</pre>
          {ids[0] ? <p className="text-sm text-[var(--ink-soft)]">{isUuid(ids[0]) ? "Format OK." : "Unexpected format."}</p> : null}
        </div>
      ) : null}

      {kind === "hash" ? (
        <div className="grid gap-4">
          <textarea className="field min-h-32 font-mono text-sm" value={text} onChange={(e) => setText(e.target.value)} />
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn btn-primary" onClick={() => void hashText()}>
              Hash text
            </button>
          </div>
          <DropZone onFiles={(f) => void hashFile(f)} media="any" label="Drop a file for SHA-256" hint="Hashed with SubtleCrypto on this device." />
          <dl className="grid gap-2">
            {Object.entries(hashes).map(([k, v]) => (
              <div key={k} className="card p-3">
                <dt className="label">{k}</dt>
                <dd className="break-all font-mono text-xs">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      {kind === "hmac" ? (
        <div className="grid gap-3">
          <input className="field" value={key} onChange={(e) => setKey(e.target.value)} placeholder="Key" />
          <textarea className="field min-h-24" value={text} onChange={(e) => setText(e.target.value)} />
          <button
            type="button"
            className="btn btn-primary w-fit"
            onClick={async () => setHmac(await hmacSha256(key, text))}
          >
            HMAC-SHA256
          </button>
          <p className="break-all font-mono text-sm">{hmac}</p>
        </div>
      ) : null}

      {kind === "regex" ? (
        <div className="grid gap-3">
          <label className="grid gap-2 text-sm">
            Pattern
            <input className="field font-mono" value={pattern} onChange={(e) => setPattern(e.target.value)} />
          </label>
          <label className="grid max-w-xs gap-2 text-sm">
            Flags
            <input className="field font-mono" value={flags} onChange={(e) => setFlags(e.target.value)} />
          </label>
          <textarea className="field min-h-40 font-mono text-sm" value={text} onChange={(e) => setText(e.target.value)} />
          <label className="grid gap-2 text-sm">
            Replace (optional)
            <input className="field font-mono" value={replace} onChange={(e) => setReplace(e.target.value)} />
          </label>
          {regex.error ? <p className="text-sm text-brand">{regex.error}</p> : <p className="text-sm">{regex.hits.length} match(es)</p>}
          <ul className="grid gap-1 text-sm font-mono">
            {regex.hits.slice(0, 50).map((h, i) => (
              <li key={`${h.index}-${i}`}>
                @{h.index} {JSON.stringify(h.text)} {h.groups.length ? `groups ${h.groups.join(", ")}` : ""}
              </li>
            ))}
          </ul>
          {regex.replaced !== undefined ? <pre className="card p-4 text-sm">{regex.replaced}</pre> : null}
        </div>
      ) : null}

      {kind === "jwt" ? (
        <div className="grid gap-3">
          <textarea className="field min-h-32 font-mono text-sm" value={jwt} onChange={(e) => setJwt(e.target.value)} />
          <p className="text-sm text-[var(--ink-soft)]">
            Header and payload are decoded locally. Signature is not verified — there is no key server here.
          </p>
          {"error" in jwtOut ? (
            <p className="text-sm text-brand">{jwtOut.error}</p>
          ) : (
            <pre className="card overflow-auto p-4 text-sm">{JSON.stringify(jwtOut, null, 2)}</pre>
          )}
        </div>
      ) : null}
      {error ? <p className="text-sm text-brand">{error}</p> : null}
    </div>
  );
}
