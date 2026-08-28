import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;
export const dynamic = "force-dynamic";

const MODEL = "grok-imagine-image-2.0";

const FORENSIC_PROMPT = `You are doing forensic-quality visible watermark and overlay removal.
HINT: SURGICAL — remove only the bottom-right Gemini sparkle or Grok logo, including glow and shadow. Touch nothing else.
Rebuild the exact surface under the mark. Match light, color, grain, sharpness, pattern, perspective, and reflections. If the mark sat on text or a hard edge, rebuild that text/edge. No blur patch, halo, leftover letters, sparkle arms, or melted detail. Do not restyle, crop, recolor, or add objects.`;

const VERIFY_PROMPT = `Second pass. Faint star-arm, glow, or letter ghost still visible bottom-right. Remove remnant and match grain. Do not touch the rest.`;

type EditResponse = {
  data?: Array<{ url?: string; b64_json?: string; b64Json?: string }>;
  url?: string;
  image?: { url?: string; base64?: string };
};

async function asDataUrl(value: string): Promise<string> {
  if (value.startsWith("data:")) return value;
  const res = await fetch(value);
  if (!res.ok) throw new Error("Could not download the healed image.");
  const buf = Buffer.from(await res.arrayBuffer());
  const mime = res.headers.get("content-type") || "image/png";
  return `data:${mime};base64,${buf.toString("base64")}`;
}

export async function POST(request: Request) {
  const key = process.env.XAI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { ok: false, error: "Set XAI_API_KEY to enable Grok Imagine AI heal." },
      { status: 501 },
    );
  }

  let body: { image?: string; prompt?: string; pass?: "remove" | "verify" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }
  if (!body.image || typeof body.image !== "string") {
    return NextResponse.json({ ok: false, error: "Missing image." }, { status: 400 });
  }

  try {
    const res = await fetch("https://api.x.ai/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        prompt: body.prompt?.trim() || (body.pass === "verify" ? VERIFY_PROMPT : FORENSIC_PROMPT),
        image: { url: body.image, type: "image_url" },
      }),
    });
    const json = (await res.json()) as EditResponse & { error?: { message?: string } | string };
    if (!res.ok) {
      const message =
        typeof json.error === "string"
          ? json.error
          : json.error?.message ?? `Imagine API ${res.status}`;
      return NextResponse.json({ ok: false, error: message }, { status: 502 });
    }
    const first = json.data?.[0];
    const raw =
      first?.b64_json ??
      first?.b64Json ??
      first?.url ??
      json.url ??
      json.image?.base64 ??
      json.image?.url;
    if (!raw) {
      return NextResponse.json({ ok: false, error: "Imagine returned no image." }, { status: 502 });
    }
    const dataUrl = raw.startsWith("http")
      ? await asDataUrl(raw)
      : raw.startsWith("data:")
        ? raw
        : `data:image/png;base64,${raw}`;
    return NextResponse.json({ ok: true, image: dataUrl, model: MODEL });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Heal failed." },
      { status: 500 },
    );
  }
}
