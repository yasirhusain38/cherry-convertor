"use client";

import { useState, type ReactNode } from "react";
import type { CherryKit } from "@/lib/ats-kit";

function copy(text: string) {
  return navigator.clipboard.writeText(text);
}

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-ghost"
      onClick={() => {
        void copy(text).then(() => {
          setDone(true);
          window.setTimeout(() => setDone(false), 1200);
        });
      }}
    >
      {done ? "Copied" : "Copy"}
    </button>
  );
}

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div className="ats-meter">
      <div className="flex justify-between text-xs">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="ats-meter-track">
        <span className="ats-meter-fill" style={{ width: `${Math.max(4, value)}%` }} />
      </div>
    </div>
  );
}

function Chips({ items, tone }: { items: string[]; tone: "in" | "miss" | "no" | "plain" }) {
  if (!items.length) return <p className="text-sm text-[var(--ink-soft)]">—</p>;
  return (
    <p className="ats-chips">
      {items.map((item) => (
        <span key={`${tone}-${item}`} className={`ats-chip ats-chip--${tone}`}>
          {item}
        </span>
      ))}
    </p>
  );
}

function Fold({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="grid gap-2">
      <summary className="label cursor-pointer">{title}</summary>
      <div className="grid gap-3 pt-1">{children}</div>
    </details>
  );
}

function Block({ title, text }: { title: string; text: string }) {
  return (
    <section className="card grid gap-2 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="label">{title}</p>
        <CopyBtn text={text} />
      </div>
      <pre className="ats-kit-pre">{text}</pre>
    </section>
  );
}

