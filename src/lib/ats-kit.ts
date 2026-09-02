import {
  analyzeJd,
  bulletAdvice,
  doNotStuffTerms,
  gapAnalysis,
  inferSeniority,
  isFresher,
  normalizeTitle,
  semanticHit,
  timelineNotes,
  transferableNotes,
  type BulletAdvice,
  type GapAnalysis,
  type JdIntel,
  type TimelineNote,
} from "./ats-intel";
import {
  actionPlan,
  applyRecommendation,
  detectStage,
  embellishmentFlags,
  inferredRoleCompetencies,
  inputQuality,
  interviewIntel,
  noJd,
  objections,
  runQa,
  stageStrategy,
  stuffingFlags,
  titlePair,
  versionMeta,
  whyThisCandidate,
  type ActionItem,
  type ApplyRec,
  type CareerStage,
  type InputQuality,
  type InterviewItem,
  type Objection,
  type QaItem,
  type TitlePair,
  type VersionMeta,
} from "./ats-strategy";
import {
  inferJdCompany,
  inferJdTitle,
  splitSkills,
  type AtsJob,
  type AtsResume,
  type JdTailor,
} from "./ats-resume";

export type CherryScore = {
  parseSafety: number;
  jdMatch: number;
  experience: number;
  content: number;
  scan: number;
  truth: number;
  overall: number;
  risk: "LOW" | "MEDIUM" | "HIGH";
  stuffing: "Low" | "Medium" | "High";
  layout: "PASS" | "FAIL";
  issues: string[];
  raise: string[];
  disclaimer: string;
  jdMatchNa: boolean;
};

export type KeywordBoard = {
  required: string[];
  preferred: string[];
  tools: string[];
  noise: string[];
  inResume: string[];
  missing: string[];
  doNotAdd: string[];
};

export type CherryKit = {
  score: CherryScore;
  board: KeywordBoard;
  intel: JdIntel;
  gap: GapAnalysis;
  timeline: TimelineNote[];
  bullets: BulletAdvice[];
  transferable: string[];
  stage: CareerStage;
  stageNotes: string[];
  titles: TitlePair;
  input: { grade: InputQuality; conflicts: string[] };
  why: string[];
  objections: Objection[];
  qa: QaItem[];
  plan: ActionItem[];
  stuffing: string[];
  version: VersionMeta;
  noJd: boolean;
  inferred: string[];
  changed: string[];
  recruiter: { ats: string[]; human: string[] };
  coverLetter: string;
  applyEmail: { subject: string; body: string };
  linkedin: { headline: string; about: string };
  tracker: { company: string; role: string; stage: string; followUp: string; filename: string };
  interview: InterviewItem[];
  india: string[];
  confirm: string[];
  next: string[];
  apply: { rec: ApplyRec; why: string };
  changelog: string[];
  embellishment: string[];
  keywordKinds: { acronyms: string[]; synonyms: string[]; related: string[] };
};

const STRONG = /^(led|built|created|designed|shipped|launched|improved|reduced|increased|owned|ran|wrote|implemented|migrated|automated|delivered|managed|developed|architected|optimized|scaled|fixed|mentored|negotiated|secured|cut|grew|drove|prepared|analyzed)\b/i;
const WEAK = /^(responsible for|helped|worked on|involved in|assisted|participated)\b/i;

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

export function keywordBoard(resume: AtsResume): KeywordBoard {
  const intel = analyzeJd(resume);
  if (noJd(resume)) {
    return { required: [], preferred: [], tools: [], noise: [], inResume: [], missing: [], doNotAdd: [] };
  }
  return {
    required: intel.p0.slice(0, 16),
    preferred: intel.p1.slice(0, 12),
    tools: intel.terms.filter((t) => t.kind === "tool" || t.kind === "technology").map((t) => t.text).slice(0, 12),
    noise: intel.p3.slice(0, 10),
    inResume: intel.terms.filter((t) => t.match !== "none" && t.priority !== "P3").map((t) => t.text).slice(0, 24),
    missing: intel.terms.filter((t) => t.match === "none" && (t.priority === "P0" || t.priority === "P1")).map((t) => t.text).slice(0, 24),
    doNotAdd: doNotStuffTerms(intel).slice(0, 24),
  };
}

