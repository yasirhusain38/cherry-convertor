export function GET() {
  return new Response("google-site-verification: google7398d1016b8afa7a.html\n", {
    headers: {
      "Content-Type": "text/html; charset=UTF-8",
      "Cache-Control": "no-store",
    },
  });
}