export function CherryScoreStrip({ kit }: { kit: CherryKit }) {
  const { score } = kit;
  return (
    <section className="grid gap-3">
      <p className="label">CherryScore (internal heuristic)</p>
      <p className="text-sm">
        <strong>{kit.apply.rec}</strong>
        <span className="text-[var(--ink-soft)]"> — {kit.apply.why}</span>
      </p>
      <div className="card grid gap-3 p-4 sm:grid-cols-4 lg:grid-cols-7">
        <div>
          <p className="label">Overall</p>
          <p className="mt-1 text-2xl tracking-tight">{score.overall}</p>
          <p className="text-sm text-[var(--ink-soft)]">ATS risk {score.risk}</p>
        </div>
        <Meter label="Parse safety" value={score.parseSafety} />
        {score.jdMatchNa ? (
          <div>
            <p className="text-xs">JD match</p>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">n/a (no JD)</p>
          </div>
        ) : (
          <Meter label="JD match" value={score.jdMatch} />
        )}
        <Meter label="Experience" value={score.experience} />
        <Meter label="Content" value={score.content} />
        <Meter label="Recruiter scan" value={score.scan} />
        <Meter label="Truth" value={score.truth} />
      </div>
      <p className="text-xs text-[var(--ink-soft)]">
        {score.disclaimer} · {kit.input.grade}
        {kit.noJd ? " · No JD" : ""}
      </p>
      {score.issues.length ? (
        <ul className="grid gap-1 text-sm text-brand">
          {score.issues.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export function AtsKitPanel({ kit, onApplyBullets }: { kit: CherryKit; onApplyBullets?: () => void }) {
  const { board, intel, gap } = kit;
  const stageLabel: Record<string, string> = {
    student: "Student",
    fresher: "Fresher",
    entry: "Entry level",
    experienced: "Experienced",
    "career-changer": "Career changer",
    returning: "Returning to workforce",
    freelancer: "Freelancer / contractor",
  };
  return (
    <div className="grid gap-6">
      {kit.input.conflicts.length ? (
        <section className="grid gap-2">
          <p className="label">Conflicts</p>
          <ul className="grid gap-1 text-sm text-brand">
            {kit.input.conflicts.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Block title="Cover letter" text={kit.coverLetter} />
        <Block title="Email" text={`Subject: ${kit.applyEmail.subject}\n\n${kit.applyEmail.body}`} />
        <Block title="LinkedIn" text={`${kit.linkedin.headline}\n\n${kit.linkedin.about}`} />
        <section className="card grid gap-2 p-4 text-sm">
          <p className="label">Tracker</p>
          <p>{kit.tracker.company} · {kit.tracker.role}</p>
          <p>{kit.tracker.stage} · follow-up {kit.tracker.followUp}</p>
          <p className="text-[var(--ink-soft)]">{kit.tracker.filename}</p>
        </section>
      </div>

      <Fold title={`Stage · ${stageLabel[kit.stage] ?? kit.stage}`}>
        <p className="text-sm">{kit.stageNotes[0]}</p>
        <p className="text-sm">Official: {kit.titles.official || "—"}</p>
        <p className="text-sm">Target: {kit.titles.target || "—"}</p>
        <p className="text-sm text-[var(--ink-soft)]">{kit.titles.note}</p>
      </Fold>

      {kit.inferred.length ? (
        <Fold title="No JD">
          <ul className="grid gap-1 text-sm">
            {kit.inferred.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </Fold>
      ) : null}

      <Fold title="Why interview">
        <ul className="grid gap-1 text-sm">
          {kit.why.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </Fold>

      <Fold title="JD">
        <p className="text-sm">
          {intel.title || "—"} · {intel.seniority}
          {intel.department ? ` · ${intel.department}` : ""}
          {intel.industry ? ` · ${intel.industry}` : ""}
        </p>
        <p className="text-sm">
          {intel.title || "No title yet"} · {intel.seniority}
          {intel.department ? ` · ${intel.department}` : ""}
          {intel.industry ? ` · ${intel.industry}` : ""}
          {intel.functionName ? ` · ${intel.functionName}` : ""}
        </p>
        {intel.yearsRequired ? <p className="text-sm text-[var(--ink-soft)]">JD years: {intel.yearsRequired} — do not rewrite your dates to fit.</p> : null}
        {intel.clusters.length ? <p className="text-sm">Clusters: {intel.clusters.join(" · ")}</p> : null}
        {intel.educationRequired ? <p className="text-sm text-[var(--ink-soft)]">Education on JD: {intel.educationRequired}</p> : null}
        {intel.certsRequired.length ? <p className="text-sm text-[var(--ink-soft)]">Certs on JD: {intel.certsRequired.join(", ")}</p> : null}
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <p className="text-xs text-[var(--ink-soft)]">Acronyms</p>
            <Chips items={kit.keywordKinds.acronyms} tone="plain" />
          </div>
          <div>
            <p className="text-xs text-[var(--ink-soft)]">Synonym matches (partial)</p>
            <Chips items={kit.keywordKinds.synonyms} tone="miss" />
          </div>
          <div>
            <p className="text-xs text-[var(--ink-soft)]">Related / business</p>
            <Chips items={kit.keywordKinds.related} tone="plain" />
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <p className="text-xs text-[var(--ink-soft)]">P0 critical</p>
            <Chips items={intel.p0} tone="plain" />
          </div>
          <div>
            <p className="text-xs text-[var(--ink-soft)]">P1 important</p>
            <Chips items={intel.p1} tone="plain" />
          </div>
          <div>
            <p className="text-xs text-[var(--ink-soft)]">P2 supporting</p>
            <Chips items={intel.p2} tone="plain" />
          </div>
          <div>
            <p className="text-xs text-[var(--ink-soft)]">P3 noise</p>
            <Chips items={intel.p3} tone="no" />
          </div>
        </div>
      </Fold>

      <Fold title="Match">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-xs text-[var(--ink-soft)]">Strong matches</p>
            <Chips items={gap.strong} tone="in" />
          </div>
          <div>
            <p className="text-xs text-[var(--ink-soft)]">Partial matches</p>
            <Chips items={gap.partial} tone="miss" />
          </div>
          <div>
            <p className="text-xs text-[var(--ink-soft)]">Missing requirements</p>
            <Chips items={gap.missing} tone="miss" />
          </div>
          <div>
            <p className="text-xs text-[var(--ink-soft)]">Risky / do not add</p>
            <Chips items={gap.risky} tone="no" />
          </div>
        </div>
        <p className="text-xs text-[var(--ink-soft)]">Highest-impact improvements</p>
        <ul className="grid gap-1 text-sm">
          {gap.improvements.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </Fold>

      {kit.next.length ? (
        <Fold title="Missing fields">
          <ul className="grid gap-1 text-sm">
            {kit.next.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </Fold>
      ) : null}

      <Fold title="Keywords">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-xs text-[var(--ink-soft)]">Required</p>
            <Chips items={board.required} tone="plain" />
          </div>
          <div>
            <p className="text-xs text-[var(--ink-soft)]">Preferred</p>
            <Chips items={board.preferred} tone="plain" />
          </div>
          <div>
            <p className="text-xs text-[var(--ink-soft)]">Tools</p>
            <Chips items={board.tools} tone="plain" />
          </div>
          <div>
            <p className="text-xs text-[var(--ink-soft)]">Noise</p>
            <Chips items={board.noise} tone="no" />
          </div>
          <div>
            <p className="text-xs text-[var(--ink-soft)]">In resume</p>
            <Chips items={board.inResume} tone="in" />
          </div>
          <div>
            <p className="text-xs text-[var(--ink-soft)]">Missing</p>
            <Chips items={board.missing} tone="miss" />
          </div>
          <div>
            <p className="text-xs text-[var(--ink-soft)]">Do not add</p>
            <Chips items={board.doNotAdd} tone="no" />
          </div>
        </div>
      </Fold>

      {kit.embellishment.length ? (
        <Fold title="Unverified metrics">
          <ul className="grid gap-1 text-sm text-brand">
            {kit.embellishment.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </Fold>
      ) : null}

      {kit.changed.length ? (
        <Fold title="Tailor log">
          <ul className="grid gap-1 text-sm">
            {kit.changed.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </Fold>
      ) : null}

      {kit.timeline.length ? (
        <Fold title="Dates">
          <ul className="grid gap-1 text-sm">
            {kit.timeline.map((n) => (
              <li key={n.message}>
                <span className="text-[var(--ink-soft)]">{n.truth}</span> — {n.message}
              </li>
            ))}
          </ul>
        </Fold>
      ) : null}

      {kit.transferable.length ? (
        <Fold title="Career change">
          <ul className="grid gap-1 text-sm">
            {kit.transferable.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </Fold>
      ) : null}

      {kit.bullets.length ? (
        <Fold title="Bullet wording">
          {onApplyBullets && kit.bullets.some((b) => b.improved !== b.original) ? (
            <button type="button" className="btn btn-ghost w-fit" onClick={onApplyBullets}>
              Apply suggested wording
            </button>
          ) : null}
          <ul className="grid gap-3 text-sm">
            {kit.bullets.map((b) => (
              <li key={b.original} className="grid gap-1">
                <span>{b.original}</span>
                {b.improved !== b.original ? <span className="text-[var(--ink-soft)]">SUGGESTED: {b.improved}</span> : null}
                {b.resultMissing ? (
                  <span className="text-[var(--ink-soft)]">Add a real number if you have one: {b.metricHints.slice(0, 3).join(", ")}.</span>
                ) : null}
              </li>
            ))}
          </ul>
        </Fold>
      ) : null}

      {kit.confirm.length ? (
        <Fold title="Confirm">
          <ul className="grid gap-1 text-sm">
            {kit.confirm.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </Fold>
      ) : null}

      {kit.objections.length ? (
        <Fold title="Objections">
          <ul className="grid gap-2 text-sm">
            {kit.objections.map((o) => (
              <li key={o.concern}>
                {o.concern}
                <span className="block text-[var(--ink-soft)]">{o.reduce}</span>
              </li>
            ))}
          </ul>
        </Fold>
      ) : null}

      <Fold title="QA">
        <ul className="grid gap-1 text-sm">
          {kit.qa.map((q) => (
            <li key={q.item}>
              {q.pass ? "PASS" : "FAIL"} [{q.area}] {q.item}
              {q.fix ? ` — ${q.fix}` : ""}
            </li>
          ))}
        </ul>
      </Fold>

      <Fold title="Before you apply">
        <ol className="grid gap-1 text-sm">
          {kit.plan.map((p) => (
            <li key={p.text}>
              {p.text} — {p.impact} / {p.effort}
            </li>
          ))}
        </ol>
      </Fold>

      <Fold title="Interview">
        <ol className="grid gap-3 text-sm">
          {kit.interview.map((item, i) => (
            <li key={item.q} className="grid gap-1">
              <span>
                {i + 1}. [{item.category}] {item.q}
              </span>
              <span className="text-[var(--ink-soft)]">{item.evidence}</span>
            </li>
          ))}
        </ol>
      </Fold>

      {kit.india.length ? (
        <p className="text-sm text-[var(--ink-soft)]">{kit.india.join(" · ")}</p>
      ) : null}
    </div>
  );
}
