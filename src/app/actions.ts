"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import * as queries from "@/db/queries/invitation";
import { InvitationData, InvitationSlugSchema } from "@/lib/zod-schemas";

// ==========================================
// SESSION HELPER
// ==========================================
async function getAuthenticatedUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  return session.user;
}

// ==========================================
// SERVER ACTIONS
// ==========================================

export async function saveInvitationDraft(id: string, content: InvitationData) {
  try {
    const user = await getAuthenticatedUser();
    await queries.updateInvitationContent(id, user.id, content);
    
    // Auto-revalidate the cached path if the invitation is already published
    const inv = await queries.getInvitationById(id, user.id);
    if (inv && inv.status === "published") {
      revalidatePath(`/${inv.slug}`);
    }
    
    return { ok: true };
  } catch (err: any) {
    console.error("saveInvitationDraft error:", err);
    return { ok: false, error: err.message || "Failed to save draft" };
  }
}

export async function checkSlugAvailabilityAction(slug: string, invitationId: string) {
  try {
    await getAuthenticatedUser();
    
    // Quick validation check
    const parse = InvitationSlugSchema.safeParse(slug);
    if (!parse.success) {
      return { ok: false, error: parse.error.issues[0]?.message || "Invalid slug" };
    }

    const available = await queries.checkSlugAvailable(slug, invitationId);
    return { ok: true, available };
  } catch (err: any) {
    return { ok: false, error: err.message || "Failed to check slug" };
  }
}

export async function publishInvitation(id: string, slug: string, privacy: "public" | "unlisted" = "public") {
  try {
    const user = await getAuthenticatedUser();

    // 1. Validate slug syntax and blocklist
    const parsedSlug = InvitationSlugSchema.safeParse(slug);
    if (!parsedSlug.success) {
      return { ok: false, error: parsedSlug.error.issues[0]?.message || "Invalid slug" };
    }

    // 2. Validate availability
    const available = await queries.checkSlugAvailable(slug, id);
    if (!available) {
      return { ok: false, error: "Slug is already taken" };
    }

    // 3. Update DB
    await queries.updateInvitationSettings(id, user.id, {
      slug,
      status: "published",
      privacy,
      publishedAt: new Date(),
    });

    // 4. Trigger ISR Revalidation
    revalidatePath(`/${slug}`);

    return { ok: true };
  } catch (err: any) {
    console.error("publishInvitation error:", err);
    return { ok: false, error: err.message || "Failed to publish invitation" };
  }
}

export async function deleteInvitationAction(id: string) {
  try {
    const user = await getAuthenticatedUser();
    
    // Fetch invitation first to find the slug for revalidation if it was published
    const inv = await queries.getInvitationById(id, user.id);
    if (inv && inv.status === "published") {
      revalidatePath(`/${inv.slug}`);
    }

    await queries.deleteInvitation(id, user.id);
    return { ok: true };
  } catch (err: any) {
    console.error("deleteInvitation error:", err);
    return { ok: false, error: err.message || "Failed to delete invitation" };
  }
}

import { demoInvitationData } from "@/templates/demo-data";

export async function createNewInvitationAction(templateId: string) {
  try {
    const user = await getAuthenticatedUser();
    const id = `inv-${Date.now()}`;
    const slug = `wedding-${id.split("-").pop()}`;

    await queries.createInvitation(id, user.id, slug, templateId, templateId === "eternal-journey" ? "eternal-champagne" : templateId === "aurelia" ? "aurelia-olive" : "gold-light", demoInvitationData);
    return { ok: true, id };
  } catch (err: any) {
    console.error("createNewInvitationAction error:", err);
    return { ok: false, error: err.message || "Failed to create invitation draft" };
  }
}

export async function updateInvitationSettingsAction(
  id: string,
  data: { templateId?: string; colorSchemeId?: string; status?: "draft" | "published"; privacy?: "public" | "unlisted" }
) {
  try {
    const user = await getAuthenticatedUser();
    await queries.updateInvitationSettings(id, user.id, data);
    return { ok: true };
  } catch (err: any) {
    console.error("updateInvitationSettingsAction error:", err);
    return { ok: false, error: err.message || "Failed to update invitation settings" };
  }
}

export async function triggerRevalidate(slug: string) {
  try {
    revalidatePath(`/${slug}`);
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

export async function suggestAvailableSlugAction(partner1: string, partner2: string, invitationId: string) {
  try {
    await getAuthenticatedUser();
    const name1 = partner1.toLowerCase().replace(/[^a-z0-9]/g, "");
    const name2 = partner2.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!name1 || !name2) {
      return { ok: false, error: "Names are empty" };
    }
    const baseSlug = `${name1}-and-${name2}`;
    
    // Find next available slug (with collision suffix if taken)
    let slug = baseSlug;
    let isAvailable = await queries.checkSlugAvailable(slug, invitationId);
    let counter = 2;
    while (!isAvailable) {
      slug = `${baseSlug}-${counter}`;
      isAvailable = await queries.checkSlugAvailable(slug, invitationId);
      counter++;
    }
    return { ok: true, slug };
  } catch (err: any) {
    return { ok: false, error: err.message || "Failed to suggest slug" };
  }
}

