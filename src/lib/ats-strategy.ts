import {
  analyzeJd,
  bulletAdvice,
  inferSeniority,
  isFresher,
  normalizeTitle,
  semanticHit,
  timelineNotes,
  type JdIntel,
} from "./ats-intel";
import { splitSkills, type AtsResume } from "./ats-resume";

export type CareerStage =
  | "student"
  | "fresher"
  | "entry"
  | "experienced"
  | "career-changer"
  | "returning"
  | "freelancer";

export type InputQuality = "COMPLETE" | "PARTIAL" | "POOR" | "CONTRADICTORY";

export type TitlePair = {
  official: string;
  target: string;
  fair: boolean;
  note: string;
};

export type Objection = {
  concern: string;
  reduce: string;
};

export type InterviewItem = {
  category: "Technical" | "Behavioral" | "Situational" | "Resume-based" | "JD-based" | "Gap/objection";
  q: string;
  why: string;
  evidence: string;
  doNotClaim: string;
};

export type QaItem = { area: "ATS" | "Content" | "Recruiter" | "Truth"; item: string; pass: boolean; fix: string };

export type ActionItem = { text: string; impact: "HIGH" | "MEDIUM" | "LOW"; effort: "HIGH" | "MEDIUM" | "LOW" };

export type VersionMeta = {
  id: string;
  role: string;
  company: string;
  market: string;
  date: string;
};

function jobs(resume: AtsResume) {
  return resume.jobs.filter((j) => j.title.trim() && j.company.trim());
}

function bullets(resume: AtsResume) {
  return jobs(resume).flatMap((j) => j.bullets.map((b) => b.trim()).filter(Boolean));
}

function yearsApprox(resume: AtsResume): number | null {
  const ys = jobs(resume)
    .map((j) => j.start.match(/(\d{4})$/)?.[1])
    .filter(Boolean)
    .map(Number);
  if (!ys.length) return null;
  return Math.max(0, new Date().getFullYear() - Math.min(...ys));
}

function monthIndex(value: string): number | null {
  if (value.trim() === "Present") {
    const n = new Date();
    return n.getFullYear() * 12 + n.getMonth();
  }
  const m = value.trim().match(/^([A-Za-z]{3})\s+(\d{4})$/);
  if (!m) return null;
  const idx = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].indexOf(m[1]!);
  if (idx < 0) return null;
  return Number(m[2]) * 12 + idx;
}

export function noJd(resume: AtsResume): boolean {
  const jd = resume.jd.trim();
  return !jd || /^none$/i.test(jd);
}

export function noExperience(resume: AtsResume): boolean {
  return jobs(resume).filter((j) => j.kind === "full-time" || j.kind === "contract").length === 0;
}

export function detectStage(resume: AtsResume, intel: JdIntel): CareerStage {
  const listed = jobs(resume);
  const full = listed.filter((j) => j.kind === "full-time");
  const gig = listed.filter((j) => j.kind === "freelance" || j.kind === "contract");
  const intern = listed.filter((j) => j.kind === "internship");
  const y = yearsApprox(resume);
  const gap = timelineNotes(resume).some((n) => n.type === "gap" && /12|1[3-9]|[2-9]\d months/.test(n.message));
  const longGap = listed.some((j) => {
    if (j.kind === "internship" || j.kind === "volunteer") return false;
    const end = monthIndex(j.end);
    if (end === null || j.end === "Present") return false;
    const now = new Date();
    return now.getFullYear() * 12 + now.getMonth() - end >= 12;
  });
  const titleFn = inferSeniority(resume.targetTitle || intel.title);
  const workFn = inferSeniority(listed[0]?.title || "");
  const changer =
    Boolean(resume.targetTitle.trim() && listed[0]?.title) &&
    resume.targetTitle.trim().toLowerCase() !== listed[0]!.title.toLowerCase() &&
    titleFn !== "unknown" &&
    workFn !== "unknown" &&
    titleFn !== workFn;

  if ((longGap || gap) && full.length) return "returning";
  if (changer && full.length) return "career-changer";
  if (gig.length >= Math.max(1, full.length) && gig.length > 0 && full.length === 0) return "freelancer";
  if (resume.market === "campus" || (intern.length && !full.length && y !== null && y < 1)) return "student";
  if (isFresher(resume) || (full.length === 0 && (intern.length || resume.projects.some((p) => p.name.trim()))) ) return "fresher";
  if (y !== null && y < 2) return "entry";
  return "experienced";
}

