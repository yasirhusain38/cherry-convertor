import { analyzeBullet, analyzeJd, applySuggestedBullets, canClaimKeyword } from "./ats-intel";
import { applyJdToResume, inferJdCompany, inferJdTitle, splitSkills, type AtsResume } from "./ats-resume";

export type AtsAiPatch = {
  targetTitle?: string;
  company?: string;
  summary?: string;
  technical?: string;
  tools?: string;
  domain?: string;
  jobs?: Array<{ bullets?: string[] }>;
  projects?: Array<{ detail?: string }>;
};

function nums(text: string): Set<string> {
  return new Set((text.match(/\d+(?:\.\d+)?%?/g) ?? []).map((n) => n.toLowerCase()));
}

function keepFacts(original: string, next: string): string {
  const t = (next || "").replace(/\s+/g, " ").trim();
  if (!t) return original;
  const allowed = nums(original);
  if ([...nums(t)].some((n) => !allowed.has(n))) return original;
  if (t.length > Math.max(280, original.length * 3)) return original;
  return t;
}

function keepSkillLine(resume: AtsResume, next: string, existing: string): string {
  const parts = splitSkills(next || "");
  const orig = splitSkills(existing);
  const kept = parts.filter(
    (p) => canClaimKeyword(resume, p) || orig.some((e) => e.toLowerCase() === p.toLowerCase()),
  );
  const merged = [...kept];
  for (const o of orig) {
    if (!merged.some((m) => m.toLowerCase() === o.toLowerCase())) merged.push(o);
  }
  return merged.slice(0, 22).join(", ");
}

export function sanitizeAiResume(resume: AtsResume, patch: AtsAiPatch): AtsResume {
  const jobs = resume.jobs.map((job, i) => {
    const incoming = patch.jobs?.[i]?.bullets;
    if (!incoming) return job;
    return {
      ...job,
      bullets: job.bullets.map((b, bi) => keepFacts(b, incoming[bi] ?? b)),
    };
  });
  const projects = resume.projects.map((p, i) => ({
    ...p,
    detail: keepFacts(p.detail, patch.projects?.[i]?.detail ?? p.detail),
  }));
  const next: AtsResume = {
    ...resume,
    targetTitle: resume.targetTitle.trim() || (patch.targetTitle || "").trim() || resume.targetTitle,
    company: resume.company.trim() || (patch.company || "").trim() || resume.company,
    summary: keepFacts(resume.summary, patch.summary ?? resume.summary) || resume.summary,
    technical: keepSkillLine(resume, patch.technical ?? "", resume.technical),
    tools: keepSkillLine(resume, patch.tools ?? "", resume.tools),
    domain: keepSkillLine(resume, patch.domain ?? "", resume.domain),
    jobs,
    projects,
  };
  return next;
}

function injectTerm(text: string, term: string): string {
  if (!text.trim()) return text;
  if (text.toLowerCase().includes(term.toLowerCase())) return text;
  const clean = text.replace(/\.$/, "");
  return `${clean} using ${term}.`;
}

export function localJdRewrite(resume: AtsResume): AtsResume {
  const intel = analyzeJd(resume);
  let next = {
    ...resume,
    targetTitle: resume.targetTitle.trim() || intel.title || inferJdTitle(resume.jd),
    company: resume.company.trim() || intel.company || inferJdCompany(resume.jd),
  };
  const claimable = [...intel.p0, ...intel.p1].filter((t) => canClaimKeyword(next, t) || canClaimKeyword(resume, t));
  const tech = splitSkills(next.technical);
  const tools = splitSkills(next.tools);
  const domain = splitSkills(next.domain);
  for (const t of claimable) {
    const all = [...tech, ...tools, ...domain].map((s) => s.toLowerCase());
    if (all.includes(t.toLowerCase())) continue;
    if (tools.length < 8) tools.unshift(t);
    else if (tech.length < 10) tech.unshift(t);
    else domain.unshift(t);
  }
  next = {
    ...next,
    technical: tech.slice(0, 10).join(", "),
    tools: tools.slice(0, 8).join(", "),
    domain: domain.slice(0, 6).join(", "),
  };
  const title = next.targetTitle.trim();
  const skillBit = claimable.slice(0, 5).join(", ");
  if (!next.summary.trim() && (title || skillBit)) {
    next.summary = title && skillBit ? `${title} with hands-on work in ${skillBit}.` : `${title || skillBit}.`;
  } else if (next.summary.trim() && skillBit) {
    const missing = claimable.filter((k) => !next.summary.toLowerCase().includes(k.toLowerCase())).slice(0, 3);
    if (missing.length && !next.summary.toLowerCase().includes("core skills")) {
      next.summary = `${next.summary.replace(/\.$/, "")}. Core skills include ${missing.join(", ")}.`;
    }
  }
  let termIdx = 0;
  next = {
    ...next,
    jobs: next.jobs.map((j) => ({
      ...j,
      bullets: j.bullets.map((b) => {
        if (!b.trim()) return b;
        const improved = analyzeBullet(b).improved || b;
        const term = claimable[termIdx % Math.max(claimable.length, 1)];
        termIdx += 1;
        return term ? injectTerm(improved, term) : improved;
      }),
    })),
    projects: next.projects.map((p) => {
      if (!p.name.trim()) return p;
      const term = claimable[0];
      const detail = p.detail.trim() ? analyzeBullet(p.detail).improved : `Built ${p.name}${term ? ` using ${term}` : ""}.`;
      return { ...p, detail: term ? injectTerm(detail, term) : detail };
    }),
  };
  next = applySuggestedBullets(applyJdToResume(next).resume);
  return next;
}

export function atsAiPayload(resume: AtsResume) {
  return {
    targetTitle: resume.targetTitle,
    summary: resume.summary,
    technical: resume.technical,
    tools: resume.tools,
    domain: resume.domain,
    jobs: resume.jobs.map((j) => ({
      title: j.title,
      company: j.company,
      bullets: j.bullets,
    })),
    projects: resume.projects.map((p) => ({ name: p.name, detail: p.detail })),
    jd: resume.jd.slice(0, 12000),
  };
}