function realJobs(resume: AtsResume): AtsJob[] {
  return resume.jobs.filter((j) => j.title.trim() && j.company.trim());
}

function realBullets(resume: AtsResume): string[] {
  return realJobs(resume).flatMap((j) => j.bullets.map((b) => b.trim()).filter(Boolean));
}

function skillsOf(resume: AtsResume): string[] {
  return [...splitSkills(resume.technical), ...splitSkills(resume.tools), ...splitSkills(resume.domain)];
}

function yearsWorked(resume: AtsResume): number | null {
  const years = realJobs(resume)
    .map((j) => {
      const m = j.start.trim().match(/(\d{4})$/);
      return m ? Number(m[1]) : null;
    })
    .filter((n): n is number => n !== null);
  if (!years.length) return null;
  return Math.max(0, new Date().getFullYear() - Math.min(...years));
}

export function cherryScore(resume: AtsResume): CherryScore {
  const issues: string[] = [];
  const raise: string[] = [];
  const intel = analyzeJd(resume);
  const board = keywordBoard(resume);
  const jobs = realJobs(resume);
  const bullets = realBullets(resume);
  const skills = skillsOf(resume);
  const advice = bulletAdvice(resume);
  const fresher = isFresher(resume);
  const internships = resume.jobs.filter((j) => j.kind === "internship" && (j.title.trim() || j.company.trim()));
  const projects = resume.projects.filter((p) => p.name.trim());
  const hay = `${resume.summary} ${resume.technical} ${resume.tools} ${bullets.join(" ")}`.toLowerCase();

  let parseSafety = 18;
  if (resume.fullName.trim()) parseSafety += 12;
  else issues.push("Add your full name in the body.");
  if (resume.email.trim() && resume.email.includes("@")) parseSafety += 12;
  else issues.push("Add an email in the body (not a header).");
  if (resume.phone.trim()) parseSafety += 6;
  else raise.push("Add a phone number.");
  if (resume.city.trim()) parseSafety += 6;
  else raise.push("Add city and country.");
  const dateOk = jobs.every(
    (j) => /^\w{3} \d{4}$/.test(j.start.trim()) && (/^\w{3} \d{4}$/.test(j.end.trim()) || j.end.trim() === "Present"),
  );
  if ((jobs.length || internships.length) && dateOk) parseSafety += 14;
  else if (jobs.length) issues.push("Dates must look like Jan 2022 – Present.");
  if (bullets.some((b) => /^(i|me|my)\b/i.test(b))) {
    issues.push("Drop I / me / my from bullets.");
    parseSafety -= 12;
  } else if (bullets.length) parseSafety += 8;
  if (timelineNotes(resume).some((n) => n.type === "overlap")) parseSafety -= 6;
  if (resume.market === "government") raise.push("Keep photo, DOB, father name, and religion off this ATS file unless the portal is a bio-data form.");
  parseSafety = clamp(parseSafety, 0, 100);

  let jdMatch = resume.jd.trim() && !noJd(resume) ? 12 : 0;
  if (noJd(resume)) raise.push("No-JD mode: JD match is not scored. This is a base resume, not a tailored match.");
  else if (!resume.jd.trim()) raise.push("Paste a job description to score JD match. CherryScore is not a vendor ATS result.");
  const p0 = intel.p0;
  const p0Exact = p0.filter((k) => semanticHit(hay, k) === "exact");
  const p0Sem = p0.filter((k) => semanticHit(hay, k) === "semantic");
  const p1Hit = intel.p1.filter((k) => semanticHit(hay, k) !== "none");
  if (resume.jd.trim() && !noJd(resume)) {
    if (p0.length) jdMatch += Math.round((p0Exact.length / p0.length) * 48 + (p0Sem.length / p0.length) * 18);
    else jdMatch += 20;
    if (intel.p1.length) jdMatch += Math.round((p1Hit.length / intel.p1.length) * 16);
    if (intel.title && resume.targetTitle.trim()) {
      const a = normalizeTitle(resume.targetTitle).toLowerCase();
      const b = intel.title.toLowerCase();
      if (a === b) jdMatch += 8;
      else if (a.includes(b) || b.includes(a) || inferSeniority(a) === intel.seniority) jdMatch += 4;
      else raise.push("Target title does not line up with the JD title. Use a fair match, not a promotion you do not have.");
    }
  }
  jdMatch = clamp(jdMatch, 0, 100);

  let experience = 10;
  if (jobs.length) experience += 28;
  else if (fresher && (internships.length || projects.length)) {
    experience += 20;
    raise.push("Fresher path: internships and projects count. Do not invent a full-time employer.");
  } else issues.push("Add a job, internship, or project with a real organisation name.");
  if (internships.length) experience += 8;
  if (projects.length) experience += 8;
  if (intel.clusters.length && bullets.length) {
    const hit = intel.clusters.filter((c) => bullets.some((b) => b.toLowerCase().includes(c.split(" ")[0]!.toLowerCase()))).length;
    experience += Math.min(16, hit * 4);
  }
  if (intel.yearsRequired && yearsWorked(resume) !== null) experience += 6;
  experience = clamp(experience, 0, 100);

  let content = 12;
  if (resume.targetTitle.trim()) content += 8;
  else issues.push("Add a target job title.");
  if (resume.summary.trim().length >= 40) content += 8;
  else issues.push("Write a professional summary of 2–4 sentences.");
  if (skills.length >= 12 && skills.length <= 22) content += 10;
  else if (skills.length > 0) {
    content += 4;
    raise.push("Aim for 12–22 real skills. P0 terms you can prove go first. Soft skills stay out of Skills.");
  } else issues.push("Add skills you actually have.");
  if (bullets.filter((b) => STRONG.test(b)).length >= 2) content += 10;
  else raise.push("Start bullets with a strong verb + tool + result.");
  if (bullets.some((b) => WEAK.test(b))) {
    content -= 8;
    raise.push("Replace “responsible for / helped / worked on” — wording only, no fake 40%.");
  }
  const fakeRich = embellishmentFlags(resume).length > 0;
  if (!fakeRich && advice.filter((a) => !a.resultMissing).length >= 2) content += 10;
  else if (fakeRich) {
    content -= 8;
    raise.push("Impressive metrics look unverified. Strip percentages until the user confirms them.");
  } else raise.push("Result/impact not provided on most bullets — verify a metric before adding one.");
  if (resume.education.some((e) => e.degree.trim() && e.school.trim())) content += 8;
  else raise.push("Add education: degree, field, university, date.");
  if (resume.certs.some((c) => c.name.trim()) && intel.certsRequired.length) content += 6;
  content = clamp(content, 0, 100);

  let scan = 16;
  if (resume.fullName.trim()) scan += 12;
  if (resume.targetTitle.trim()) scan += 12;
  if (jobs[0]?.title && jobs[0]?.company) scan += 14;
  else if (fresher && projects[0]?.name) scan += 10;
  if ((jobs[0]?.bullets ?? []).some((b) => b.trim().length > 30)) scan += 14;
  if (skills.length) scan += 8;
  const years = yearsWorked(resume);
  if (years !== null && years < 8) scan += 8;
  else if (years !== null && years >= 8) raise.push("Two pages max. Cut old jobs that do not match this JD.");
  if (fresher) scan += 6;
  scan = clamp(scan, 0, 100);

  let truth = 88;
  if (skills.length > 22) truth -= 18;
  if (board.doNotAdd.length && skills.some((s) => board.doNotAdd.map((d) => d.toLowerCase()).includes(s.toLowerCase()))) truth -= 20;
  if (p0.length && p0Exact.length / p0.length < 0.4) truth -= 10;
  if (WEAK.test(resume.summary)) truth -= 6;
  truth -= Math.min(40, embellishmentFlags(resume).length * 14);
  if (resume.certs.filter((c) => c.name.trim()).length >= 6 && jobs.length <= 1) truth -= 10;
  truth = clamp(truth, 0, 100);

  const stuffing: CherryScore["stuffing"] =
    skills.length > 22 || (board.doNotAdd.length > 8 && board.inResume.length > 16) ? "High" : skills.length > 18 ? "Medium" : "Low";

  let overall = Math.round(
    truth * 0.28 + jdMatch * 0.2 + scan * 0.16 + parseSafety * 0.14 + experience * 0.12 + content * 0.1,
  );
  if (stuffing === "High") overall = Math.min(overall, 62);
  if (!noJd(resume) && p0.length >= 3 && p0Exact.length / p0.length < 0.5) overall = Math.min(overall, 68);
  if (stuffingFlags(resume).length) {
    overall = Math.min(overall, 70);
    raise.push(...stuffingFlags(resume).slice(0, 2));
  }
  if (embellishmentFlags(resume).length) overall = Math.min(overall, 58);
  const wantYrs = intel.yearsRequired.match(/(\d+)/)?.[1];
  if (wantYrs && (years === null || years < Number(wantYrs)) && fresher) overall = Math.min(overall, 64);
  overall = clamp(overall, 0, 100);

  const layout: "PASS" | "FAIL" = issues.length > 3 || issues.some((i) => i.includes("Dates") || i.includes("header")) ? "FAIL" : "PASS";
  let risk: CherryScore["risk"] = "LOW";
  if (
    layout === "FAIL" ||
    stuffing === "High" ||
    truth < 55 ||
    embellishmentFlags(resume).length > 0 ||
    (p0.length >= 3 && p0Exact.length === 0)
  ) {
    risk = "HIGH";
  } else if (issues.length || p0.length > p0Exact.length || advice.some((a) => a.resultMissing) || (wantYrs && years !== null && years < Number(wantYrs))) {
    risk = "MEDIUM";
  }

  return {
    parseSafety,
    jdMatch,
    experience,
    content,
    scan,
    truth,
    overall,
    risk,
    stuffing,
    layout,
    issues,
    raise: raise.slice(0, 8),
    disclaimer: "Internal score, not a vendor ATS.",
    jdMatchNa: noJd(resume),
  };
}

