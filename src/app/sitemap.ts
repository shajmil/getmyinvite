import { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { invitations } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://getmyinvite.in";

  // Fetch all published invitation paths to index in Google Search Console
  let invitationRoutes: MetadataRoute.Sitemap = [];
  try {
    const activeInvites = await db
      .select({ slug: invitations.slug, updatedAt: invitations.updatedAt })
      .from(invitations)
      .where(eq(invitations.status, "published"));

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
    ...invitationRoutes,
  ];
}
