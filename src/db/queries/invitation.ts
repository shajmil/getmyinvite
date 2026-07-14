import { eq, and, desc, inArray, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  invitations,
  invitationContent,
  rsvps,
  assets,
} from "@/db/schema";
import { InvitationData } from "@/lib/zod-schemas";
import { cache } from "react";
import fs from "fs";
import path from "path";
import { del } from "@vercel/blob";

// ==========================================
// ASSET CLEANUP HELPERS
// ==========================================

function extractUploadUrls(content: any): string[] {
  const urls: string[] = [];

  const traverse = (obj: any) => {
    if (!obj) return;
    if (typeof obj === "string") {
      if (
        obj.startsWith("/uploads/assets/") ||
        obj.includes(".public.blob.vercel-storage.com/") ||
        (process.env.R2_PUBLIC_URL && obj.startsWith(process.env.R2_PUBLIC_URL))
      ) {
        urls.push(obj);
      }
    } else if (Array.isArray(obj)) {
      obj.forEach(traverse);
    } else if (typeof obj === "object") {
      Object.values(obj).forEach(traverse);
    }
  };

  traverse(content);
  return urls;
}

export async function deleteAsset(url: string) {
  try {
    // 1. Local filesystem cleanup
    if (url.startsWith("/uploads/")) {
      const relativePath = url.replace(/^\/uploads\//, "");
      const fullPath = path.join(process.cwd(), "public", "uploads", relativePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log(`Deleted local asset: ${fullPath}`);
      }
    }

    // 2. Vercel Blob cleanup
    if (url.includes(".public.blob.vercel-storage.com/")) {
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        await del(url);
        console.log(`Deleted Vercel Blob asset: ${url}`);
      }
    }

    // 3. Cloudflare R2 cleanup
    if (process.env.R2_PUBLIC_URL && url.startsWith(process.env.R2_PUBLIC_URL)) {
      const key = url.replace(process.env.R2_PUBLIC_URL + "/", "");
      const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");
      const s3 = new S3Client({
        region: "auto",
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID!,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        },
      });
      await s3.send(new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
      }));
      console.log(`Deleted R2 asset: ${key}`);
    }
  } catch (err) {
    console.error(`Failed to delete asset ${url}:`, err);
  }
}

export async function deleteInvitationsByIds(ids: string[]) {
  if (ids.length === 0) return;

  try {
    // 1. Fetch content for asset extraction
    const contents = await db
      .select()
      .from(invitationContent)
      .where(inArray(invitationContent.invitationId, ids));

    // 2. Extract and delete assets
    for (const item of contents) {
      if (item.content) {
        const urls = extractUploadUrls(item.content);
        for (const url of urls) {
          deleteAsset(url).catch((e) => console.error("Asset deletion error:", e));
        }
      }
    }

    // 3. Delete records from invitations (cascade deletes invitationContent & rsvps)
    await db.delete(invitations).where(inArray(invitations.id, ids));
  } catch (err) {
    console.error("deleteInvitationsByIds query error:", err);
  }
}

// ==========================================
// INVITATION QUERIES
// ==========================================

export async function getInvitationById(id: string, userId: string) {
  const result = await db
    .select({
      invitation: invitations,
      content: invitationContent.content,
    })
    .from(invitations)
    .leftJoin(invitationContent, eq(invitationContent.invitationId, invitations.id))
    .where(and(eq(invitations.id, id), eq(invitations.userId, userId)))
    .limit(1);

  if (result.length === 0) return null;

  return {
    ...result[0].invitation,
    content: result[0].content as InvitationData | undefined,
  };
}

export async function getInvitationBySlug(slug: string) {
  const result = await db
    .select({
      invitation: invitations,
      content: invitationContent.content,
    })
    .from(invitations)
    .leftJoin(invitationContent, eq(invitationContent.invitationId, invitations.id))
    .where(and(eq(invitations.slug, slug), eq(invitations.status, "published")))
    .limit(1);

  if (result.length === 0) return null;

  return {
    ...result[0].invitation,
    content: result[0].content as InvitationData,
  };
}

// React cache wrapper to deduplicate server component and generateMetadata requests
export const getCachedInvitationBySlug = cache(async (slug: string) => {
  return await getInvitationBySlug(slug);
});

export async function checkSlugAvailable(slug: string, excludeInvitationId?: string) {
  const query = db.select().from(invitations).where(eq(invitations.slug, slug));
  const results = await query;
  if (results.length === 0) return true;
  if (excludeInvitationId && results[0].id === excludeInvitationId) return true;
  return false;
}

