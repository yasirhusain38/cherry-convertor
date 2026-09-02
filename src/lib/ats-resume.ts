export const ATS_HEADINGS = [
  "Professional Summary",
  "Work Experience",
  "Education",
  "Skills",
  "Certifications",
  "Projects",
] as const;

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

export type AtsJobKind = "full-time" | "contract" | "internship" | "freelance" | "part-time" | "volunteer";

export const ATS_JOB_KINDS: Array<{ id: AtsJobKind; name: string }> = [
  { id: "full-time", name: "Full-time" },
  { id: "contract", name: "Contract" },
  { id: "internship", name: "Internship" },
  { id: "freelance", name: "Freelance" },
  { id: "part-time", name: "Part-time" },
  { id: "volunteer", name: "Volunteer" },
];

export type AtsJob = {
  title: string;
  company: string;
  city: string;
  start: string;
  end: string;
  bullets: string[];
  kind: AtsJobKind;
};

export type AtsEducation = {
  degree: string;
  field: string;
  school: string;
  city: string;
  date: string;
};

export type AtsCert = { name: string; issuer: string; date: string };
export type AtsProject = { name: string; detail: string };

export type AtsTemplate = "classic" | "compact" | "executive";

export type AtsTheme = {
  id: AtsTemplate;
  name: string;
  note: string;
  cssFont: string;
  wordFont: string;
  pdfFont: "times" | "helvetica";
  align: "center" | "left";
  namePt: number;
  rolePt: number;
  bodyPt: number;
  headingPt: number;
  marginIn: number;
  linePt: number;
  headingGapPt: number;
};

export const ATS_THEMES: Record<AtsTemplate, AtsTheme> = {
  classic: {
    id: "classic",
    name: "Classic",
    note: "Times New Roman · centered · most parsers",
    cssFont: '"Times New Roman", Times, serif',
    wordFont: "Times New Roman",
    pdfFont: "times",
    align: "center",
    namePt: 22,
    rolePt: 12,
    bodyPt: 11,
    headingPt: 11.5,
    marginIn: 0.75,
    linePt: 14.5,
    headingGapPt: 12,
  },
  compact: {
    id: "compact",
    name: "Compact",
    note: "Calibri · tight · one page",
    cssFont: "Calibri, 'Segoe UI', Arial, sans-serif",
    wordFont: "Calibri",
    pdfFont: "helvetica",
    align: "left",
    namePt: 18,
    rolePt: 11,
    bodyPt: 10,
    headingPt: 10.5,
    marginIn: 0.6,
    linePt: 13,
    headingGapPt: 8,
  },
  executive: {
    id: "executive",
    name: "Executive",
    note: "Georgia · larger name · more space",
    cssFont: "Georgia, 'Times New Roman', serif",
    wordFont: "Georgia",
    pdfFont: "times",
    align: "left",
    namePt: 26,
    rolePt: 12.5,
    bodyPt: 11,
    headingPt: 11.5,
    marginIn: 0.85,
    linePt: 15.5,
    headingGapPt: 14,
  },
};

export const ATS_THEME_LIST: AtsTheme[] = [ATS_THEMES.classic, ATS_THEMES.compact, ATS_THEMES.executive];

export const ATS_TEMPLATES: Array<{ id: AtsTemplate; name: string; note: string }> = ATS_THEME_LIST.map((t) => ({
  id: t.id,
  name: t.name,
  note: t.note,
}));

export function themeOf(resume: { template: AtsTemplate }): AtsTheme {
  return ATS_THEMES[resume.template] ?? ATS_THEMES.classic;
}

export type ResumeLine =
  | { kind: "name"; text: string; ghost?: boolean }
  | { kind: "role"; text: string; ghost?: boolean }
  | { kind: "contact"; text: string; ghost?: boolean }
  | { kind: "heading"; text: string }
  | { kind: "body"; text: string; ghost?: boolean }
  | { kind: "split"; left: string; right: string; ghost?: boolean }
  | { kind: "meta"; text: string; ghost?: boolean }
  | { kind: "bullet"; text: string; ghost?: boolean };

const GHOST = {
  name: "YOUR NAME",
  role: "Target Job Title",
  contact: "City, Country  |  phone  |  email  |  LinkedIn",
  summary: "Two to four sentences with the target title and skills you can prove.",
  skills: "Add 12–22 real skills. Job-description keywords go first.",
  jobTitle: "Job Title",
  jobDates: "Jan 2022 – Present",
  jobMeta: "Company, City",
  jobBullet: "Led / Built / Improved … using [tool], resulting in …",
  edu: "Degree, Field of study",
  eduMeta: "University  |  City  |  Date",
};

