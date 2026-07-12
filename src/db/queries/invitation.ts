import { eq, and, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  invitations,
  invitationContent,
  rsvps,
  assets,
} from "@/db/schema";
import { InvitationData } from "@/lib/zod-schemas";

// ==========================================
// INVITATION QUERIES
// ==========================================

export async function getInvitationById(id: string, userId: string) {
  const result = await db
    .select()
    .from(invitations)
    .where(and(eq(invitations.id, id), eq(invitations.userId, userId)))
    .limit(1);

  if (result.length === 0) return null;

  const contentResult = await db
    .select()
    .from(invitationContent)
    .where(eq(invitationContent.invitationId, id))
    .limit(1);

  return {
    ...result[0],
    content: contentResult[0]?.content as InvitationData | undefined,
  };
}

export async function getInvitationBySlug(slug: string) {
  const result = await db
    .select()
    .from(invitations)
    .where(and(eq(invitations.slug, slug), eq(invitations.status, "published")))
    .limit(1);

  if (result.length === 0) return null;

  const contentResult = await db
    .select()
    .from(invitationContent)
    .where(eq(invitationContent.invitationId, result[0].id))
    .limit(1);

  return {
    ...result[0],
    content: contentResult[0]?.content as InvitationData,
  };
}

export async function checkSlugAvailable(slug: string, excludeInvitationId?: string) {
  const query = db.select().from(invitations).where(eq(invitations.slug, slug));
  const results = await query;
  if (results.length === 0) return true;
  if (excludeInvitationId && results[0].id === excludeInvitationId) return true;
  return false;
}

export async function getInvitationsByUser(userId: string) {
  const list = await db
    .select()
    .from(invitations)
    .where(eq(invitations.userId, userId))
    .orderBy(desc(invitations.createdAt));

  // Hydrate each invitation with content and RSVP count
  const hydrated = await Promise.all(
    list.map(async (inv: { id: string; userId: string; slug: string; templateId: string; status: "draft" | "published"; colorSchemeId: string; publishedAt: Date | null; createdAt: Date; updatedAt: Date }) => {
      const contentResult = await db
        .select()
        .from(invitationContent)
        .where(eq(invitationContent.invitationId, inv.id))
        .limit(1);

      const rsvpsCount = await db
        .select()
        .from(rsvps)
        .where(eq(rsvps.invitationId, inv.id));

      const totalGuests = rsvpsCount.reduce((acc: number, curr: { guestCount: number }) => acc + (curr.guestCount || 1), 0);

      return {
        ...inv,
        content: contentResult[0]?.content as InvitationData | undefined,
        rsvpCount: totalGuests,
      };
    })
  );

  return hydrated;
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
