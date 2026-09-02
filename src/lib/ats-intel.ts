import {
  MONTHS,
  hasProof,
  inferJdCompany,
  inferJdTitle,
  parseJobDescription,
  proofText,
  type AtsJob,
  type AtsResume,
} from "./ats-resume";

export type Truth = "VERIFIED" | "INFERRED" | "SUGGESTED" | "MISSING";
export type KeywordPriority = "P0" | "P1" | "P2" | "P3";
export type KeywordKind =
  | "exact"
  | "acronym"
  | "synonym"
  | "related"
  | "tool"
  | "technology"
  | "business"
  | "soft"
  | "industry"
  | "metric";

export type Seniority = "intern" | "junior" | "mid" | "senior" | "lead" | "manager" | "director" | "unknown";

const SYN_GROUPS: string[][] = [
  ["javascript", "js", "ecmascript"],
  ["typescript", "ts"],
  ["react", "react.js", "reactjs"],
  ["node", "node.js", "nodejs"],
  ["next.js", "nextjs", "next"],
  ["python", "py"],
  ["excel", "microsoft excel", "ms excel"],
  ["power query", "powerquery"],
  ["power bi", "powerbi", "msbi"],
  ["sql", "t-sql", "transact-sql"],
  ["postgresql", "postgres"],
  ["mysql", "my sql"],
  ["aws", "amazon web services"],
  ["azure", "microsoft azure"],
  ["gcp", "google cloud", "google cloud platform"],
  ["ci/cd", "cicd", "continuous integration"],
  ["machine learning", "ml"],
  ["artificial intelligence", "ai"],
  ["mis", "management information system", "mis reporting"],
  ["stakeholder management", "stakeholders"],
  ["project management", "pmp"],
  ["customer relationship management", "crm"],
  ["enterprise resource planning", "erp"],
  ["search engine optimization", "seo"],
  ["user experience", "ux"],
  ["user interface", "ui"],
  ["quality assurance", "qa"],
  ["key performance indicator", "kpi"],
  ["software development engineer", "sde", "sde-1", "sde-2"],
  ["senior", "sr", "sr."],
  ["junior", "jr", "jr."],
];

const SOFT = new Set(
  "communication leadership teamwork collaboration ownership initiative adaptability problem-solving presentation negotiation mentoring".split(
    " ",
  ),
);

const FLUFF = [
  "team player",
  "fast paced",
  "self starter",
  "excellent communication",
  "detail oriented",
  "hit the ground running",
  "go getter",
  "work hard play hard",
  "passionate",
  "ninja",
  "rockstar",
  "guru",
];

const CLUSTERS: Array<{ name: string; re: RegExp }> = [
  { name: "Reporting & MIS", re: /\b(report|mis|dashboard|kpi|scorecard)\b/i },
  { name: "Data Analysis", re: /\b(analy|insight|sql|python|statistic|model)\b/i },
  { name: "Stakeholder Management", re: /\b(stakeholder|client|cross-functional|partner)\b/i },
  { name: "Automation", re: /\b(automat|script|macro|workflow|pipeline)\b/i },
  { name: "Financial Operations", re: /\b(financ|account|reconcile|invoice|budget|audit)\b/i },
  { name: "Product & Delivery", re: /\b(ship|sprint|roadmap|backlog|agile|scrum)\b/i },
  { name: "Engineering", re: /\b(api|backend|frontend|cloud|deploy|code|debug)\b/i },
  { name: "Marketing & Growth", re: /\b(campaign|seo|sem|lead|conversion|brand)\b/i },
  { name: "Customer Support", re: /\b(support|ticket|sla|customer success|csat)\b/i },
  { name: "People & Process", re: /\b(hire|onboard|train|process|sop|governance)\b/i },
];

const METRIC_HINTS = [
  "Time saved",
  "Error reduction",
  "Cost reduction",
  "Revenue impact",
  "Conversion rate",
  "Leads generated",
  "Campaign ROI",
  "Data volume",
  "Reporting frequency",
  "SLA improvement",
  "Processing time",
  "Customer count",
  "Team size",
  "Inventory value",
  "Transactions processed",
];

const STRONG = /^(led|built|created|designed|shipped|launched|improved|reduced|increased|owned|ran|wrote|implemented|migrated|automated|delivered|managed|developed|architected|optimized|scaled|fixed|mentored|negotiated|secured|cut|grew|drove|prepared|analyzed|designed)\b/i;
const WEAK = /^(responsible for|helped|worked on|involved in|assisted|participated|handled|did|made sure)\b/i;
const TOOLISH = /\b(excel|sql|python|react|aws|jira|figma|tableau|power bi|salesforce|git|docker|kubernetes|looker|hubspot|sap)\b/i;

