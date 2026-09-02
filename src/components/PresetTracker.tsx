"use client";

import { useEffect } from "react";
import { trackPagePreset } from "@/lib/analytics";

export function PresetTracker({ slug, capBytes }: { slug: string; capBytes?: number }) {
  useEffect(() => {
    trackPagePreset(slug, capBytes);
  }, [slug, capBytes]);
  return null;
}