export function stageStrategy(stage: CareerStage): string[] {
  switch (stage) {
    case "student":
    case "fresher":
      return ["Lead with projects and internships. Do not invent a job."];
    case "entry":
      return ["Show a slice of work you owned. Skip fake revenue."];
    case "experienced":
      return ["Lead with impact and scope. Cut class projects unless they prove a P0 skill."];
    case "career-changer":
      return ["Keep official titles. Target title belongs in the header only if the work maps."];
    case "returning":
      return ["Leave the gap. Do not invent a consulting stint."];
    case "freelancer":
      return ["Name the real client. Mark the role as freelance or contract."];
  }
}

export function titlePair(resume: AtsResume, intel: JdIntel): TitlePair {
  const official = resume.jobs.find((j) => j.title.trim())?.title.trim() || "";
  const target = resume.targetTitle.trim() || intel.title;
  if (!official && !target) {
    return { official: "", target: "", fair: true, note: "No titles yet." };
  }
  if (!official) {
    return {
      official: "",
      target,
      fair: true,
      note: "Target title is for the header/summary only. It is not an employment history line.",
    };
  }
  const same = official.toLowerCase() === target.toLowerCase();
  const officialN = normalizeTitle(official);
  const targetN = normalizeTitle(target);
  const close =
    officialN.toLowerCase().includes(targetN.toLowerCase()) ||
    targetN.toLowerCase().includes(officialN.toLowerCase()) ||
    inferSeniority(official) === inferSeniority(target);
  const fair = same || close;
  return {
    official,
    target: target || official,
    fair,
    note: fair
      ? same
        ? "Official title and target title match. Do not rewrite employment history."
        : `Fair equivalent only in the header/summary: “${official}” → “${targetN}”. Keep “${official}” on the job line.`
      : `Do not print “${target}” as a past job title. Official history stays “${official}”.`,
  };
}

export function inputQuality(resume: AtsResume): { grade: InputQuality; conflicts: string[] } {
  const conflicts: string[] = [];
  const named = Boolean(resume.fullName.trim() && resume.email.includes("@"));
  const work = jobs(resume).length + resume.projects.filter((p) => p.name.trim()).length;
  const skills = splitSkills(resume.technical).length + splitSkills(resume.tools).length;
  const jd = !noJd(resume);

  for (const n of timelineNotes(resume)) {
    if (n.type === "overlap") conflicts.push(n.message);
  }
  const y = yearsApprox(resume);
  const intel = analyzeJd(resume);
  const want = intel.yearsRequired.match(/(\d+)/)?.[1];
  if (want && (y === null || Number(want) - y >= 2)) {
    conflicts.push(
      `JD asks for ${intel.yearsRequired}; this draft shows ${y === null ? "no full-time years" : `about ${y} years`}. Do not stretch dates or invent jobs.`,
    );
  }
  for (const j of jobs(resume)) {
    const a = monthIndex(j.start);
    const b = monthIndex(j.end || "Present");
    if (a !== null && b !== null && a > b) {
      conflicts.push(`Start after end on ${j.title || "a role"} (${j.start} / ${j.end}). Do not silently swap them.`);
    }
  }
  const pair = titlePair(resume, intel);
  if (pair.official && pair.target && !pair.fair) conflicts.push(pair.note);

  let grade: InputQuality = "POOR";
  if (named && work && skills >= 8 && resume.summary.trim().length >= 40) grade = jd ? "COMPLETE" : "PARTIAL";
  else if (named || work || skills) grade = "PARTIAL";
  if (conflicts.length) grade = "CONTRADICTORY";
  return { grade, conflicts };
}