export type IntelTerm = {
  text: string;
  priority: KeywordPriority;
  kind: KeywordKind;
  match: "exact" | "semantic" | "none";
  truth: Truth;
};

export type JdIntel = {
  title: string;
  company: string;
  seniority: Seniority;
  department: string;
  industry: string;
  functionName: string;
  yearsRequired: string;
  educationRequired: string;
  certsRequired: string[];
  clusters: string[];
  terms: IntelTerm[];
  p0: string[];
  p1: string[];
  p2: string[];
  p3: string[];
};

export type BulletAdvice = {
  original: string;
  improved: string;
  action: string;
  task: string;
  tool: string;
  context: string;
  result: string;
  resultMissing: boolean;
  metricHints: string[];
  truth: Truth;
};

export type TimelineNote = {
  type: "gap" | "overlap" | "promotion" | "order" | "kind";
  message: string;
  truth: Truth;
};

export type GapAnalysis = {
  strong: string[];
  partial: string[];
  missing: string[];
  risky: string[];
  improvements: string[];
};

function norm(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9.+#/]+/g, " ").replace(/\s+/g, " ").trim();
}

function synGroup(term: string): string[] {
  const n = norm(term);
  for (const group of SYN_GROUPS) {
    if (group.some((g) => n === g || n.includes(g) || g.includes(n))) return group;
  }
  return [n];
}

export function canClaimKeyword(resume: AtsResume, term: string): boolean {
  const hay = proofText(resume);
  if (semanticHit(hay, term) !== "none") return true;
  for (const c of CLUSTERS) {
    if (c.re.test(term) && c.re.test(hay)) return true;
  }
  return false;
}

export function semanticHit(hay: string, term: string): "exact" | "semantic" | "none" {
  const h = hay.toLowerCase();
  const n = norm(term);
  if (!n) return "none";
  if (h.includes(n)) return "exact";
  const group = synGroup(term);
  for (const g of group) {
    if (g !== n && h.includes(g)) return "semantic";
  }
  return "none";
}

export function normalizeTitle(title: string): string {
  return title
    .replace(/\bSr\.?\b/gi, "Senior")
    .replace(/\bJr\.?\b/gi, "Junior")
    .replace(/\bAssoc\.?\b/gi, "Associate")
    .replace(/\bMgr\.?\b/gi, "Manager")
    .replace(/\bEngg?\.?\b/gi, "Engineer")
    .replace(/\bSDE[- ]?I+\b/gi, "Software Development Engineer")
    .replace(/\s+/g, " ")
    .trim();
}

export function inferSeniority(text: string): Seniority {
  const t = text.toLowerCase();
  if (/\bintern|trainee|apprentice|campus\b/.test(t)) return "intern";
  if (/\bdirector|vp|vice president|head of\b/.test(t)) return "director";
  if (/\bmanager|head\b/.test(t)) return "manager";
  if (/\blead|principal|staff\b/.test(t)) return "lead";
  if (/\bsenior|sr\.?\b/.test(t)) return "senior";
  if (/\bjunior|jr\.?|associate|graduate\b/.test(t)) return "junior";
  if (/\bmid[- ]level|engineer ii|sde-?2\b/.test(t)) return "mid";
  return "unknown";
}

function inferDepartment(text: string): string {
  if (/\bfinance|account|fp&a|audit\b/i.test(text)) return "Finance";
  if (/\bmarket|growth|brand|seo\b/i.test(text)) return "Marketing";
  if (/\bsales|account executive|bdr|sdr\b/i.test(text)) return "Sales";
  if (/\bpeople|hr|talent|recruit\b/i.test(text)) return "People";
  if (/\bdata|analyst|bi |business intelligence\b/i.test(text)) return "Data";
  if (/\bproduct\b/i.test(text)) return "Product";
  if (/\bdesign|ux|ui\b/i.test(text)) return "Design";
  if (/\bengineer|developer|software|sde|devops|sre\b/i.test(text)) return "Engineering";
  if (/\boperations|ops|supply\b/i.test(text)) return "Operations";
  return "";
}

function inferIndustry(text: string): string {
  if (/\bfintech|bank|payment|lending\b/i.test(text)) return "Fintech";
  if (/\bhealth|hospital|pharma|clinic\b/i.test(text)) return "Healthcare";
  if (/\bedtech|education|university\b/i.test(text)) return "Education";
  if (/\be-?commerce|retail|shopify\b/i.test(text)) return "Ecommerce";
  if (/\bsaas|b2b software\b/i.test(text)) return "SaaS";
  if (/\blogistic|supply chain\b/i.test(text)) return "Logistics";
  return "";
}