export function resumeLines(resume: AtsResume, mode: "preview" | "file"): ResumeLine[] {
  const r = formatResume(resume);
  const preview = mode === "preview";
  const lines: ResumeLine[] = [];

  const name = r.fullName.trim();
  lines.push({ kind: "name", text: name || (preview ? GHOST.name : "Your Name"), ghost: !name && preview });

  const role = r.targetTitle.trim();
  if (role || preview) {
    lines.push({ kind: "role", text: role || GHOST.role, ghost: !role && preview });
  }

  const contact = contactLine(r);
  if (contact || preview) {
    lines.push({ kind: "contact", text: contact || GHOST.contact, ghost: !contact && preview });
  }

  lines.push({ kind: "heading", text: "Professional Summary" });
  const summary = r.summary.trim();
  lines.push({
    kind: "body",
    text: summary || (preview ? GHOST.summary : "Add a summary with the target title and skills you can prove."),
    ghost: !summary && preview,
  });

  lines.push({ kind: "heading", text: "Skills" });
  const tech = splitSkills(r.technical);
  const tools = splitSkills(r.tools);
  const domain = splitSkills(r.domain);
  if (tech.length) lines.push({ kind: "body", text: `Technical: ${tech.join(", ")}` });
  if (tools.length) lines.push({ kind: "body", text: `Tools: ${tools.join(", ")}` });
  if (domain.length) lines.push({ kind: "body", text: `Domain: ${domain.join(", ")}` });
  if (!tech.length && !tools.length && !domain.length) {
    lines.push({
      kind: "body",
      text: preview ? GHOST.skills : "Add 12–22 real skills.",
      ghost: preview,
    });
  }

  lines.push({ kind: "heading", text: "Work Experience" });
  const jobs = r.jobs.filter((j) => j.title.trim() || j.company.trim());
  if (!jobs.length) {
    if (preview) {
      lines.push({ kind: "split", left: GHOST.jobTitle, right: GHOST.jobDates, ghost: true });
      lines.push({ kind: "meta", text: GHOST.jobMeta, ghost: true });
      lines.push({ kind: "bullet", text: GHOST.jobBullet, ghost: true });
    } else {
      lines.push({ kind: "body", text: "Add at least one job with title and company." });
    }
  } else {
    for (const job of jobs) {
      lines.push({
        kind: "split",
        left: job.title.trim() || "Job Title",
        right: formatRange(job.start, job.end),
      });
      const meta = [job.company, job.city].filter(Boolean).join(", ");
      if (meta) lines.push({ kind: "meta", text: meta });
      for (const b of job.bullets.map((x) => x.trim()).filter(Boolean)) {
        lines.push({ kind: "bullet", text: b });
      }
    }
  }

  lines.push({ kind: "heading", text: "Education" });
  const eds = r.education.filter((e) => e.degree.trim() || e.school.trim());
  if (!eds.length) {
    if (preview) {
      lines.push({ kind: "split", left: GHOST.edu, right: "", ghost: true });
      lines.push({ kind: "meta", text: GHOST.eduMeta, ghost: true });
    } else {
      lines.push({ kind: "body", text: "Add education: degree, field, university, date." });
    }
  } else {
    for (const ed of eds) {
      lines.push({
        kind: "split",
        left: [ed.degree, ed.field].filter(Boolean).join(", ") || "Degree",
        right: ed.date.trim(),
      });
      const meta = [ed.school, ed.city].filter(Boolean).join(", ");
      if (meta) lines.push({ kind: "meta", text: meta });
    }
    if (r.coursework.trim()) lines.push({ kind: "body", text: `Coursework: ${r.coursework.trim()}` });
  }

  const certs = r.certs.filter((c) => c.name.trim());
  if (certs.length) {
    lines.push({ kind: "heading", text: "Certifications" });
    for (const c of certs) {
      lines.push({
        kind: "body",
        text: [c.name, c.issuer ? `(${c.issuer})` : "", c.date].filter(Boolean).join("  ·  "),
      });
    }
  }

  const projects = r.projects.filter((p) => p.name.trim());
  if (projects.length) {
    lines.push({ kind: "heading", text: "Projects" });
    for (const p of projects) {
      lines.push({ kind: "split", left: p.name.trim(), right: "" });
      if (p.detail.trim()) lines.push({ kind: "bullet", text: p.detail.trim() });
    }
  }

  return lines;
}

export type AtsMarket = "international" | "us" | "naukri" | "campus" | "government";