export function embellishmentFlags(resume: AtsResume): string[] {
  const flags: string[] = [];
  const b = bullets(resume);
  const pct = b.filter((x) => /\d+\s*%/.test(x));
  if (b.length >= 3 && pct.length / b.length >= 0.75) {
    flags.push("Almost every bullet has a percentage. Treat unverified % as SUGGESTED. Do not keep them in the file.");
  }
  if (b.some((x) => /\b(100%|10x|world-class|best-in-class|industry-leading|expert in all|ninja|rockstar)\b/i.test(x))) {
    flags.push("Embellished language or extreme metrics detected. Strip to VERIFIED verbs and tools.");
  }
  if (b.some((x) => /team of\s*(?:[5-9]\d|\d{3,})/i.test(x))) {
    flags.push("Large team-size claim. Confirm headcount before it stays on the page.");
  }
  const certs = resume.certs.filter((c) => c.name.trim()).length;
  if (certs >= 6 && jobs(resume).filter((j) => j.kind === "full-time").length <= 1) {
    flags.push("Certification dump with little employment. Certs do not replace P0 experience. Do not lead the page with certs.");
  }
  return flags;
}

export function stuffingFlags(resume: AtsResume): string[] {
  const flags: string[] = [];
  const all = [
    resume.summary,
    ...bullets(resume),
    resume.technical,
    resume.tools,
    ...resume.projects.map((p) => p.detail),
  ]
    .join(" ")
    .toLowerCase();
  const jd = resume.jd.trim();
  if (jd && jd.length > 80) {
    const snippet = jd.replace(/\s+/g, " ").trim().slice(0, 80).toLowerCase();
    if (snippet.length > 40 && all.includes(snippet.slice(0, 40))) {
      flags.push("A JD sentence appears copied into the draft. Rewrite in your own words.");
    }
  }
  const b = bullets(resume);
  if (b.length >= 3) {
    const words = splitSkills(resume.technical + "," + resume.tools);
    for (const w of words.slice(0, 12)) {
      const hits = b.filter((x) => semanticHit(x, w) !== "none").length;
      if (hits / b.length >= 0.7) flags.push(`“${w}” repeats in most bullets. Keep it in Skills and one proof bullet.`);
    }
  }
  return flags;
}

export function whyThisCandidate(resume: AtsResume, intel: JdIntel): string[] {
  const reasons: string[] = [];
  const strong = intel.terms.filter((t) => t.priority === "P0" && t.match === "exact").map((t) => t.text);
  const latest = jobs(resume)[0];
  const proofBullet = bullets(resume).find((b) => /\d/.test(b)) || bullets(resume)[0];
  if (strong.length) reasons.push(`P0 skills with evidence in this draft: ${strong.slice(0, 4).join(", ")}.`);
  if (latest) reasons.push(`Most recent role ${latest.title} at ${latest.company} maps to this search — official title unchanged.`);
  if (proofBullet) reasons.push(`Concrete work on record: ${proofBullet}`);
  if (resume.projects.some((p) => p.name.trim()) && noExperience(resume)) {
    reasons.push(`No full-time job on file. Practical proof is ${resume.projects.find((p) => p.name.trim())!.name}.`);
  }
  if (!reasons.length) reasons.push("Not enough VERIFIED evidence yet to recommend an interview. Fill jobs or projects first.");
  return reasons.slice(0, 3);
}