function inferFunction(text: string): string {
  if (/\bfront[- ]?end\b/i.test(text)) return "Frontend";
  if (/\bback[- ]?end\b/i.test(text)) return "Backend";
  if (/\bfull[- ]?stack\b/i.test(text)) return "Full stack";
  if (/\bdata analy/i.test(text)) return "Data analysis";
  if (/\bmis|reporting\b/i.test(text)) return "Reporting";
  if (/\bproduct manag/i.test(text)) return "Product management";
  return inferDepartment(text);
}

function contextOf(jd: string, word: string): string {
  const i = jd.toLowerCase().indexOf(word.toLowerCase());
  if (i < 0) return "";
  return jd.slice(Math.max(0, i - 160), i + word.length + 100);
}

function classifyKind(word: string, parsedTools: string[]): KeywordKind {
  const n = norm(word);
  if (SOFT.has(n) || SOFT.has(word.toLowerCase())) return "soft";
  if (parsedTools.some((t) => norm(t) === n)) return "tool";
  if (/^[A-Z]{2,6}$/.test(word) && word === word.toUpperCase()) return "acronym";
  if (/\d|%|kpi|roi|sla/.test(n)) return "metric";
  if (/python|java|react|sql|cloud|api|node|typescript/.test(n)) return "technology";
  if (/agile|scrum|stakeholder|governance|compliance/.test(n)) return "business";
  if (/fintech|healthcare|ecommerce|saas/.test(n)) return "industry";
  return "exact";
}

function priorityOf(word: string, jd: string, kind: KeywordKind): KeywordPriority {
  if (FLUFF.some((f) => jd.toLowerCase().includes(f) && f.includes(word.toLowerCase()))) return "P3";
  if (kind === "soft") return "P3";
  const ctx = contextOf(jd, word);
  if (/prefer|nice to have|plus|optional|bonus|good to have/i.test(ctx)) return kind === "tool" ? "P1" : "P2";
  if (/must|required|minimum|mandat|need to|qualif/i.test(ctx)) return kind === "tool" || kind === "technology" ? "P0" : "P1";
  if (kind === "tool" || kind === "technology") return "P1";
  return "P2";
}

export function analyzeJd(resume: AtsResume): JdIntel {
  const jd = resume.jd.trim();
  const parsed = parseJobDescription(jd);
  const title = resume.targetTitle.trim() || parsed.title || inferJdTitle(jd);
  const company = resume.company.trim() || inferJdCompany(jd);
  const hay = proofText(resume);
  const terms: IntelTerm[] = [];

  for (const word of parsed.all) {
    const kind = classifyKind(word, parsed.tools);
    const priority = jd ? priorityOf(word, jd, kind) : "P2";
    const match = semanticHit(hay, word);
    const truth: Truth = match === "none" ? "MISSING" : "VERIFIED";
    terms.push({ text: word, priority, kind, match, truth });
  }
  for (const phrase of FLUFF) {
    if (jd && jd.toLowerCase().includes(phrase) && !terms.some((t) => t.text.toLowerCase() === phrase)) {
      terms.push({ text: phrase, priority: "P3", kind: "soft", match: semanticHit(hay, phrase), truth: "MISSING" });
    }
  }

  const clusters = CLUSTERS.filter((c) => c.re.test(jd)).map((c) => c.name).slice(0, 8);
  const yearsRequired = jd.match(/(\d+\+?\s*(?:years?|yrs?))/i)?.[1] ?? "";
  const educationRequired = jd.match(/\b(b\.?tech|m\.?tech|mba|bachelor|master|phd|ca|cfa)\b/i)?.[1] ?? "";
  const certsRequired = [...jd.matchAll(/\b(pmp|cpa|cfa|aws certified|azure fundamentals|scrum master)\b/gi)].map((m) => m[0]);

  return {
    title: normalizeTitle(title),
    company,
    seniority: inferSeniority(`${title} ${jd}`),
    department: inferDepartment(`${title} ${jd}`),
    industry: inferIndustry(jd),
    functionName: inferFunction(`${title} ${jd}`),
    yearsRequired,
    educationRequired,
    certsRequired: [...new Set(certsRequired.map((c) => c.toUpperCase()))],
    clusters,
    terms,
    p0: terms.filter((t) => t.priority === "P0").map((t) => t.text),
    p1: terms.filter((t) => t.priority === "P1").map((t) => t.text),
    p2: terms.filter((t) => t.priority === "P2").map((t) => t.text),
    p3: terms.filter((t) => t.priority === "P3").map((t) => t.text),
  };
}