export const ATS_MARKETS: Array<{ id: AtsMarket; name: string; note: string }> = [
  { id: "international", name: "ATS international", note: "Parser-safe, no extra personal fields" },
  { id: "us", name: "US resume", note: "City, ST · no photo, DOB, or marital status" },
  { id: "naukri", name: "India / Naukri", note: "+91, City State IN, searchable keywords, plain file" },
  { id: "campus", name: "Campus / fresher", note: "One page, projects and internships first" },
  { id: "government", name: "Government bio-data", note: "Photo/DOB only on the portal form, not this ATS file" },
];

export type AtsResume = {
  fullName: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  linkedin: string;
  github: string;
  targetTitle: string;
  company: string;
  summary: string;
  technical: string;
  tools: string;
  domain: string;
  jobs: AtsJob[];
  education: AtsEducation[];
  certs: AtsCert[];
  projects: AtsProject[];
  jd: string;
  template: AtsTemplate;
  market: AtsMarket;
  coursework: string;
};

export function emptyJob(): AtsJob {
  return { title: "", company: "", city: "", start: "", end: "Present", bullets: [""], kind: "full-time" };
}

export function emptyEducation(): AtsEducation {
  return { degree: "", field: "", school: "", city: "", date: "" };
}

export function emptyResume(): AtsResume {
  return {
    fullName: "",
    city: "",
    country: "",
    phone: "",
    email: "",
    linkedin: "",
    github: "",
    targetTitle: "",
    company: "",
    summary: "",
    technical: "",
    tools: "",
    domain: "",
    jobs: [emptyJob()],
    education: [emptyEducation()],
    certs: [],
    projects: [],
    jd: "",
    template: "classic",
    market: "international",
    coursework: "",
  };
}

const SMALL_WORDS = new Set(["and", "or", "of", "the", "for", "in", "at", "to"]);

function titleCaseWord(w: string, i: number): string {
  if (!w) return w;
  if (w.includes(".")) {
    return w
      .split(".")
      .map((p) => (p ? p.charAt(0).toUpperCase() + p.slice(1) : p))
      .join(".");
  }
  if (w.length <= 4 && w === w.toUpperCase() && /[A-Z]/.test(w)) return w;
  if (/[a-z]/.test(w) && /[A-Z]/.test(w.slice(1))) return w;
  if (i > 0 && SMALL_WORDS.has(w.toLowerCase())) return w.toLowerCase();
  return w.charAt(0).toUpperCase() + w.slice(1);
}

function titleCase(value: string): string {
  return value.trim().split(/\s+/).map(titleCaseWord).join(" ");
}

function tidyProse(value: string): string {
  let t = value.replace(/\s+/g, " ").trim();
  if (!t) return "";
  t = t.replace(/(^|[.!?]\s+)([a-z])/g, (_, lead: string, ch: string) => lead + ch.toUpperCase());
  if (!/[.!?]$/.test(t)) t += ".";
  return t;
}

function tidyBullet(value: string): string {
  let t = value.replace(/^[\s•\-*–—]+/, "").trim();
  if (!t) return "";
  t = t.charAt(0).toUpperCase() + t.slice(1);
  if (!/[.!?]$/.test(t)) t += ".";
  return t;
}

function tidyList(value: string): string {
  return splitSkills(value).join(", ");
}

function formatPhone(resume: AtsResume): string {
  const raw = resume.phone.replace(/\s+/g, " ").trim();
  if ((resume.market === "naukri" || /india/i.test(resume.country)) && /^\d{10}$/.test(raw.replace(/\s/g, ""))) {
    return `+91 ${raw.replace(/\s/g, "").slice(0, 5)} ${raw.replace(/\s/g, "").slice(5)}`;
  }
  return raw;
}

export function formatResume(resume: AtsResume): AtsResume {
  return {
    ...resume,
    fullName: titleCase(resume.fullName),
    city: titleCase(resume.city),
    country: titleCase(resume.country),
    email: resume.email.trim().toLowerCase(),
    phone: formatPhone(resume),
    linkedin: resume.linkedin.trim(),
    github: resume.github.trim(),
    targetTitle: titleCase(resume.targetTitle),
    company: titleCase(resume.company),
    summary: tidyProse(resume.summary),
    coursework: (resume.coursework ?? "").replace(/\s+/g, " ").trim(),
    technical: tidyList(resume.technical),
    tools: tidyList(resume.tools),
    domain: tidyList(resume.domain),
    jobs: resume.jobs.map((j) => ({
      ...j,
      kind: j.kind || "full-time",
      title: titleCase(j.title),
      company: titleCase(j.company),
      city: titleCase(j.city),
      bullets: j.bullets.map(tidyBullet),
    })),
    education: resume.education.map((e) => ({
      ...e,
      degree: titleCase(e.degree),
      field: titleCase(e.field),
      school: titleCase(e.school),
      city: titleCase(e.city),
    })),
    certs: resume.certs.map((c) => ({
      ...c,
      name: titleCase(c.name),
      issuer: titleCase(c.issuer),
    })),
    projects: resume.projects.map((p) => ({
      name: titleCase(p.name),
      detail: tidyBullet(p.detail),
    })),
  };
}

