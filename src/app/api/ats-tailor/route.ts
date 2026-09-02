import { NextResponse } from "next/server";
import { atsAiPayload, localJdRewrite, type AtsAiPatch } from "@/lib/ats-ai";
import { emptyResume, type AtsResume } from "@/lib/ats-resume";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const SYSTEM = `You are CherryResume. Rewrite EVERY resume field so the candidate is more likely to be shortlisted for THIS job.

Rewrite: targetTitle (fair equivalent only), company (from JD if missing), summary, technical, tools, domain, every job bullet, every project detail.

RULES:
- Keep the same jobs, companies, dates, and bullet count. Never invent employers or dates.
- Do not invent percentages, revenue, team size, or outcomes that are not already in that bullet.
- You MAY add JD keywords the candidate likely forgot when their work already maps (reports→MIS, Excel dashboards→reporting, SQL extracts→data analysis). Synonyms and same-cluster terms are allowed.
- Do NOT add unrelated tools (do not add Kubernetes to an Excel/MIS resume).
- Put proven JD terms in the summary AND in skills AND in at least one bullet or project.
- Strong verb + work + tool. No I/me/my.
- Skills: comma-separated, max 22, JD terms first.
- Return JSON only.

{"targetTitle":"","company":"","summary":"","technical":"","tools":"","domain":"","jobs":[{"bullets":[""]}],"projects":[{"detail":""}]}`;

function extractJson(text: string): AtsAiPatch {
  const fenced = text.match(/\{[\s\S]*\}/);
  if (!fenced) throw new Error("Model returned no JSON.");
  return JSON.parse(fenced[0]!) as AtsAiPatch;
}

function messageContent(json: unknown): string {
  const j = json as {
    choices?: Array<{ message?: { content?: string } }>;
    output_text?: string;
  };
  return j.choices?.[0]?.message?.content ?? j.output_text ?? "";
}

async function chat(url: string, body: unknown, headers: Record<string, string>) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  const json: unknown = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error("upstream");
  return json;
}

function localPatch(resume: AtsResume): AtsAiPatch {
  const local = localJdRewrite(resume);
  return {
    targetTitle: local.targetTitle,
    company: local.company,
    summary: local.summary,
    technical: local.technical,
    tools: local.tools,
    domain: local.domain,
    jobs: local.jobs.map((j) => ({ bullets: j.bullets })),
    projects: local.projects.map((p) => ({ detail: p.detail })),
  };
}

export async function POST(request: Request) {
  let body: { resume?: Partial<AtsResume> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }
  const resume = { ...emptyResume(), ...body.resume } as AtsResume;
  const jd = resume.jd.trim();
  if ((!jd || /^none$/i.test(jd)) && !resume.targetTitle.trim()) {
    return NextResponse.json({ ok: false, error: "Paste a job description or add a target title." }, { status: 400 });
  }
  if (!resume.fullName.trim() && !resume.summary.trim() && !resume.jobs.some((j) => j.title.trim())) {
    return NextResponse.json({ ok: false, error: "Add your name and at least one job, project, or summary." }, { status: 400 });
  }

  const payload = atsAiPayload({
    ...resume,
    jd: jd && !/^none$/i.test(jd) ? jd : `Target role: ${resume.targetTitle}. Infer likely keywords. Mark extras as related, not invented jobs.`,
  });
  const messages = [
    { role: "system", content: SYSTEM },
    { role: "user", content: JSON.stringify(payload) },
  ];

  const openRouter = process.env.OPENROUTER_API_KEY;
  if (openRouter) {
    try {
      const json = await chat(
        "https://openrouter.ai/api/v1/chat/completions",
        { model: "openai/gpt-4o-mini", temperature: 0.25, messages },
        {
          Authorization: `Bearer ${openRouter}`,
          "HTTP-Referer": "https://www.cherryconverter.com",
          "X-Title": "CherryResume",
        },
      );
      return NextResponse.json({ ok: true, source: "openrouter", patch: extractJson(messageContent(json)) });
    } catch {
      /* next provider */
    }
  }

  const xai = process.env.XAI_API_KEY;
  if (xai) {
    try {
      const json = await chat(
        "https://api.x.ai/v1/chat/completions",
        { model: "grok-4.5", temperature: 0.2, messages },
        { Authorization: `Bearer ${xai}` },
      );
      return NextResponse.json({ ok: true, source: "xai", patch: extractJson(messageContent(json)) });
    } catch {
      /* next */
    }
  }

  try {
    const json = await chat(
      "https://text.pollinations.ai/openai",
      { model: "openai", temperature: 0.2, messages },
      {},
    );
    return NextResponse.json({ ok: true, source: "pollinations", patch: extractJson(messageContent(json)) });
  } catch {
    return NextResponse.json({ ok: true, source: "local", patch: localPatch(resume) });
  }
}
