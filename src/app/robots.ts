import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://getmyinvite.in";
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/templates", "/[slug]"],
      disallow: ["/api/", "/dashboard/", "/sign-in", "/sign-up", "/test-templates"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