export function formatRange(start: string, end: string): string {
  const a = start.trim();
  const b = end.trim() || "Present";
  if (!a) return b === "Present" ? "" : b;
  return `${a} – ${b}`;
}

export function splitSkills(value: string): string[] {
  return value
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const STOP = new Set(
  "a an the and or of to for in on with from by as at is are was were be been being this that those these you your we they it its our their will would should can could may might into over under about after before than then not no yes if but so such also more most other into using use used across within per via".split(
    " ",
  ),
);

const TOOL_WORDS = new Set(
  "excel jira confluence figma git github gitlab bitbucket jira aws azure gcp docker kubernetes jenkins terraform ansible linux unix salesforce hubspot shopify wordpress tableau powerbi looker slack notion asana trello photoshop illustrator canva sketch postman swagger vscode intellij maven gradle npm yarn webpack vite nextjs reactjs nodejs mongodb postgresql mysql redis kafka spark hadoop snowflake bigquery redshift s3 lambda ec2".split(
    " ",
  ),
);

const TECH_WORDS = new Set(
  "javascript typescript python java kotlin swift golang rust php ruby scala sql html css react angular vue node next.js nextjs express django flask spring .net csharp c++ c# rest graphql api microservices machine-learning ml nlp llm pytorch tensorflow keras pandas numpy spark hadoop ci/cd devops sre android ios flutter dart kotlin-multiplatform".split(
    " ",
  ),
);

const DOMAIN_WORDS = new Set(
  "agile scrum kanban waterfall seo sem crm erp b2b b2c saas fintech healthcare ecommerce marketing sales finance accounting logistics supply-chain product-management stakeholder stakeholder-management".split(
    " ",
  ),
);

const JUNK = /^(job|role|title|responsibilit|requirement|qualification|about|company|we|our|you|your|will|must|should|able|experience|years|year|plus|preferred|required|including|etc|team|work|working|strong|good|excellent|skills?|ability|knowledge|understanding|environment|position|candidate|applicant)$/i;

function uniqKeep(items: string[], cap: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const t = item.replace(/\s+/g, " ").trim();
    if (!t || t.length < 2 || t.length > 42) continue;
    const key = t.toLowerCase();
    if (seen.has(key) || STOP.has(key) || JUNK.test(t)) continue;
    seen.add(key);
    out.push(t);
    if (out.length >= cap) break;
  }
  return out;
}

function classifyKeyword(word: string): "technical" | "tools" | "domain" {
  const k = word.toLowerCase().replace(/\s+/g, "");
  if (TOOL_WORDS.has(k) || TOOL_WORDS.has(word.toLowerCase())) return "tools";
  if (TECH_WORDS.has(k) || /js$|\.net|sql|python|java|html|css|api|cloud|react|node|typescript/i.test(word)) return "technical";
  if (DOMAIN_WORDS.has(k) || DOMAIN_WORDS.has(word.toLowerCase())) return "domain";
  if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2}$/.test(word)) return "domain";
  return "technical";
}

export function inferJdCompany(jd: string): string {
  const labeled = jd.match(/(?:company|organisation|organization|employer)\s*[:\-–]\s*([A-Z][A-Za-z0-9&.\- ]{2,60})/i);
  if (labeled) return labeled[1]!.split(/\n/)[0]!.replace(/\s+/g, " ").trim().slice(0, 60);
  const about = jd.match(/\babout\s+([A-Z][A-Za-z0-9&.\-']{2,40}(?:\s+[A-Z][A-Za-z0-9&.\-']+){0,3})/);
  if (about && !/^(us|the|this|our)\b/i.test(about[1]!)) return about[1]!.trim();
  const join = jd.match(/\b(?:join|at)\s+([A-Z][A-Za-z0-9&.\-']{2,40}(?:\s+[A-Z][A-Za-z0-9&.\-']+){0,2})\b/);
  if (join && !/^(The|This|Our|Job|Role|Team)\b/.test(join[1]!)) return join[1]!.trim();
  return "";
}

export function proofText(resume: AtsResume): string {
  return [
    resume.summary,
    resume.technical,
    resume.tools,
    resume.domain,
    ...resume.jobs.flatMap((j) => [j.title, j.company, ...j.bullets]),
    ...resume.projects.flatMap((p) => [p.name, p.detail]),
    ...resume.certs.map((c) => `${c.name} ${c.issuer}`),
    ...resume.education.map((e) => `${e.degree} ${e.field}`),
  ]
    .join(" ")
    .toLowerCase();
}