export function objections(resume: AtsResume, intel: JdIntel): Objection[] {
  const out: Objection[] = [];
  const miss = intel.terms.filter((t) => (t.priority === "P0" || t.priority === "P1") && t.match === "none");
  if (miss.length) {
    out.push({
      concern: `Missing tool/skill: ${miss
        .slice(0, 4)
        .map((t) => t.text)
        .join(", ")}`,
      reduce: "Leave them off. If you have them, add one real bullet. Do not stuff the skill list.",
    });
  }
  const gaps = timelineNotes(resume).filter((n) => n.type === "gap");
  if (gaps.length) out.push({ concern: "Career gap", reduce: gaps[0]!.message });
  if (intel.industry && resume.domain && !resume.domain.toLowerCase().includes(intel.industry.toLowerCase().slice(0, 4))) {
    out.push({
      concern: `Industry mismatch (${intel.industry})`,
      reduce: "Keep your industry honest. Map transferable tools (Excel, SQL, reporting) — do not fake domain years.",
    });
  }
  if (intel.educationRequired && !resume.education.some((e) => e.degree.toLowerCase().includes(intel.educationRequired.toLowerCase().slice(0, 3)))) {
    out.push({
      concern: `Degree mismatch (JD mentions ${intel.educationRequired})`,
      reduce: "Print your real degree. Adjacent coursework or certs can sit under Education/Certifications.",
    });
  }
  const short = jobs(resume).filter((j) => {
    const a = monthIndex(j.start);
    const b = monthIndex(j.end || "Present");
    return a !== null && b !== null && b - a < 10;
  });
  if (short.length) {
    out.push({
      concern: `Short tenure: ${short[0]!.title} at ${short[0]!.company}`,
      reduce: "Keep the dates. Lead the bullet with what shipped, not with a rewritten end date.",
    });
  }
  const senJd = intel.seniority;
  const senYou = inferSeniority(resume.targetTitle || jobs(resume)[0]?.title || "");
  if (senJd === "senior" && (senYou === "junior" || senYou === "intern")) {
    out.push({ concern: "Underqualification vs JD seniority", reduce: "Do not relabel yourself Senior. Apply if the work maps; let the title stay honest." });
  }
  if ((senJd === "junior" || senJd === "intern") && (senYou === "senior" || senYou === "lead" || senYou === "manager")) {
    out.push({ concern: "Overqualification", reduce: "Target title can stay closer to the JD. Do not hide senior years — compress older jobs." });
  }
  if (bulletAdvice(resume).filter((b) => b.resultMissing).length >= 3) {
    out.push({
      concern: "Weak achievements (no verified results)",
      reduce: "Add a real number you can defend, or keep the verb+tool bullet without a fake 40%.",
    });
  }
  const y = yearsApprox(resume);
  const want = intel.yearsRequired.match(/(\d+)/)?.[1];
  if (want && (y === null || y < Number(want))) {
    out.push({
      concern: `Underqualification vs years (JD ${intel.yearsRequired}, draft ${y === null ? "0" : y})`,
      reduce: "Do not invent years. Lead with internships/projects if fresher, or apply only if remaining P0 skills are proven.",
    });
  }
  for (const f of embellishmentFlags(resume)) {
    out.push({ concern: "Embellishment risk", reduce: f });
  }
  return out.slice(0, 8);
}

export function interviewIntel(resume: AtsResume, intel: JdIntel): InterviewItem[] {
  const items: InterviewItem[] = [];
  const latest = jobs(resume)[0];
  if (latest) {
    items.push({
      category: "Resume-based",
      q: `Walk through ${latest.title} at ${latest.company}.`,
      why: "Six-second scan starts on the latest job line.",
      evidence: latest.bullets.find((b) => b.trim()) || "Add a first bullet before the interview.",
      doNotClaim: "Do not add a metric you cannot walk through on a whiteboard.",
    });
  }
  for (const t of intel.terms.filter((x) => x.priority === "P0" && x.match !== "none").slice(0, 3)) {
    items.push({
      category: "Technical",
      q: `How did you use ${t.text}?`,
      why: "P0 on the JD and it appears in your draft.",
      evidence: bullets(resume).find((b) => semanticHit(b, t.text) !== "none") || `${t.text} is listed — add a bullet.`,
      doNotClaim: `Do not claim expert-level ${t.text} if the bullet is only “used ${t.text}”.`,
    });
  }
  for (const t of intel.terms.filter((x) => x.priority === "P0" && x.match === "none").slice(0, 2)) {
    items.push({
      category: "Gap/objection",
      q: `This role requires ${t.text}. Where is it?`,
      why: "Missing P0. They will notice.",
      evidence: "Only answer if you have a real example. Otherwise say you have not used it in production.",
      doNotClaim: `Do not say you are strong in ${t.text} if it is not on the resume.`,
    });
  }
  if (resume.projects.some((p) => p.name.trim())) {
    const p = resume.projects.find((x) => x.name.trim())!;
    items.push({
      category: "Resume-based",
      q: `What did you build in ${p.name}?`,
      why: noExperience(resume) ? "No full-time job — this is the proof." : "Projects back a tool claim.",
      evidence: p.detail.trim() || "Add stack and outcome.",
      doNotClaim: "Do not upgrade a class project into a production system you did not ship.",
    });
  }
  items.push({
    category: "Behavioral",
    q: "Tell me about a time you had to push back on a stakeholder.",
    why: "JD clusters often include stakeholder work even when the word is missing.",
    evidence: bullets(resume).find((b) => /stakeholder|client|partner|team/i.test(b)) || "Skip if you have no example.",
    doNotClaim: "Do not invent a conflict.",
  });
  items.push({
    category: "Situational",
    q: `First 90 days as ${resume.targetTitle.trim() || intel.title || "this role"}?`,
    why: "They test whether you understood the JD.",
    evidence: `Map 90 days to tools already in your bullets: ${splitSkills(resume.tools).slice(0, 4).join(", ") || "your listed tools"}.`,
    doNotClaim: "Do not promise a tool you have never used.",
  });
  if (!noJd(resume)) {
    items.push({
      category: "JD-based",
      q: `Which JD responsibility have you already done?`,
      why: "They check for copy-paste vs lived work.",
      evidence: intel.clusters[0] ? `Cluster on the JD: ${intel.clusters[0]}. Point to one bullet.` : "Pick one JD line you can prove.",
      doNotClaim: "Do not recite the JD back.",
    });
  }
  return items.slice(0, 10);
}