function monthNum(value: string): number | null {
  if (value.trim() === "Present") {
    const now = new Date();
    return now.getFullYear() * 12 + now.getMonth();
  }
  const m = value.trim().match(/^([A-Za-z]{3})\s+(\d{4})$/);
  if (!m) return null;
  const idx = MONTHS.indexOf(m[1] as (typeof MONTHS)[number]);
  if (idx < 0) return null;
  return Number(m[2]) * 12 + idx;
}

export function timelineNotes(resume: AtsResume): TimelineNote[] {
  const jobs = resume.jobs.filter((j) => j.title.trim() || j.company.trim());
  const notes: TimelineNote[] = [];
  const dated = jobs
    .map((j, i) => ({ j, i, start: monthNum(j.start), end: monthNum(j.end || "Present") }))
    .filter((x) => x.start !== null && x.end !== null) as Array<{
    j: AtsJob;
    i: number;
    start: number;
    end: number;
  }>;

  for (let i = 0; i < dated.length - 1; i += 1) {
    const a = dated[i]!;
    const b = dated[i + 1]!;
    if (a.start < b.start) {
      notes.push({
        type: "order",
        message: "List jobs newest first. ATS and recruiters both scan from the top.",
        truth: "SUGGESTED",
      });
    }
    const later = a.start >= b.start ? a : b;
    const earlier = later === a ? b : a;
    const gap = later.start - earlier.end;
    if (gap >= 4) {
      notes.push({
        type: "gap",
        message: `Gap of about ${gap} months between ${earlier.j.company || "a role"} and ${later.j.company || "the next role"}. Add a one-line honest reason if you want — do not invent a job.`,
        truth: "INFERRED",
      });
    }
    if (a.start <= b.end && b.start <= a.end && a.j.company !== b.j.company) {
      notes.push({
        type: "overlap",
        message: `Overlapping dates: ${a.j.title} and ${b.j.title}. Mark one as contract/freelance if that is true.`,
        truth: "INFERRED",
      });
    }
    if (a.j.company && a.j.company.toLowerCase() === b.j.company.toLowerCase() && a.j.title !== b.j.title) {
      notes.push({
        type: "promotion",
        message: `Same employer (${a.j.company}) with two titles — treat as a promotion. Keep both titles, stacked, not two fake companies.`,
        truth: "INFERRED",
      });
    }
  }
  for (const j of jobs) {
    if (j.kind === "internship") {
      notes.push({ type: "kind", message: `${j.title || "A role"} is marked Internship — keep it, and lead with projects if you have few full-time jobs.`, truth: "VERIFIED" });
    }
    if (j.kind === "freelance" || j.kind === "contract") {
      notes.push({
        type: "kind",
        message: `${j.title || "A role"} is ${j.kind}. Keep the client/company name you actually worked under. Do not invent logos or “FAANG contract”.`,
        truth: "VERIFIED",
      });
    }
  }
  return notes.slice(0, 8);
}

export function analyzeBullet(text: string): BulletAdvice {
  const raw = text.replace(/^[\s•\-*–—]+/, "").trim();
  const words = raw.split(/\s+/);
  const action = words[0] || "";
  const toolMatch = raw.match(TOOLISH);
  const tool = toolMatch?.[0] ?? "";
  const hasResult = /\d|%|reduced|increased|cut|grew|saved|from .+ to /i.test(raw);
  const weak = WEAK.test(raw);
  let improved = raw;
  if (weak) {
    improved = raw
      .replace(/^responsible for\s+/i, "Owned ")
      .replace(/^helped\s+/i, "Supported ")
      .replace(/^worked on\s+/i, "Delivered ")
      .replace(/^involved in\s+/i, "Contributed to ")
      .replace(/^handled\s+/i, "Managed ")
      .replace(/^assisted\s+/i, "Supported ")
      .replace(/^participated in\s+/i, "Contributed to ");
    improved = improved.charAt(0).toUpperCase() + improved.slice(1);
    if (!/[.!?]$/.test(improved)) improved += ".";
  } else if (raw && !STRONG.test(raw) && !/^[A-Z]/.test(raw)) {
    improved = raw.charAt(0).toUpperCase() + raw.slice(1);
  }
  if (improved === raw && raw && !hasResult) {
    /* wording kept; result still missing */
  }
  const resultMissing = Boolean(raw) && !hasResult;
  const hints = resultMissing ? METRIC_HINTS.slice(0, 6) : [];
  return {
    original: raw,
    improved: improved === raw ? raw : improved,
    action,
    task: raw.replace(action, "").replace(tool, "").replace(/\d+%?/g, "").trim(),
    tool,
    context: "",
    result: hasResult ? "present" : "",
    resultMissing,
    metricHints: hints,
    truth: improved !== raw ? "SUGGESTED" : "VERIFIED",
  };
}