export function hasProof(resume: AtsResume, keyword: string): boolean {
  const k = keyword.trim().toLowerCase();
  if (!k) return false;
  return proofText(resume).includes(k);
}

export function inferJdTitle(jd: string): string {
  const lines = jd.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const labeled = jd.match(/(?:job title|position|role|title)\s*[:\-–]\s*(.+)/i);
  if (labeled) return labeled[1]!.split(/\n/)[0]!.replace(/\s+/g, " ").trim().slice(0, 80);
  const hiring = jd.match(/hiring (?:an? |our )?([A-Z][A-Za-z0-9+&/.\- ]{3,48}?)(?:\n|,|\.| to )/);
  if (hiring) return hiring[1]!.trim();
  if (lines[0] && lines[0].length <= 60 && /[A-Za-z]/.test(lines[0]) && !/we are|about us|company/i.test(lines[0])) {
    return lines[0];
  }
  return "";
}

export function jdKeywords(jd: string): string[] {
  return parseJobDescription(jd).all;
}

export function parseJobDescription(jd: string): {
  title: string;
  technical: string[];
  tools: string[];
  domain: string[];
  all: string[];
} {
  const raw = jd.replace(/[“”]/g, '"');
  const title = inferJdTitle(raw);
  const phrases = [...raw.matchAll(/\b[A-Za-z][A-Za-z0-9.+#/-]*(?:\s+[A-Za-z][A-Za-z0-9.+#/-]*){0,2}\b/g)].map((m) => m[0].trim());
  const listed = raw
    .split(/\n/)
    .flatMap((line) => {
      if (!/^[•\-*–]|skills|require|qualif|must|stack|tools/i.test(line) && !line.includes(",")) return [];
      return line.split(/[,;/|•]|\band\b/i);
    })
    .map((s) => s.replace(/^[\s•\-*–]+/, "").trim());
  const tokens = raw.split(/[^A-Za-z0-9.+#/-]+/).map((t) => t.trim());
  const pool = uniqKeep([...listed, ...phrases, ...tokens], 60);
  const technical: string[] = [];
  const tools: string[] = [];
  const domain: string[] = [];
  for (const item of pool) {
    const kind = classifyKeyword(item);
    if (kind === "tools") tools.push(item);
    else if (kind === "domain") domain.push(item);
    else technical.push(item);
  }
  const all = uniqKeep([...technical, ...tools, ...domain], 48);
  return {
    title,
    technical: uniqKeep(technical, 16),
    tools: uniqKeep(tools, 12),
    domain: uniqKeep(domain, 10),
    all,
  };
}

function mergeSkills(jdFirst: string[], existing: string[], cap: number): string[] {
  return uniqKeep([...jdFirst, ...existing], cap);
}

export type JdTailor = {
  resume: AtsResume;
  added: string[];
  promoted: string[];
  skipped: string[];
  title: string;
  company: string;
};

export function applyJdToResume(resume: AtsResume): JdTailor {
  const jd = resume.jd.trim();
  if (!jd || /^none$/i.test(jd)) {
    return {
      title: resume.targetTitle.trim(),
      company: resume.company.trim(),
      added: [],
      promoted: [],
      skipped: [],
      resume,
    };
  }
  const parsed = parseJobDescription(resume.jd);
  const title = resume.targetTitle.trim() || parsed.title;
  const company = resume.company.trim() || inferJdCompany(resume.jd);
  const proven = (items: string[]) => items.filter((k) => hasProof(resume, k));
  const technical = mergeSkills(proven(parsed.technical), splitSkills(resume.technical), 10);
  const tools = mergeSkills(proven(parsed.tools), splitSkills(resume.tools), 8);
  const domain = mergeSkills(proven(parsed.domain), splitSkills(resume.domain), 6);
  let total = [...technical, ...tools, ...domain];
  if (total.length > 22) total = total.slice(0, 22);
  const techKeep = technical.filter((s) => total.includes(s));
  const toolKeep = tools.filter((s) => total.includes(s));
  const domainKeep = domain.filter((s) => total.includes(s));

  const before = new Set(
    [...splitSkills(resume.technical), ...splitSkills(resume.tools), ...splitSkills(resume.domain)].map((s) => s.toLowerCase()),
  );
  const added = total.filter((s) => !before.has(s.toLowerCase()));
  const promoted = total.filter((s) => before.has(s.toLowerCase()));
  const skipped = parsed.all.filter((k) => !hasProof(resume, k));

  const top = uniqKeep(proven([...parsed.technical, ...parsed.tools, ...parsed.domain]), 5);
  const summary = weaveSummary(resume.summary, title, top);

  return {
    title,
    company,
    added,
    promoted,
    skipped,
    resume: {
      ...resume,
      targetTitle: title,
      company,
      technical: techKeep.join(", "),
      tools: toolKeep.join(", "),
      domain: domainKeep.join(", "),
      summary,
    },
  };
}

function weaveSummary(current: string, title: string, keywords: string[]): string {
  const text = current.trim();
  const skillBit = keywords.length ? keywords.join(", ") : "";
  if (!text) {
    if (title && skillBit) return `${title} with hands-on work in ${skillBit}.`;
    if (title) return `${title}.`;
    return "";
  }
  let next = text;
  if (title && !next.toLowerCase().includes(title.toLowerCase())) {
    next = `${title}. ${next}`;
  }
  const missing = keywords.filter((k) => !next.toLowerCase().includes(k.toLowerCase()));
  if (missing.length) {
    next = `${next.replace(/\s+$/, "")} Core skills include ${missing.join(", ")}.`;
  }
  return next.replace(/\s+/g, " ").trim();
}

function haystack(resume: AtsResume): string {
  return [
    resume.targetTitle,
    resume.summary,
    resume.technical,
    resume.tools,
    resume.domain,
    ...resume.jobs.flatMap((j) => [j.title, j.company, ...j.bullets]),
    ...resume.projects.flatMap((p) => [p.name, p.detail]),
    ...resume.certs.map((c) => `${c.name} ${c.issuer}`),
    ...resume.education.map((e) => `${e.degree} ${e.field}`),
  ]
    .join(" ")
    .toLowerCase();
}

export type AtsCheck = {
  band: "needs more evidence" | "85–90" | "90–95";
  score: number;
  stuffing: "Low" | "Medium" | "High";
  layout: "PASS" | "FAIL";
  included: string[];
  omitted: string[];
  issues: string[];
  raise: string[];
};

export function assessResume(resume: AtsResume): AtsCheck {
  const issues: string[] = [];
  const raise: string[] = [];
  let score = 40;

  if (resume.fullName.trim()) score += 6;
  else issues.push("Add your full name.");
  if (resume.email.trim() && resume.email.includes("@")) score += 4;
  else issues.push("Add an email in the body (not a header).");
  if (resume.phone.trim()) score += 3;
  else raise.push("Add a phone number.");
  if (resume.city.trim()) score += 2;
  else raise.push("Add city and country.");

  if (resume.targetTitle.trim()) score += 6;
  else issues.push("Add a target job title.");
  if (resume.summary.trim().length >= 40) score += 6;
  else issues.push("Write a professional summary of 2–4 sentences.");
  if (resume.targetTitle && resume.summary.toLowerCase().includes(resume.targetTitle.toLowerCase())) score += 4;
  else if (resume.targetTitle) raise.push("Put the target job title in the summary.");

  const skills = [...splitSkills(resume.technical), ...splitSkills(resume.tools), ...splitSkills(resume.domain)];
  if (skills.length >= 12 && skills.length <= 22) score += 8;
  else if (skills.length > 0) {
    score += 4;
    raise.push("Aim for 12–22 real skills. JD keywords first.");
  } else issues.push("Add skills you actually have.");

  const jobs = resume.jobs.filter((j) => j.title.trim() && j.company.trim());
  if (jobs.length) score += 8;
  else issues.push("Add at least one job with title and company.");
  const dateOk = jobs.every((j) => /^\w{3} \d{4}$/.test(j.start.trim()) && (/^\w{3} \d{4}$/.test(j.end.trim()) || j.end.trim() === "Present"));
  if (jobs.length && dateOk) score += 6;
  else if (jobs.length) issues.push("Dates must look like Jan 2022 – Present.");

  const bullets = jobs.flatMap((j) => j.bullets.map((b) => b.trim()).filter(Boolean));
  if (bullets.length >= 3) score += 5;
  else raise.push("Add achievement bullets that start with strong verbs.");
  if (bullets.some((b) => /^(i|me|my)\b/i.test(b))) issues.push("Drop I / me / my from bullets.");
  else if (bullets.length) score += 3;

  if (resume.education.some((e) => e.degree.trim() && e.school.trim())) score += 4;
  else raise.push("Add education: degree, field, university, date.");

  const keys = jdKeywords(resume.jd);
  const hay = haystack(resume);
  const included = keys.filter((k) => hay.includes(k.toLowerCase()));
  const omitted = keys.filter((k) => !hay.includes(k.toLowerCase()));
  if (keys.length) {
    const ratio = included.length / keys.length;
    score += Math.round(Math.min(18, ratio * 22));
    if (ratio < 0.25) raise.push("Mirror JD keywords only for skills you can prove.");
  } else {
    raise.push("Paste a job description to score keyword match.");
  }

  const stuffing =
    keys.length && included.length > 0 && skills.length > 22
      ? "High"
      : keys.length && included.length / Math.max(keys.length, 1) > 0.85 && skills.length > 18
        ? "Medium"
        : "Low";
  if (stuffing !== "Low") score -= 6;

  score = Math.max(20, Math.min(96, score));
  const layout: "PASS" | "FAIL" = issues.some((i) => i.includes("header") || i.includes("Dates")) ? "FAIL" : issues.length > 3 ? "FAIL" : "PASS";
  const band = score >= 90 ? "90–95" : score >= 85 ? "85–90" : "needs more evidence";
  if (score < 90) {
    raise.push("Do not invent metrics. Add real tools, dates, and results you can defend.");
  }

  return { band, score, stuffing, layout, included: included.slice(0, 24), omitted: omitted.slice(0, 24), issues, raise: raise.slice(0, 8) };
}

export function contactLine(resume: AtsResume): string {
  const bits = [
    [resume.city, resume.country].filter(Boolean).join(", "),
    resume.phone,
    resume.email,
    resume.linkedin,
    resume.github,
  ].filter(Boolean);
  return bits.join(" | ");
}

export function resumePlainText(resume: AtsResume): string {
  const out: string[] = [];
  for (const line of resumeLines(resume, "file")) {
    switch (line.kind) {
      case "name":
      case "role":
      case "contact":
      case "body":
      case "meta":
        out.push(line.text);
        break;
      case "heading":
        if (out.length) out.push("");
        out.push(line.text.toUpperCase());
        break;
      case "split":
        out.push([line.left, line.right].filter(Boolean).join("  |  "));
        break;
      case "bullet":
        out.push(`- ${line.text}`);
        break;
    }
  }
  return `${out.join("\n").trim()}\n`;
}

const HEADING_MAP: Array<{ re: RegExp; key: "summary" | "skills" | "jobs" | "education" | "certs" | "projects" }> = [
  { re: /^(professional\s+)?summary$|^profile$|^objective$|^about me$/i, key: "summary" },
  { re: /^skills?$|^technical skills$|^core competencies$|^tools$/i, key: "skills" },
  { re: /^(work\s+)?experience$|^employment$|^work history$|^professional experience$/i, key: "jobs" },
  { re: /^education$|^academic$/i, key: "education" },
  { re: /^certifications?$|^certificates?$/i, key: "certs" },
  { re: /^projects?$|^selected projects$/i, key: "projects" },
];

function monthFix(value: string): string {
  const m = value.match(/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{4})$/i);
  if (!m) return /present/i.test(value) ? "Present" : value;
  const idx = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].indexOf(m[1]!.slice(0, 3).toLowerCase());
  return `${MONTHS[idx] ?? "Jan"} ${m[2]}`;
}

function parseJobBlock(block: string): AtsJob[] {
  const lines = block.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const jobs: AtsJob[] = [];
  let current: AtsJob | null = null;
  const dateRe =
    /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4})\s*[–\-—to]+\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|Present)/i;

  for (const line of lines) {
    const dates = line.match(dateRe);
    if (dates) {
      if (current && (current.title || current.company || current.bullets.some(Boolean))) jobs.push(current);
      const rest = line.replace(dateRe, "").replace(/[|•·]/g, " ").replace(/\s+/g, " ").trim();
      const parts = rest.split(/,| {2,}/).map((p) => p.trim()).filter(Boolean);
      current = {
        title: parts[0] || "",
        company: parts[1] || "",
        city: parts[2] || "",
        start: monthFix(dates[1]!),
        end: monthFix(dates[2]!),
        bullets: [],
        kind: /intern/i.test(line) ? "internship" : /freelance|consultant/i.test(line) ? "freelance" : /contract/i.test(line) ? "contract" : "full-time",
      };
      continue;
    }
    if (/^[•\-*–—]/.test(line) || (current && current.bullets.length && line.length > 24)) {
      if (!current) current = emptyJob();
      current.bullets.push(line.replace(/^[\s•\-*–—]+/, "").trim());
      continue;
    }
    if (!current) current = emptyJob();
    if (!current.title) current.title = line;
    else if (!current.company) current.company = line.replace(/,.*$/, "").trim();
  }
  if (current && (current.title || current.company || current.bullets.some(Boolean))) jobs.push(current);
  return jobs.length ? jobs.map((j) => ({ ...j, bullets: j.bullets.length ? j.bullets : [""] })) : [];
}