export function runQa(resume: AtsResume, intel: JdIntel): QaItem[] {
  const flags = stuffingFlags(resume);
  const pair = titlePair(resume, intel);
  const listed = jobs(resume);
  const items: QaItem[] = [
    { area: "ATS", item: "Single column, standard headings, contact in the body", pass: true, fix: "" },
    { area: "ATS", item: "No tables, photos, icons, or skill bars in the file", pass: true, fix: "" },
    {
      area: "ATS",
      item: "Dates look like Jan 2022 – Present",
      pass: listed.every((j) => !j.start || /^\w{3} \d{4}$/.test(j.start)),
      fix: "Fix dates before download.",
    },
    {
      area: "ATS",
      item: "No fake / stuffed keywords",
      pass: flags.length === 0,
      fix: flags[0] || "",
    },
    {
      area: "Content",
      item: "Strongest evidence first (latest job or project)",
      pass: Boolean(listed[0]?.bullets.some((b) => b.trim().length > 20) || resume.projects[0]?.detail),
      fix: "Put the best proof in the first bullet.",
    },
    {
      area: "Content",
      item: "Metrics only when verified",
      pass: flags.every((f) => !/copied/i.test(f)),
      fix: "Do not copy JD sentences or invent percentages.",
    },
    {
      area: "Recruiter",
      item: "Target role obvious in 6 seconds",
      pass: Boolean(resume.targetTitle.trim() || intel.title),
      fix: "Add a target title in the header/summary.",
    },
    {
      area: "Truth",
      item: "Official job titles not falsified",
      pass: pair.fair || !pair.target,
      fix: pair.note,
    },
    {
      area: "Truth",
      item: "No invented employers",
      pass: listed.every((j) => j.company.trim()),
      fix: "Company name is required on every job line.",
    },
    {
      area: "Truth",
      item: "No embellished / unverified extreme metrics",
      pass: embellishmentFlags(resume).length === 0,
      fix: embellishmentFlags(resume)[0] || "",
    },
  ];
  if (noJd(resume)) {
    items.push({
      area: "ATS",
      item: "No-JD mode: not claiming a JD match",
      pass: true,
      fix: "",
    });
  }
  if (noExperience(resume)) {
    items.push({
      area: "Truth",
      item: "No-experience mode: no fabricated full-time job",
      pass: listed.filter((j) => j.kind === "full-time").length === 0,
      fix: "Remove any full-time line you did not work.",
    });
  }
  return items;
}

