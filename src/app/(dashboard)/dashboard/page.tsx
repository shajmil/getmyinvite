import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getInvitationsByUser } from "@/db/queries/invitation";
import { DashboardList } from "@/components/DashboardList";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // 1. Authenticate user
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/sign-in?callbackUrl=/dashboard");
  }

  // 2. Fetch invitations
  const list = await getInvitationsByUser(session.user.id);

  const serializableList = list.map((inv) => ({
    id: inv.id,
    slug: inv.slug,
    templateId: inv.templateId,
    status: inv.status,
    colorSchemeId: inv.colorSchemeId,
    publishedAt: inv.publishedAt ? inv.publishedAt.toISOString() : null,
    createdAt: inv.createdAt.toISOString(),
    weddingDate: inv.content?.wedding.date || null,
    rsvpCount: inv.rsvpCount,
    partner1Name: inv.content?.partner1.firstName || "Bride",
    partner2Name: inv.content?.partner2.firstName || "Groom",
  }));

  const serializableUser = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#faf8f5]">
      <DashboardList initialInvitations={serializableList} user={serializableUser} />
    </div>
  );
}