export function importResumeText(raw: string): Partial<AtsResume> {
  const text = raw
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((l) => !/date of birth|\bd\.?o\.?b\.?\b|father.?s name|religion|marital status|references available|aadhaar|passport no|blood group|nationality/i.test(l))
    .join("\n")
    .trim();
  if (!text) return {};
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? "";
  const linkedin = text.match(/https?:\/\/\S*linkedin\.com\/\S+/i)?.[0] ?? text.match(/linkedin\.com\/in\/\S+/i)?.[0] ?? "";
  const github = text.match(/https?:\/\/\S*github\.com\/\S+/i)?.[0] ?? "";
  const phone =
    text.match(/\+91[\s-]?\d{5}[\s-]?\d{5}/)?.[0] ??
    text.match(/\+\d{1,3}[\s.-]?\d{6,12}/)?.[0] ??
    text.match(/\b\d{10}\b/)?.[0] ??
    "";

  const lines = text.split(/\n/).map((l) => l.trim());
  const first = lines.find((l) => l && !l.includes("@") && !/linkedin|github|http/i.test(l) && l.length < 60) ?? "";
  const fullName = first && !/summary|experience|skills|education/i.test(first) ? first : "";

  const sections: Record<string, string[]> = {};
  let bucket = "lead";
  for (const line of lines) {
    const hit = HEADING_MAP.find((h) => h.re.test(line.replace(/[:]/g, "").trim()));
    if (hit) {
      bucket = hit.key;
      sections[bucket] = sections[bucket] ?? [];
      continue;
    }
    (sections[bucket] = sections[bucket] ?? []).push(line);
  }

  const skillBlock = (sections.skills ?? []).join(" ");
  const skillBits = splitSkills(skillBlock.replace(/technical:?/gi, ",").replace(/tools?:?/gi, ",").replace(/domain:?/gi, ","));
  const third = Math.ceil(skillBits.length / 3) || 1;

  const jobs = parseJobBlock((sections.jobs ?? []).join("\n"));
  const eduLines = (sections.education ?? []).filter(Boolean);
  const education: AtsEducation[] = eduLines.length
    ? [
        {
          degree: eduLines[0] ?? "",
          field: "",
          school: eduLines[1] ?? "",
          city: "",
          date: eduLines.find((l) => /\d{4}/.test(l)) ?? "",
        },
      ]
    : [];

  const certs = (sections.certs ?? [])
    .filter(Boolean)
    .map((line) => ({ name: line.replace(/\(.*/, "").trim(), issuer: "", date: "" }));
  const projLines = (sections.projects ?? []).filter(Boolean);
  const projects: AtsProject[] = [];
  for (let i = 0; i < projLines.length; i += 1) {
    const line = projLines[i]!;
    if (/^[•\-*]/.test(line) && projects.length) {
      projects[projects.length - 1]!.detail = line.replace(/^[\s•\-*–—]+/, "");
    } else {
      projects.push({ name: line.replace(/^[\s•\-*–—]+/, ""), detail: "" });
    }
  }

  const summary = (sections.summary ?? []).filter(Boolean).join(" ").trim();

  return {
    fullName,
    email,
    phone,
    linkedin,
    github,
    summary,
    technical: skillBits.slice(0, third).join(", "),
    tools: skillBits.slice(third, third * 2).join(", "),
    domain: skillBits.slice(third * 2).join(", "),
    jobs: jobs.length ? jobs : undefined,
    education: education.length ? education : undefined,
    certs: certs.length ? certs : undefined,
    projects: projects.length ? projects : undefined,
  };
}

export function mergeImported(current: AtsResume, part: Partial<AtsResume>): AtsResume {
  const pick = (a: string, b?: string) => (a.trim() ? a : (b ?? "").trim());
  return {
    ...current,
    fullName: pick(current.fullName, part.fullName),
    city: pick(current.city, part.city),
    country: pick(current.country, part.country),
    phone: pick(current.phone, part.phone),
    email: pick(current.email, part.email),
    linkedin: pick(current.linkedin, part.linkedin),
    github: pick(current.github, part.github),
    targetTitle: pick(current.targetTitle, part.targetTitle),
    company: pick(current.company, part.company),
    summary: pick(current.summary, part.summary),
    technical: pick(current.technical, part.technical),
    tools: pick(current.tools, part.tools),
    domain: pick(current.domain, part.domain),
    jobs: part.jobs?.some((j) => j.title.trim() || j.company.trim()) ? part.jobs : current.jobs,
    education: part.education?.some((e) => e.degree.trim() || e.school.trim()) ? part.education : current.education,
    certs: part.certs?.some((c) => c.name.trim()) ? part.certs : current.certs,
    projects: part.projects?.some((p) => p.name.trim()) ? part.projects : current.projects,
  };
}
