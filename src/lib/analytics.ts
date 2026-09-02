export function trackPagePreset(preset: string, capBytes?: number) {
  if (typeof window === "undefined") return;
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  gtag?.("event", "page_preset", {
    page_preset: preset,
    cap_bytes: typeof capBytes === "number" ? capBytes : 0,
  });
}