export function actionPlan(resume: AtsResume, intel: JdIntel): ActionItem[] {
  const items: ActionItem[] = [];
  const miss = intel.terms.filter((t) => t.priority === "P0" && t.match === "none");
  if (miss[0]) items.push({ text: `Prove or drop P0 “${miss[0].text}”`, impact: "HIGH", effort: "LOW" });
  if (bulletAdvice(resume).some((b) => b.resultMissing)) {
    items.push({ text: "Verify one real metric on the latest role (time, volume, error, money) — insert only if true", impact: "HIGH", effort: "LOW" });
  }
  if (!resume.targetTitle.trim() && intel.title) {
    items.push({ text: `Set header target title to “${intel.title}” if the work maps; keep official job titles`, impact: "HIGH", effort: "LOW" });
  }
  const flags = stuffingFlags(resume);
  if (flags[0]) items.push({ text: flags[0], impact: "MEDIUM", effort: "LOW" });
  if (noExperience(resume) && !resume.projects.some((p) => p.detail.trim())) {
    items.push({ text: "Write one project bullet with tool + what you built", impact: "HIGH", effort: "MEDIUM" });
  }
  if (timelineNotes(resume).some((n) => n.type === "gap")) {
    items.push({ text: "Decide whether to add a one-line honest gap note — never a fake job", impact: "MEDIUM", effort: "LOW" });
  }
  if (splitSkills(resume.technical).length + splitSkills(resume.tools).length > 22) {
    items.push({ text: "Cut Skills to 12–22 proven items", impact: "HIGH", effort: "LOW" });
  }
  if (!items.length) items.push({ text: "Download the Word/PDF and apply — do not decorate the file", impact: "MEDIUM", effort: "LOW" });
  return items.slice(0, 5);
}

export type ApplyRec = "Apply" | "Apply with caveat" | "Do not apply";

export function applyRecommendation(resume: AtsResume): { rec: ApplyRec; why: string } {
  const intel = analyzeJd(resume);
  const quality = inputQuality(resume);
  const fake = embellishmentFlags(resume);
  const p0miss = intel.p0.filter((k) => intel.terms.find((t) => t.text === k)?.match === "none");
  if (!resume.fullName.trim() || !resume.email.includes("@")) {
    return { rec: "Do not apply", why: "Name and email must sit in the body first." };
  }
  if (quality.conflicts.length) {
    return { rec: "Do not apply", why: "Resolve conflicts (dates, years, titles) before you send the file." };
  }
  if (fake.length) {
    return { rec: "Do not apply", why: "Unverified metrics or embellishment — strip or confirm them." };
  }
  if (noJd(resume)) {
    return { rec: "Apply with caveat", why: "No-JD mode: this is a base resume, not a tailored match." };
  }
  if (p0miss.length >= 3) {
    return { rec: "Do not apply", why: `Missing P0 skills with no proof: ${p0miss.slice(0, 4).join(", ")}.` };
  }
  if (p0miss.length || quality.grade !== "COMPLETE" || noExperience(resume)) {
    return { rec: "Apply with caveat", why: p0miss.length ? `P0 still missing: ${p0miss.join(", ")}.` : "Draft is partial or fresher — send only with honest internships/projects." };
  }
  return { rec: "Apply", why: "P0 proof is in the draft, no conflicts, no embellishment." };
}

export function versionMeta(resume: AtsResume): VersionMeta {
  return {
    id: `CR-${Date.now().toString(36).toUpperCase()}`,
    role: resume.targetTitle.trim() || "Role",
    company: resume.company.trim() || "Company",
    market: resume.market,
    date: new Date().toISOString().slice(0, 10),
  };
}

export function inferredRoleCompetencies(resume: AtsResume): string[] {
  if (!noJd(resume)) return [];
  const title = resume.targetTitle.trim();
  if (!title) return ["No-JD mode: add a target title so we can infer likely competencies. They stay INFERRED, not match scores."];
  const sen = inferSeniority(title);
  return [
    `No-JD mode: not scoring keyword match against a job description.`,
    `INFERRED from target title “${title}” (${sen}): keep Skills to tools you have used. Do not load a generic JD.`,
  ];
}
