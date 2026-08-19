import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";
import { TOOLS } from "@/lib/tools";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes = ["", "/tools", "/about", "/privacy", "/contact", "/blog"].map(
    (path) => ({
      url: absoluteUrl(path || "/"),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.7,
    }),
  );

  const toolRoutes = TOOLS.map((tool) => ({
    url: absoluteUrl(`/tools/${tool.slug}`),
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: tool.slug.includes("50kb") || tool.slug === "compress-image" ? 0.9 : 0.8,
  }));

  return [...staticRoutes, ...toolRoutes];
}
