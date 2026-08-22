import type { MetadataRoute } from "next";
import { COUNTRIES } from "@/data/countries";
import { FINANCE_TOOLS } from "@/data/finance-tools";
import { REGIONS } from "@/data/regions";
import { absoluteUrl } from "@/lib/site";
import { TOOLS } from "@/lib/tools";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes = ["", "/tools", "/countries", "/regions", "/finance", "/about", "/privacy", "/contact", "/blog"].map(
    (path) => ({
      url: absoluteUrl(path || "/"),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : path === "/countries" || path === "/regions" ? 0.8 : 0.7,
    }),
  );

  const toolRoutes = TOOLS.map((tool) => ({
    url: absoluteUrl(`/tools/${tool.slug}`),
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority:
      tool.slug.includes("50kb") ||
      tool.slug === "compress-image" ||
      tool.slug.startsWith("us-") ||
      tool.slug.includes("compress-pdf")
        ? 0.9
        : 0.8,
  }));

  const countryRoutes = COUNTRIES.map((country) => ({
    url: absoluteUrl(`/countries/${country.slug}`),
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

  const regionRoutes = REGIONS.map((region) => ({
    url: absoluteUrl(`/regions/${region.slug}`),
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.82,
  }));

  const financeRoutes = FINANCE_TOOLS.map((tool) => ({
    url: absoluteUrl(`/finance/${tool.slug}`),
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.86,
  }));

  return [...staticRoutes, ...toolRoutes, ...countryRoutes, ...regionRoutes, ...financeRoutes];
}