export async function getInvitationsByUser(userId: string) {
  // Automatically clean up drafts older than 7 days and past wedding events on dashboard load
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // 1. Fetch expired drafts and delete them with assets
    const expiredDrafts = await db
      .select({ id: invitations.id })
      .from(invitations)
      .where(
        and(
          eq(invitations.status, "draft"),
          lt(invitations.createdAt, sevenDaysAgo)
        )
      );

    if (expiredDrafts.length > 0) {
      const draftIds = expiredDrafts.map((d) => d.id);
      await deleteInvitationsByIds(draftIds);
    }

    // 2. Fetch invitations where the wedding date has passed by more than 7 days and delete them with assets
    const expiredList = await db
      .select({ id: invitationContent.invitationId })
      .from(invitationContent)
      .where(
        sql`to_date(content->'wedding'->>'date', 'YYYY-MM-DD') < CURRENT_DATE - 7`
      );

    if (expiredList.length > 0) {
      const expiredIds = expiredList.map((item) => item.id);
      await deleteInvitationsByIds(expiredIds);
    }
  } catch (err) {
    console.error("Dashboard cleanup drafts and past weddings error:", err);
  }

  const list = await db
    .select({
      invitation: invitations,
      content: invitationContent.content,
    })
    .from(invitations)
    .leftJoin(invitationContent, eq(invitationContent.invitationId, invitations.id))
    .where(eq(invitations.userId, userId))
    .orderBy(desc(invitations.createdAt));

  if (list.length === 0) return [];

  const invitationIds = list.map((item) => item.invitation.id);

  // Fetch RSVPs in a single query instead of N queries
  const allRsvps = await db
    .select()
    .from(rsvps)
    .where(inArray(rsvps.invitationId, invitationIds));

  // Count guests in memory
  const rsvpCounts: Record<string, number> = {};
  allRsvps.forEach((rsvp) => {
    const invId = rsvp.invitationId;
    rsvpCounts[invId] = (rsvpCounts[invId] || 0) + (rsvp.guestCount || 1);
  });

  return list.map((item) => ({
    ...item.invitation,
    content: item.content as InvitationData | undefined,
    rsvpCount: rsvpCounts[item.invitation.id] || 0,
  }));
}

export async function createInvitation(
  id: string,
  userId: string,
  slug: string,
  templateId: string,
  colorSchemeId: string,
  content: InvitationData
) {
  return await db.transaction(async (tx: any) => {
    await tx.insert(invitations).values({
      id,
      userId,
      slug,
      templateId,
      colorSchemeId,
      status: "draft",
    });

    await tx.insert(invitationContent).values({
      invitationId: id,
      content,
    });

    return id;
  });
}

export async function updateInvitationContent(id: string, userId: string, content: InvitationData) {
  // Validate ownership first
  const inv = await db
    .select()
    .from(invitations)
    .where(and(eq(invitations.id, id), eq(invitations.userId, userId)))
    .limit(1);

  if (inv.length === 0) {
    throw new Error("Invitation not found or unauthorized");
  }

  await db
    .insert(invitationContent)
    .values({ invitationId: id, content })
    .onConflictDoUpdate({
      target: invitationContent.invitationId,
      set: { content },
    });

  await db
    .update(invitations)
    .set({ updatedAt: new Date() })
    .where(eq(invitations.id, id));

  return true;
}

export async function updateInvitationSettings(
  id: string,
  userId: string,
  data: { slug?: string; templateId?: string; colorSchemeId?: string; status?: "draft" | "published"; publishedAt?: Date; privacy?: "public" | "unlisted" }
) {
  // Validate ownership first
  const inv = await db
    .select()
    .from(invitations)
    .where(and(eq(invitations.id, id), eq(invitations.userId, userId)))
    .limit(1);

  if (inv.length === 0) {
    throw new Error("Invitation not found or unauthorized");
  }

  await db
    .update(invitations)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(invitations.id, id));

  return true;
}

export async function deleteInvitation(id: string, userId: string) {
  const inv = await db
    .select()
    .from(invitations)
    .where(and(eq(invitations.id, id), eq(invitations.userId, userId)))
    .limit(1);

  if (inv.length === 0) {
    throw new Error("Invitation not found or unauthorized");
  }

  await deleteInvitationsByIds([id]);
  return true;
}

// ==========================================
// RSVP QUERIES
// ==========================================

export async function getRSVPsForInvitation(invitationId: string, userId: string) {
  // Check ownership of the invitation first
  const inv = await db
    .select()
    .from(invitations)
    .where(and(eq(invitations.id, invitationId), eq(invitations.userId, userId)))
    .limit(1);

  if (inv.length === 0) {
    throw new Error("Invitation not found or unauthorized");
  }

  return await db
    .select()
    .from(rsvps)
    .where(eq(rsvps.invitationId, invitationId))
    .orderBy(desc(rsvps.createdAt));
}

export async function createRSVP(
  id: string,
  invitationId: string,
  data: {
    guestName: string;
    email?: string;
    phone?: string;
    attending: "yes" | "no" | "maybe";
    guestCount: number;
    mealChoice?: string;
    message?: string;
  }
) {
  await db.insert(rsvps).values({
    id,
    invitationId,
    ...data,
  });
  return id;
}

// ==========================================
// ASSET QUERIES
// ==========================================

export async function getAssetsByUser(userId: string) {
  return await db
    .select()
    .from(assets)
    .where(eq(assets.userId, userId))
    .orderBy(desc(assets.createdAt));
}

export async function createAsset(
  id: string,
  userId: string,
  data: {
    invitationId?: string;
    r2Key: string;
    url: string;
    width?: number;
    height?: number;
    sizeBytes: number;
  }
) {
  await db.insert(assets).values({
    id,
    userId,
    ...data,
  });
  return id;
}
