"use client";

import { useEffect, useMemo, useState } from "react";
import { downloadBlob } from "@/lib/download";
import {
  ATS_JOB_KINDS,
  ATS_MARKETS,
  ATS_THEME_LIST,
  MONTHS,
  applyJdToResume,
  emptyEducation,
  emptyJob,
  emptyResume,
  formatResume,
  importResumeText,
  mergeImported,
  resumePlainText,
  type AtsJobKind,
  type AtsMarket,
  type AtsResume,
  type JdTailor,
} from "@/lib/ats-resume";
import { sanitizeAiResume, type AtsAiPatch } from "@/lib/ats-ai";
import { applySuggestedBullets } from "@/lib/ats-intel";
import { buildCherryKit, kitPlainText } from "@/lib/ats-kit";
import { fileBase, resumeDocx, resumePdf, resumeTxt } from "@/lib/ats-resume-export";
import type { ToolDef } from "@/lib/tools";
import { AtsKitPanel, CherryScoreStrip } from "./AtsKitPanel";
import { ResumeSheet } from "./ResumeSheet";

const STORE = "cc-ats-resume";
const VSTORE = "cc-ats-resume-versions";

type ResumeVersion = { id: string; name: string; at: string; resume: AtsResume };
const YEARS = Array.from({ length: 40 }, (_, i) => String(new Date().getFullYear() - i));

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      {label}
      <input className="field" type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function Area({
  label,
  value,
  onChange,
  rows = 4,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  hint?: string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      {label}
      <textarea className="field min-h-0 py-3" rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
      {hint ? <span className="text-xs text-[var(--ink-soft)]">{hint}</span> : null}
    </label>
  );
}

function MonthYear({
  label,
  value,
  onChange,
  allowPresent,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  allowPresent?: boolean;
}) {
  const present = value === "Present";
  const [month, year] = present ? ["Jan", ""] : value.split(" ");
  return (
    <fieldset className="grid gap-1 text-sm">
      <legend>{label}</legend>
      <div className="flex flex-wrap gap-2">
        {allowPresent ? (
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={present}
              onChange={(e) => onChange(e.target.checked ? "Present" : "Jan 2024")}
            />
            Present
          </label>
        ) : null}
        {present ? null : (
          <>
            <select className="field min-h-10 w-24" value={month || "Jan"} onChange={(e) => onChange(`${e.target.value} ${year || YEARS[0]}`)}>
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <select className="field min-h-10 w-24" value={year || YEARS[0]} onChange={(e) => onChange(`${month || "Jan"} ${e.target.value}`)}>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </>
        )}
      </div>
    </fieldset>
  );
}

