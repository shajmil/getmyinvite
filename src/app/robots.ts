import { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteUrl;
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/templates", "/[slug]"],
      disallow: ["/api/", "/dashboard/", "/sign-in", "/sign-up", "/test-templates"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
