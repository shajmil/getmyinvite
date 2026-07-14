import { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { invitations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { siteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteUrl;

  // Fetch all published invitation paths to index in Google Search Console
  let invitationRoutes: MetadataRoute.Sitemap = [];
  try {
    const activeInvites = await db
      .select({ slug: invitations.slug, updatedAt: invitations.updatedAt })
      .from(invitations)
      .where(
        and(
          eq(invitations.status, "published"),
          eq(invitations.privacy, "public")
        )
      );

    invitationRoutes = activeInvites.map((inv) => ({
      url: `${baseUrl}/${inv.slug}`,
      lastModified: inv.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch (err) {
    console.error("Sitemap generation error:", err);
  }

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/templates`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/kerala-wedding-invitation-website`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/malayalam-wedding-invitation-online`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/free-wedding-rsvp-website-india`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...invitationRoutes,
  ];
}