export function bulletAdvice(resume: AtsResume): BulletAdvice[] {
  return resume.jobs.flatMap((j) => j.bullets.map((b) => b.trim()).filter(Boolean).map(analyzeBullet)).slice(0, 16);
}

export function applySuggestedBullets(resume: AtsResume): AtsResume {
  return {
    ...resume,
    jobs: resume.jobs.map((j) => ({
      ...j,
      bullets: j.bullets.map((b) => {
        const a = analyzeBullet(b);
        return a.improved && a.improved !== a.original ? a.improved : b;
      }),
    })),
  };
}

export function gapAnalysis(resume: AtsResume, intel: JdIntel): GapAnalysis {
  const strong: string[] = [];
  const partial: string[] = [];
  const missing: string[] = [];
  const risky: string[] = [];
  const bullets = resume.jobs.flatMap((j) => j.bullets);
  for (const t of intel.terms) {
    if (t.priority === "P3") {
      if (t.match !== "none") risky.push(`${t.text} is low-value. Keep it out of Skills.`);
      continue;
    }
    if (t.match === "exact" && bullets.some((b) => semanticHit(b, t.text) !== "none")) strong.push(t.text);
    else if (t.match === "exact" || t.match === "semantic") partial.push(`${t.text}${t.match === "semantic" ? " (synonym match)" : " (listed, no bullet)"}`);
    else if (t.priority === "P0" || t.priority === "P1") missing.push(t.text);
    else if (t.priority === "P2") risky.push(`Do not add ${t.text} unless you can prove it.`);
  }

  const improvements: string[] = [];
  if (intel.p0.some((k) => missing.includes(k))) improvements.push("Prove or drop P0 required skills — never stuff them.");
  if (partial.length) improvements.push("Move partial matches into bullets: tool + work + result.");
  if (bulletAdvice(resume).some((b) => b.resultMissing)) improvements.push("Add verified numbers only. Leave result blank rather than invent 40%.");
  if (!resume.targetTitle.trim() && intel.title) improvements.push(`Set target title to “${intel.title}” if that is a fair match.`);
  const years = intel.yearsRequired;
  if (years) improvements.push(`JD asks for ${years}. Do not rewrite your dates to fit it.`);
  if (resume.jobs.filter((j) => j.title && j.company).length === 0 && resume.projects.some((p) => p.name.trim())) {
    improvements.push("Fresher path: lead with projects and internships. Do not invent a full-time job.");
  }
  if (intel.seniority !== "unknown" && inferSeniority(resume.targetTitle) !== "unknown" && intel.seniority !== inferSeniority(resume.targetTitle)) {
    improvements.push(`Title seniority may not match (${inferSeniority(resume.targetTitle)} vs JD ${intel.seniority}). Use a fair title, not a promotion you do not have.`);
  }
  if (!improvements.length) improvements.push("Keep the file single-column and download Word/PDF. Do not add graphics.");

  return {
    strong: strong.slice(0, 16),
    partial: partial.slice(0, 16),
    missing: missing.slice(0, 16),
    risky: risky.slice(0, 16),
    improvements: improvements.slice(0, 5),
  };
}

export function isFresher(resume: AtsResume): boolean {
  const jobs = resume.jobs.filter((j) => j.title.trim() && j.company.trim());
  const full = jobs.filter((j) => j.kind === "full-time");
  return full.length === 0;
}

export function doNotStuffTerms(intel: JdIntel): string[] {
  return intel.terms.filter((t) => t.priority === "P3" || t.truth === "MISSING" || t.kind === "soft").map((t) => t.text);
}

export function transferableNotes(resume: AtsResume, intel: JdIntel): string[] {
  const notes: string[] = [];
  const title = normalizeTitle(resume.targetTitle || resume.jobs[0]?.title || "");
  if (!title || !intel.title) return notes;
  if (norm(title) !== norm(intel.title) && inferFunction(title) && inferFunction(intel.title) && inferFunction(title) !== inferFunction(intel.title)) {
    notes.push(
      `Career-change signal: your title (${title}) and the JD (${intel.title}) differ in function. Translate verified work into JD language — do not paste the JD title onto a job you never held.`,
    );
  }
  return notes;
}

export { hasProof };