export function AtsResumeTool({ tool }: { tool: ToolDef }) {
  void tool;
  const [resume, setResume] = useState<AtsResume>(emptyResume);
  const [ready, setReady] = useState(false);
  const [added, setAdded] = useState<string[]>([]);
  const [jdNote, setJdNote] = useState<string | null>(null);
  const [paste, setPaste] = useState("");
  const [tailor, setTailor] = useState<JdTailor | null>(null);
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [aiBusy, setAiBusy] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AtsResume>;
        const template =
          parsed.template === "compact" || parsed.template === "executive" ? parsed.template : "classic";
        const market: AtsMarket = ATS_MARKETS.some((m) => m.id === parsed.market)
          ? (parsed.market as AtsMarket)
          : "international";
        const jobs = Array.isArray(parsed.jobs)
          ? parsed.jobs.map((j) => ({
              ...emptyJob(),
              ...j,
              kind: j.kind || "full-time",
              bullets: j.bullets?.length ? j.bullets : [""],
            }))
          : emptyResume().jobs;
        // Restore the in-browser draft after mount (localStorage is not available during SSR).
        // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage hydrate
        setResume({
          ...emptyResume(),
          ...parsed,
          template,
          market,
          company: parsed.company ?? "",
          coursework: parsed.coursework ?? "",
          jobs,
        });
      }
    } catch {
      /* ignore */
    }
    try {
      const vraw = localStorage.getItem(VSTORE);
      if (vraw) setVersions(JSON.parse(vraw) as ResumeVersion[]);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORE, JSON.stringify(resume));
    } catch {
      /* private mode */
    }
  }, [ready, resume]);

  const kit = useMemo(() => buildCherryKit(resume, tailor), [resume, tailor]);
  const preview = useMemo(() => resumePlainText(resume), [resume]);

  function patch(partial: Partial<AtsResume>) {
    setResume((r) => ({ ...r, ...partial }));
  }

  function commitFormat() {
    setResume((r) => {
      const next = formatResume(r);
      return JSON.stringify(next) === JSON.stringify(r) ? r : next;
    });
  }

  function applyJd(from: AtsResume) {
    if (!from.jd.trim()) {
      setJdNote("Paste a job description first, or type NONE for a master resume.");
      setAdded([]);
      return;
    }
    if (/^none$/i.test(from.jd.trim())) {
      setTailor(null);
      setAdded([]);
      setJdNote("No-JD mode: base resume only. No keyword match claimed.");
      return;
    }
    const out = applyJdToResume(from);
    const next = formatResume(out.resume);
    setResume(next);
    setTailor({ ...out, resume: next });
    setAdded(out.added);
    setJdNote(
      out.skipped.length
        ? `Promoted proven JD terms. Left out ${out.skipped.length} with no proof — not stuffed.`
        : out.added.length
          ? `Placed ${out.added.length} proven JD terms into Skills. Bullets stay yours.`
          : `JD terms already in your draft were moved to the front of Skills.`,
    );
  }

  async function improveWithAi() {
    if ((!resume.jd.trim() || /^none$/i.test(resume.jd.trim())) && !resume.targetTitle.trim()) {
      setJdNote("Paste a job description or add a target title.");
      return;
    }
    setAiBusy(true);
    setJdNote("Analyzing every section for this role…");
    try {
      const res = await fetch("/api/ats-tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string; patch?: AtsAiPatch; source?: string };
      if (!res.ok || !json.ok || !json.patch) {
        setJdNote(json.error || "Could not reach a free model. Try Tailor to this JD.");
        return;
      }
      const merged = sanitizeAiResume(resume, json.patch);
      const out = applyJdToResume(merged);
      const next = formatResume(out.resume);
      setResume(next);
      setTailor({ ...out, resume: next });
      setAdded(out.added);
      setJdNote("Updated every form field for this role. Check the letter, then download.");
    } catch {
      setJdNote("AI tailor failed. Use Tailor to this JD on this device.");
    } finally {
      setAiBusy(false);
    }
  }

  function absorbPaste() {
    if (paste.trim().length < 20) {
      setJdNote("Paste a resume or a few bullets first.");
      return;
    }
    setResume((r) => formatResume(mergeImported(r, importResumeText(paste))));
    setJdNote("Imported what we could parse. Check every job, date, and metric — nothing was invented.");
  }

  async function save(kind: "pdf" | "docx" | "txt") {
    const doc = formatResume(resume);
    setResume(doc);
    const base = fileBase(doc);
    if (kind === "txt") {
      downloadBlob(resumeTxt(doc), `${base}.txt`);
      return;
    }
    if (kind === "pdf") {
      downloadBlob(resumePdf(doc), `${base}.pdf`);
      return;
    }
    downloadBlob(await resumeDocx(doc), `${base}.docx`);
  }

  function saveVersion() {
    const snap: ResumeVersion = {
      id: kit.version.id,
      name: `${resume.targetTitle.trim() || "Draft"} · ${resume.company.trim() || "master"} · ${kit.apply.rec}`,
      at: new Date().toLocaleString(),
      resume: formatResume(resume),
    };
    const next = [snap, ...versions].slice(0, 12);
    setVersions(next);
    try {
      localStorage.setItem(VSTORE, JSON.stringify(next));
    } catch {
      /* private mode */
    }
    setJdNote(`Saved version: ${snap.name}. Restore it later for this JD without overwriting your master.`);
  }

  function restoreVersion(id: string) {
    const snap = versions.find((v) => v.id === id);
    if (!snap) return;
    setResume({ ...emptyResume(), ...snap.resume });
    setJdNote(`Restored ${snap.name}.`);
  }

  function saveKit() {
    const doc = formatResume(resume);
    downloadBlob(new Blob([kitPlainText(buildCherryKit(doc, tailor))], { type: "text/plain;charset=utf-8" }), `${fileBase(doc)}-kit.txt`);
  }

  const form = (
    <div className="grid gap-8" onBlurCapture={commitFormat}>
      <section className="grid gap-3">
        <p className="label">Contact (in the body)</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name" value={resume.fullName} onChange={(fullName) => patch({ fullName })} />
          <Field label="Target job title" value={resume.targetTitle} onChange={(targetTitle) => patch({ targetTitle })} />
          <Field label="Company (this JD)" value={resume.company} onChange={(company) => patch({ company })} placeholder="Parsed from the JD if you leave this blank" />
          <label className="grid gap-1 text-sm">
            Market
            <select
              className="field min-h-10"
              value={resume.market}
              onChange={(e) => patch({ market: e.target.value as AtsMarket })}
            >
              {ATS_MARKETS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <span className="text-xs text-[var(--ink-soft)]">{ATS_MARKETS.find((m) => m.id === resume.market)?.note}</span>
          </label>
          <Field label="City" value={resume.city} onChange={(city) => patch({ city })} />
          <Field label="Country" value={resume.country} onChange={(country) => patch({ country })} />
          <Field label="Phone" value={resume.phone} onChange={(phone) => patch({ phone })} placeholder="+91 …" />
          <Field label="Email" type="email" value={resume.email} onChange={(email) => patch({ email })} />
          <Field label="LinkedIn URL" value={resume.linkedin} onChange={(linkedin) => patch({ linkedin })} />
          <Field label="GitHub URL" value={resume.github} onChange={(github) => patch({ github })} />
        </div>
      </section>

      <section className="grid gap-3">
        <p className="label">Paste existing resume or bullets</p>
        <textarea
          className="field min-h-0 py-3"
          rows={6}
          value={paste}
          placeholder="Paste a plain resume, or leave blank and fill the form."
          onChange={(e) => setPaste(e.target.value)}
        />
        <button type="button" className="btn btn-ghost w-fit" onClick={absorbPaste}>
          Import into form
        </button>
      </section>

      <section className="grid gap-3">
        <p className="label">Job description</p>
        <label className="grid gap-1 text-sm">
          Paste the JD
          <textarea
            className="field min-h-0 py-3"
            rows={8}
            value={resume.jd}
            placeholder="Paste the job description, or type NONE."
            onChange={(e) => patch({ jd: e.target.value })}
            onPaste={(e) => {
              const text = e.clipboardData.getData("text");
              if (text.trim().length < 40) return;
              e.preventDefault();
              applyJd({ ...resume, jd: text });
            }}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary w-fit" disabled={aiBusy} onClick={() => void improveWithAi()}>
            {aiBusy ? "Improving…" : "Improve with AI"}
          </button>
          <button type="button" className="btn btn-ghost w-fit" onClick={() => applyJd(resume)}>
            Tailor on this device
          </button>
        </div>
        <span className="text-xs text-[var(--ink-soft)]">
          AI rewrites every field for this JD and saves it in the form. Jobs and dates stay yours.
        </span>
        {jdNote ? <p className="text-sm text-[var(--ink-soft)]">{jdNote}</p> : null}
        {added.length ? <p className="text-sm">Added: {added.join(" · ")}</p> : null}
      </section>

      <Area
        label="Professional Summary"
        value={resume.summary}
        onChange={(summary) => patch({ summary })}
        rows={5}
        hint="Edit anything that is not true."
      />

      <section className="grid gap-3">
        <p className="label">Skills (12–22 real items)</p>
        <Area label="Technical" value={resume.technical} onChange={(technical) => patch({ technical })} rows={2} hint="Comma-separated." />
        <Area label="Tools" value={resume.tools} onChange={(tools) => patch({ tools })} rows={2} />
        <Area label="Domain" value={resume.domain} onChange={(domain) => patch({ domain })} rows={2} />
      </section>

      <section className="grid gap-4">
        <div className="flex items-center justify-between">
          <p className="label">Work Experience</p>
          <button type="button" className="btn btn-ghost" onClick={() => patch({ jobs: [...resume.jobs, emptyJob()] })}>
            Add job
          </button>
        </div>
        {resume.jobs.map((job, i) => (
          <div key={i} className="card grid gap-3 p-4">
            <div className="flex justify-between">
              <p className="text-sm">Role {i + 1}</p>
              {resume.jobs.length > 1 ? (
                <button
                  type="button"
                  className="text-xs text-brand"
                  onClick={() => patch({ jobs: resume.jobs.filter((_, j) => j !== i) })}
                >
                  Remove
                </button>
              ) : null}
            </div>
            <Field label="Job title" value={job.title} onChange={(title) => patch({ jobs: resume.jobs.map((j, k) => (k === i ? { ...j, title } : j)) })} />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm">
                Type
                <select
                  className="field min-h-10"
                  value={job.kind || "full-time"}
                  onChange={(e) =>
                    patch({
                      jobs: resume.jobs.map((j, k) => (k === i ? { ...j, kind: e.target.value as AtsJobKind } : j)),
                    })
                  }
                >
                  {ATS_JOB_KINDS.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name}
                    </option>
                  ))}
                </select>
              </label>
              <Field label="Company" value={job.company} onChange={(company) => patch({ jobs: resume.jobs.map((j, k) => (k === i ? { ...j, company } : j)) })} />
              <Field label="City" value={job.city} onChange={(city) => patch({ jobs: resume.jobs.map((j, k) => (k === i ? { ...j, city } : j)) })} />
              <MonthYear label="Start" value={job.start} onChange={(start) => patch({ jobs: resume.jobs.map((j, k) => (k === i ? { ...j, start } : j)) })} />
              <MonthYear label="End" value={job.end} allowPresent onChange={(end) => patch({ jobs: resume.jobs.map((j, k) => (k === i ? { ...j, end } : j)) })} />
            </div>
            {job.bullets.map((b, bi) => (
              <label key={bi} className="grid gap-1 text-sm">
                Bullet {bi + 1}
                <input
                  className="field"
                  value={b}
                  placeholder="Led / Built / Improved … using [tool], resulting in …"
                  onChange={(e) =>
                    patch({
                      jobs: resume.jobs.map((j, k) =>
                        k === i ? { ...j, bullets: j.bullets.map((x, xi) => (xi === bi ? e.target.value : x)) } : j,
                      ),
                    })
                  }
                />
              </label>
            ))}
            <button
              type="button"
              className="btn btn-ghost w-fit"
              onClick={() =>
                patch({ jobs: resume.jobs.map((j, k) => (k === i ? { ...j, bullets: [...j.bullets, ""] } : j)) })
              }
            >
              Add bullet
            </button>
          </div>
        ))}
      </section>

      <section className="grid gap-4">
        <div className="flex items-center justify-between">
          <p className="label">Education</p>
          <button type="button" className="btn btn-ghost" onClick={() => patch({ education: [...resume.education, emptyEducation()] })}>
            Add education
          </button>
        </div>
        {resume.education.map((ed, i) => (
          <div key={i} className="card grid gap-3 p-4 sm:grid-cols-2">
            <Field label="Degree" value={ed.degree} onChange={(degree) => patch({ education: resume.education.map((e, k) => (k === i ? { ...e, degree } : e)) })} />
            <Field label="Field" value={ed.field} onChange={(field) => patch({ education: resume.education.map((e, k) => (k === i ? { ...e, field } : e)) })} />
            <Field label="University" value={ed.school} onChange={(school) => patch({ education: resume.education.map((e, k) => (k === i ? { ...e, school } : e)) })} />
            <Field label="City" value={ed.city} onChange={(city) => patch({ education: resume.education.map((e, k) => (k === i ? { ...e, city } : e)) })} />
            <MonthYear label="Graduation" value={ed.date} onChange={(date) => patch({ education: resume.education.map((e, k) => (k === i ? { ...e, date } : e)) })} />
          </div>
        ))}
        <Area
          label="Relevant coursework"
          value={resume.coursework ?? ""}
          onChange={(coursework) => patch({ coursework })}
          rows={2}
          hint="Optional. Courses you completed."
        />
      </section>

      <section className="grid gap-3">
        <div className="flex items-center justify-between">
          <p className="label">Certifications</p>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => patch({ certs: [...resume.certs, { name: "", issuer: "", date: "" }] })}
          >
            Add
          </button>
        </div>
        {resume.certs.map((c, i) => (
          <div key={i} className="grid gap-3 sm:grid-cols-3">
            <Field label="Name" value={c.name} onChange={(name) => patch({ certs: resume.certs.map((x, k) => (k === i ? { ...x, name } : x)) })} />
            <Field label="Issuer" value={c.issuer} onChange={(issuer) => patch({ certs: resume.certs.map((x, k) => (k === i ? { ...x, issuer } : x)) })} />
            <MonthYear label="Date" value={c.date} onChange={(date) => patch({ certs: resume.certs.map((x, k) => (k === i ? { ...x, date } : x)) })} />
          </div>
        ))}
      </section>

      <section className="grid gap-3">
        <div className="flex items-center justify-between">
          <p className="label">Projects</p>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => patch({ projects: [...resume.projects, { name: "", detail: "" }] })}
          >
            Add
          </button>
        </div>
        {resume.projects.map((p, i) => (
          <div key={i} className="grid gap-3">
            <Field label="Name" value={p.name} onChange={(name) => patch({ projects: resume.projects.map((x, k) => (k === i ? { ...x, name } : x)) })} />
            <Area label="What you built" value={p.detail} onChange={(detail) => patch({ projects: resume.projects.map((x, k) => (k === i ? { ...x, detail } : x)) })} rows={2} />
          </div>
        ))}
      </section>

    </div>
  );

  const templatePicker = (
    <div>
      <p className="label mb-2">Template</p>
      <div className="ats-tpls">
        {ATS_THEME_LIST.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`ats-tpl${resume.template === t.id ? " is-on" : ""}`}
            aria-pressed={resume.template === t.id}
            onClick={() => patch({ template: t.id })}
          >
            <span className={`ats-tpl-page ats-tpl-page--${t.id}`}>
              <span className="ats-tpl-name">{t.id === "classic" ? "YOUR NAME" : "Your Name"}</span>
              <span className="ats-tpl-rule" />
              <span className="ats-tpl-bar" />
              <span className="ats-tpl-bar ats-tpl-bar--short" />
              <span className="ats-tpl-bar" />
            </span>
            <span className="ats-tpl-copy">
              <span className="ats-tpl-label">{t.name}</span>
              <span className="ats-tpl-note">{t.note}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="grid gap-6">
      <p className="text-sm text-[var(--ink-soft)]">Letter preview matches the PDF and Word file. Keywords are added only with proof.</p>

      <CherryScoreStrip kit={kit} />

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="order-2 min-w-0 lg:order-1">{form}</div>
        <aside className="order-1 sticky top-20 z-10 grid min-w-0 gap-4 bg-[#221F1F] pb-3 lg:order-2">
          <p className="label">Live preview · PDF / Word</p>
          {templatePicker}
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary" onClick={() => void save("pdf")}>
              Download PDF
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => void save("docx")}>
              Download Word
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => void save("txt")}>
              Download TXT
            </button>
            <button type="button" className="btn btn-ghost" onClick={saveKit}>
              Download kit
            </button>
            <button type="button" className="btn btn-ghost" onClick={saveVersion}>
              Save version
            </button>
          </div>
          {versions.length ? (
            <label className="grid gap-1 text-sm">
              Restore version
              <select className="field min-h-10" defaultValue="" onChange={(e) => e.target.value && restoreVersion(e.target.value)}>
                <option value="">Choose a saved draft</option>
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} · {v.at}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <div className="max-h-[52vh] overflow-y-auto lg:max-h-[calc(100svh-22rem)]">
            <ResumeSheet resume={resume} />
            <details className="mt-3 text-sm text-[var(--ink-soft)]">
              <summary>Plain text (what an ATS parser sees)</summary>
              <pre className="mt-3 overflow-auto whitespace-pre-wrap text-xs">{preview}</pre>
            </details>
          </div>
        </aside>
      </div>

      <AtsKitPanel
        kit={kit}
        onApplyBullets={() => {
          setResume((r) => formatResume(applySuggestedBullets(r)));
          setJdNote("Applied suggested wording only. No metrics were invented.");
        }}
      />
    </div>
  );
}


