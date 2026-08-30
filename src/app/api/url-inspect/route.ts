import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { inspectUrl } from "@/lib/url-media/inspect";
import { clientIp, rateLimit } from "@/lib/url-media/limit";

export const dynamic = "force-dynamic";
export const maxDuration = 25;

export async function POST(request: Request) {
  if (!rateLimit(clientIp(request))) {
    return NextResponse.json({ error: "Too many URL checks. Wait a few minutes." }, { status: 429 });
  }
  let url = "";
  try {
    const body = (await request.json()) as { url?: string };
    url = String(body.url ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Send JSON { url }." }, { status: 400 });
  }
  if (!url) return NextResponse.json({ error: "Paste a URL." }, { status: 400 });
  try {
    const result = await inspectUrl(url);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not inspect that URL." },
      { status: 400 },
    );
  }
}
