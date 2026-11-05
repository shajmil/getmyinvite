import { eq, and, desc, inArray, notInArray, asc } from "drizzle-orm";
import { getDb } from "@/lib/db";
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
import { isInvitationExpired } from "@/lib/invitation-expiry";

// ==========================================
// ASSET CLEANUP HELPERS
// ==========================================

function extractUploadUrls(content: unknown): string[] {
  const urls: string[] = [];

  const traverse = (obj: unknown) => {
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
  return [...new Set(urls)];
}

function getAssetIdentity(url: string): string {
  if (url.startsWith("/uploads/")) return `blob:${url.slice("/uploads/".length)}`;
  if (url.includes(".public.blob.vercel-storage.com/")) {
    return `blob:${new URL(url).pathname.slice(1)}`;
  }
  return url;
}

export async function deleteAsset(url: string) {
  try {
    // 1. Local filesystem cleanup
    if (url.startsWith("/uploads/")) {
      const relativePath = url.replace(/^\/uploads\//, "");
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        await del(relativePath);
        return;
      }
      const uploadsDirectory = path.resolve(process.cwd(), "public", "uploads");
      const fullPath = path.resolve(uploadsDirectory, relativePath);
      if (!fullPath.startsWith(uploadsDirectory + path.sep)) {
        throw new Error("Invalid upload path");
      }
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log(`Deleted local asset: ${fullPath}`);
      }
    }

    // 2. Vercel Blob cleanup
    if (url.includes(".public.blob.vercel-storage.com/")) {
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        throw new Error("Blob token is required to delete this asset");
      }
      await del(url);
      console.log(`Deleted Vercel Blob asset: ${url}`);
    }

    // 3. Cloudflare R2 cleanup
    if (process.env.R2_PUBLIC_URL && url.startsWith(process.env.R2_PUBLIC_URL)) {
      const key = url.replace(process.env.R2_PUBLIC_URL + "/", "");
      if (!key.startsWith("assets/") || key.split("/").some((segment) => segment === "." || segment === "..")) {
        throw new Error("Only uploaded assets can be deleted");
      }
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
    throw err;
  }
}

export async function deleteInvitationsByIds(ids: string[], database: Pick<ReturnType<typeof getDb>, "select" | "delete"> = getDb()) {
  if (ids.length === 0) return;

  try {
    // 1. Fetch content for asset extraction
    const contents = await database
      .select()
      .from(invitationContent)
      .where(inArray(invitationContent.invitationId, ids));

    const otherContents = await database.select({ content: invitationContent.content })
      .from(invitationContent)
      .where(notInArray(invitationContent.invitationId, ids));
    const sharedUrls = new Set(otherContents.flatMap((item) => extractUploadUrls(item.content).map(getAssetIdentity)));

    // 2. Extract and delete assets
    for (const item of contents) {
      if (item.content) {
        const urls = extractUploadUrls(item.content);
        for (const url of urls) {
          if (sharedUrls.has(getAssetIdentity(url))) continue;
          await deleteAsset(url);
        }
      }
    }

    // 3. Delete records from invitations (cascade deletes invitationContent & rsvps)
    await database.delete(assets).where(inArray(assets.invitationId, ids));
    await database.delete(invitations).where(inArray(invitations.id, ids));
  } catch (err) {
    console.error("deleteInvitationsByIds query error:", err);
    throw err;
  }
}

// ==========================================
// INVITATION QUERIES
// ==========================================

export async function cleanupExpiredInvitations(now = new Date()) {
  const candidates = await getDb().select({
    id: invitations.id,
    status: invitations.status,
    createdAt: invitations.createdAt,
    content: invitationContent.content,
  }).from(invitations)
    .leftJoin(invitationContent, eq(invitationContent.invitationId, invitations.id))
    .orderBy(asc(invitations.createdAt));
  const expired = candidates.filter((invitation) => isInvitationExpired(invitation, now));
  const deletedSlugs: string[] = [];
  let failed = 0;
  let processed = 0;
  const deadline = Date.now() + 180_000;

  for (const candidate of expired) {
    if (Date.now() >= deadline) break;
    processed++;
    try {
      const deletedSlug = await getDb().transaction(async (transaction) => {
        // Lock and recheck: an invitation may have been rescheduled since the initial scan.
        const [current] = await transaction.select({
          id: invitations.id,
          slug: invitations.slug,
          status: invitations.status,
          createdAt: invitations.createdAt,
          content: invitationContent.content,
        }).from(invitations)
          .innerJoin(invitationContent, eq(invitationContent.invitationId, invitations.id))
          .where(eq(invitations.id, candidate.id))
          .limit(1).for("update", { skipLocked: true });
        if (!current || !isInvitationExpired(current, now)) return null;
        await deleteInvitationsByIds([current.id], transaction);
        return current.slug;
      });
      if (deletedSlug) deletedSlugs.push(deletedSlug);
    } catch (error) {
      failed++;
      console.error("Invitation cleanup failed; retained for retry:", candidate.id, error);
    }
  }

  return { deletedSlugs, failed, remaining: expired.length - processed };
}

export async function getInvitationById(id: string, userId: string) {
  const result = await getDb()
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
  const result = await getDb()
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
  const query = getDb().select().from(invitations).where(eq(invitations.slug, slug));
  const results = await query;
  if (results.length === 0) return true;
  if (excludeInvitationId && results[0].id === excludeInvitationId) return true;
  return false;
}

export async function getInvitationsByUser(userId: string) {
  const list = await getDb()
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
  const allRsvps = await getDb()
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
  return await getDb().transaction(async (tx: any) => {
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
  const inv = await getDb()
    .select()
    .from(invitations)
    .where(and(eq(invitations.id, id), eq(invitations.userId, userId)))
    .limit(1);

  if (inv.length === 0) {
    throw new Error("Invitation not found or unauthorized");
  }

  await getDb()
    .insert(invitationContent)
    .values({ invitationId: id, content })
    .onConflictDoUpdate({
      target: invitationContent.invitationId,
      set: { content },
    });

  await getDb()
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
  const inv = await getDb()
    .select()
    .from(invitations)
    .where(and(eq(invitations.id, id), eq(invitations.userId, userId)))
    .limit(1);

  if (inv.length === 0) {
    throw new Error("Invitation not found or unauthorized");
  }

  await getDb()
    .update(invitations)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(invitations.id, id));

  return true;
}

export async function deleteInvitation(id: string, userId: string) {
  const inv = await getDb()
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
  const inv = await getDb()
    .select()
    .from(invitations)
    .where(and(eq(invitations.id, invitationId), eq(invitations.userId, userId)))
    .limit(1);

  if (inv.length === 0) {
    throw new Error("Invitation not found or unauthorized");
  }

  return await getDb()
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
  await getDb().insert(rsvps).values({
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
  return await getDb()
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
  await getDb().insert(assets).values({
    id,
    userId,
    ...data,
  });
  return id;
}
