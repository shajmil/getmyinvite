import { eq, and, desc, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  invitations,
  invitationContent,
  rsvps,
  assets,
} from "@/db/schema";
import { InvitationData } from "@/lib/zod-schemas";
import { cache } from "react";

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
  data: { slug?: string; templateId?: string; colorSchemeId?: string; status?: "draft" | "published"; publishedAt?: Date }
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

  await db.delete(invitations).where(eq(invitations.id, id));
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