function fileToken(value: string): string {
  const t = value.trim().replace(/[^\w]+/g, "");
  return t.slice(0, 40);
}

export function kitFilename(resume: AtsResume): string {
  const name = fileToken(resume.fullName) || "Resume";
  const title = fileToken(resume.targetTitle) || "Role";
  const company = fileToken(resume.company || inferJdCompany(resume.jd)) || "Company";
  return `${name}_${title}_${company}_ATS`;
}

function plusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function matchedSkills(resume: AtsResume, board: KeywordBoard): string[] {
  return board.inResume.slice(0, 8);
}

function coverLetter(resume: AtsResume, board: KeywordBoard): string {
  const company = resume.company.trim() || inferJdCompany(resume.jd);
  const title = resume.targetTitle.trim() || inferJdTitle(resume.jd) || "the open role";
  const city = [resume.city, resume.country].filter(Boolean).join(", ");
  const latest = realJobs(resume)[0];
  const proof = realBullets(resume).slice(0, 2);
  const skills = matchedSkills(resume, board).slice(0, 5);
  const name = resume.fullName.trim() || "Your Name";
  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const opener = company
    ? `I am writing to apply for the ${title} position at ${company}.`
    : `I am writing to apply for the ${title} position.`;
  const middle = resume.summary.trim()
    ? resume.summary.trim()
    : latest
      ? `Most recently I worked as ${latest.title} at ${latest.company}.`
      : "";
  const proofLine = proof.length
    ? proof.map((b) => b.replace(/\.$/, "")).join("; ") + "."
    : "";
  const skillLine = skills.length ? `Relevant tools I have used include ${skills.join(", ")}.` : "";

  const paras = [opener, [middle, proofLine].filter(Boolean).join(" "), skillLine, "I would welcome the opportunity to discuss this role."]
    .map((p) => p.trim())
    .filter(Boolean);

  return [
    [city, date].filter(Boolean).join("  ·  "),
    "",
    "Hiring Manager",
    ...(company ? [company] : []),
    "",
    "Dear Hiring Manager,",
    "",
    paras.join("\n\n"),
    "",
    "Sincerely,",
    name,
    [resume.phone, resume.email].filter(Boolean).join("  ·  "),
  ]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function applyEmail(resume: AtsResume): { subject: string; body: string } {
  const title = resume.targetTitle.trim() || inferJdTitle(resume.jd) || "the open role";
  const company = resume.company.trim() || inferJdCompany(resume.jd);
  const name = resume.fullName.trim() || "Your Name";
  const proof = realBullets(resume)[0];
  const subject = company ? `${title}, ${company} — ${name}` : `${title} — ${name}`;
  const body = [
    company ? `Hello,` : "Hello,",
    "",
    company
      ? `Please find my resume attached for the ${title} role at ${company}.`
      : `Please find my resume attached for the ${title} role.`,
    proof || resume.summary.trim() || "",
    "",
    "Thank you for your time.",
    "",
    name,
    [resume.phone, resume.email].filter(Boolean).join("  ·  "),
  ]
    .filter((l, i, arr) => !(l === "" && arr[i - 1] === ""))
    .join("\n")
    .trim();
  return { subject, body };
}

function linkedinBlock(resume: AtsResume, board: KeywordBoard): { headline: string; about: string } {
  const title = resume.targetTitle.trim() || realJobs(resume)[0]?.title || "Professional";
  const skills = (board.inResume.length ? board.inResume : skillsOf(resume)).slice(0, 3);
  const loc = [resume.city, resume.country].filter(Boolean).join(", ");
  const headline = [title, skills.join(" · "), loc].filter(Boolean).join(" | ").slice(0, 220);
  const about = [resume.summary.trim() || `${title}${loc ? ` based in ${loc}` : ""}.`, skills.length ? `Tools: ${skills.join(", ")}.` : ""]
    .filter(Boolean)
    .join("\n\n");
  return { headline, about };
}

function confirmFacts(resume: AtsResume, board: KeywordBoard): string[] {
  const out: string[] = [];
  for (const a of bulletAdvice(resume)) {
    if (a.truth === "SUGGESTED" && a.improved !== a.original) {
      out.push(`SUGGESTED wording (not yet in the file): “${a.improved}”`);
    }
    if (a.resultMissing) {
      out.push(`Result/impact not provided — verify before use: “${a.original}”. Possible metrics: ${a.metricHints.slice(0, 4).join(", ")}.`);
    }
  }
  for (const k of board.inResume) {
    const inBullet = realBullets(resume).some((b) => semanticHit(b, k) !== "none");
    if (!inBullet) out.push(`${k} is listed as a skill but never appears in a bullet. Add proof or drop it.`);
  }
  if (out.length === 0 && realBullets(resume).length) out.push("Bullets already have verbs. Only add a number if you can defend it in an interview.");
  return out.slice(0, 12);
}

function nextQuestions(resume: AtsResume): string[] {
  const q: string[] = [];
  if (!resume.fullName.trim()) q.push("Full name?");
  if (!resume.email.trim()) q.push("Email?");
  if (!resume.phone.trim()) q.push("Phone?");
  if (!resume.city.trim()) q.push("City?");
  if (!resume.targetTitle.trim()) q.push("Target job title?");
  if (!resume.jd.trim()) q.push("Paste the JD, or NONE.");
  if (!realJobs(resume).length && !resume.projects.some((p) => p.name.trim())) q.push("Add a job, internship, or project.");
  if (!resume.education.some((e) => e.degree.trim() && e.school.trim())) q.push("Degree and university?");
  if (skillsOf(resume).length < 8) q.push("List skills you actually have.");
  if (!resume.summary.trim()) q.push("Write a 2–4 sentence summary.");
  return q.slice(0, 8);
}

function indiaNotes(resume: AtsResume): string[] {
  const india = resume.market === "naukri" || /india/i.test(resume.country) || /^\+91/.test(resume.phone.trim());
  if (resume.market === "us") return ["City, ST. No photo or family fields."];
  if (resume.market === "international" && !india) return ["City, Country. No extra personal fields."];
  const notes: string[] = [];
  if (india) {
    notes.push("+91 · City, State IN.");
    if (resume.phone.trim() && !/^\+91/.test(resume.phone.trim())) notes.push("Add +91 to the phone.");
  }
  if (resume.market === "naukri") notes.push("Plain DOCX/PDF, under 2 MB.");
  if (resume.market === "campus") notes.push("One page. Lead with projects or internships.");
  if (resume.market === "government") notes.push("Photo and DOB stay off this file.");
  return notes;
}

function recruiterNotes(resume: AtsResume, score: CherryScore): { ats: string[]; human: string[] } {
  const years = yearsWorked(resume);
  const intel = analyzeJd(resume);
  const stage = detectStage(resume, intel);
  return {
    ats: [
      score.layout === "PASS" ? "Parser-safe layout." : "Fix dates or email before download.",
      noJd(resume) ? "No JD — not a match score." : "One proof bullet per keyword is enough.",
    ],
    human: [
      "Name, title, latest role, first bullet.",
      stageStrategy(stage)[0] ?? "",
      years !== null && years >= 8 ? "Two pages max." : "One page.",
    ].filter(Boolean),
  };
}

function whatChanged(_resume: AtsResume, tailor: JdTailor | null): string[] {
  if (!tailor) return ["Paste a JD, then Tailor."];
  const lines: string[] = [];
  if (tailor.promoted.length) lines.push(`Reordered: ${tailor.promoted.slice(0, 8).join(", ")}.`);
  if (tailor.added.length) lines.push(`Added: ${tailor.added.join(", ")}.`);
  if (tailor.skipped.length) lines.push(`Left out: ${tailor.skipped.slice(0, 10).join(", ")}.`);
  if (!lines.length) lines.push("No skill changes yet.");
  return lines;
}

export function buildCherryKit(resume: AtsResume, tailor: JdTailor | null): CherryKit {
  const intel = analyzeJd(resume);
  const board = keywordBoard(resume);
  const score = cherryScore(resume);
  const stage = detectStage(resume, intel);
  const company = resume.company.trim() || inferJdCompany(resume.jd) || "—";
  const role = resume.targetTitle.trim() || inferJdTitle(resume.jd) || "—";
  const meta = versionMeta(resume);
  const apply = applyRecommendation(resume);
  const changelog = tailor
    ? [
        tailor.added.length ? `Added: ${tailor.added.join(", ")}` : "No new skills.",
        tailor.skipped.length ? `Excluded: ${tailor.skipped.slice(0, 12).join(", ")}` : "",
      ].filter(Boolean)
    : [];
  return {
    score,
    board,
    intel,
    gap: gapAnalysis(resume, intel),
    timeline: timelineNotes(resume),
    bullets: bulletAdvice(resume),
    transferable: transferableNotes(resume, intel),
    stage,
    stageNotes: stageStrategy(stage),
    titles: titlePair(resume, intel),
    input: inputQuality(resume),
    why: whyThisCandidate(resume, intel),
    objections: objections(resume, intel),
    qa: runQa(resume, intel),
    plan: actionPlan(resume, intel),
    stuffing: stuffingFlags(resume),
    version: meta,
    noJd: noJd(resume),
    inferred: inferredRoleCompetencies(resume),
    changed: whatChanged(resume, tailor),
    recruiter: recruiterNotes(resume, score),
    coverLetter: coverLetter(resume, board),
    applyEmail: applyEmail(resume),
    linkedin: linkedinBlock(resume, board),
    tracker: {
      company,
      role,
      stage: apply.rec === "Do not apply" ? "Blocked on conflicts" : apply.rec === "Apply with caveat" ? "Ready with caveat" : "Ready to apply",
      followUp: plusDays(7),
      filename: `${kitFilename(resume)}.docx`,
    },
    interview: interviewIntel(resume, intel),
    india: indiaNotes(resume),
    confirm: confirmFacts(resume, board),
    next: nextQuestions(resume),
    apply,
    changelog,
    embellishment: embellishmentFlags(resume),
    keywordKinds: {
      acronyms: intel.terms.filter((t) => t.kind === "acronym").map((t) => t.text).slice(0, 8),
      synonyms: intel.terms.filter((t) => t.match === "semantic").map((t) => t.text).slice(0, 8),
      related: intel.terms.filter((t) => t.kind === "related" || t.kind === "business").map((t) => t.text).slice(0, 8),
    },
  };
}

export function kitPlainText(kit: CherryKit): string {
  const lines: string[] = [
    "CHERRYRESUME KIT",
    "",
    "### CherryScore",
    kit.score.disclaimer,
    `Apply recommendation: ${kit.apply.rec} — ${kit.apply.why}`,
    `Overall ${kit.score.overall}/100 · ATS risk ${kit.score.risk}`,
    `Parse safety ${kit.score.parseSafety} · JD match ${kit.score.jdMatchNa ? "n/a" : kit.score.jdMatch} · Experience ${kit.score.experience}`,
    `Content ${kit.score.content} · Recruiter scan ${kit.score.scan} · Truth ${kit.score.truth}`,
    "",
    "### JD intelligence",
    `Title ${kit.intel.title || "—"} · Seniority ${kit.intel.seniority} · ${kit.intel.department || "Dept —"} · ${kit.intel.industry || "Industry —"}`,
    `P0 ${kit.intel.p0.join(", ") || "—"}`,
    `Clusters: ${kit.intel.clusters.join(" · ") || "—"}`,
    "",
    "### Gap analysis",
    `Strong: ${kit.gap.strong.join(", ") || "—"}`,
    `Partial: ${kit.gap.partial.join(", ") || "—"}`,
    `Missing: ${kit.gap.missing.join(", ") || "—"}`,
    `Risky: ${kit.gap.risky.join("; ") || "—"}`,
    ...kit.gap.improvements.map((l) => `- ${l}`),
    "",
    "### Keyword Board",
    `Required: ${kit.board.required.join(", ") || "—"}`,
    `Preferred: ${kit.board.preferred.join(", ") || "—"}`,
    `Tools: ${kit.board.tools.join(", ") || "—"}`,
    `In resume: ${kit.board.inResume.join(", ") || "—"}`,
    `Missing: ${kit.board.missing.join(", ") || "—"}`,
    `Do not add: ${kit.board.doNotAdd.join(", ") || "—"}`,
    "",
    "### Changelog",
    ...kit.changelog.map((l) => `- ${l}`),
    "",
    "### What Changed",
    ...kit.changed.map((l) => `- ${l}`),
    "",
    "### Recruiter",
    "ATS:",
    ...kit.recruiter.ats.map((l) => `- ${l}`),
    "Human:",
    ...kit.recruiter.human.map((l) => `- ${l}`),
    "",
    "### Cover Letter",
    kit.coverLetter,
    "",
    "### Apply Email",
    `Subject: ${kit.applyEmail.subject}`,
    kit.applyEmail.body,
    "",
    "### LinkedIn",
    kit.linkedin.headline,
    "",
    kit.linkedin.about,
    "",
    "### Job Tracker Card",
    `${kit.tracker.company} · ${kit.tracker.role} · ${kit.tracker.stage} · follow-up ${kit.tracker.followUp} · ${kit.tracker.filename}`,
    "",
    "### Career stage",
    kit.stage,
    ...kit.stageNotes.map((l) => `- ${l}`),
    "",
    "### Titles",
    `Official: ${kit.titles.official || "—"}`,
    `Target: ${kit.titles.target || "—"}`,
    kit.titles.note,
    "",
    "### Why this candidate",
    ...kit.why.map((l) => `- ${l}`),
    "",
    "### Objections",
    ...kit.objections.flatMap((o) => [`- ${o.concern}`, `  Reduce: ${o.reduce}`]),
    "",
    "### Input quality",
    kit.input.grade,
    ...kit.input.conflicts.map((c) => `- CONFLICT: ${c}`),
    "",
    "### QA",
    ...kit.qa.map((q) => `${q.pass ? "PASS" : "FAIL"} [${q.area}] ${q.item}${q.fix ? ` — ${q.fix}` : ""}`),
    "",
    "### Top 5 before applying",
    ...kit.plan.map((p, i) => `${i + 1}. ${p.text} — ${p.impact} impact / ${p.effort} effort`),
    "",
    "### Version",
    `${kit.version.id} · ${kit.version.role} · ${kit.version.company} · ${kit.version.market} · ${kit.version.date}`,
    "",
    "### Interview Prep",
    ...kit.interview.flatMap((i) => [`[${i.category}] ${i.q}`, `Why: ${i.why}`, `Evidence: ${i.evidence}`, `Do not claim: ${i.doNotClaim}`, ""]),
    "### Confirm These Facts",
    ...kit.confirm.map((l) => `- ${l}`),
    "",
    "### Next Questions",
    ...kit.next.map((l) => `- ${l}`),
    "",
    "### India notes",
    ...(kit.india.length ? kit.india.map((l) => `- ${l}`) : ["—"]),
    "",
  ];
  return `${lines.filter((l, i, arr) => l !== "" || arr[i - 1] !== "").join("\n").trim()}\n`;
}

