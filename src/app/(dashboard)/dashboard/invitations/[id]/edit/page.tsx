import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getInvitationById } from "@/db/queries/invitation";
import { WizardEditor } from "@/components/WizardEditor";
import { demoInvitationData } from "@/templates/demo-data";

export const dynamic = "force-dynamic";

export default async function EditInvitationPage(
  props: {
    params: Promise<{ id: string }>;
  }
) {
  const { id } = await props.params;

  // 1. Authenticate user
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect(`/sign-in?callbackUrl=/dashboard/invitations/${id}/edit`);
  }

  // 2. Fetch invitation from DB
  const invitation = await getInvitationById(id, session.user.id);

  if (!invitation) {
    redirect("/dashboard");
  }

  // Fallback content if empty draft
  const initialContent = invitation.content || {
    ...demoInvitationData,
    // Clear out photos to let them upload their own
    partner1: { ...demoInvitationData.partner1, photo: "" },
    partner2: { ...demoInvitationData.partner2, photo: "" },
    hero: { ...demoInvitationData.hero, mainPhoto: "", invitationCardUrl: "" },
    gallery: [],
    extras: { ...demoInvitationData.extras, keyGuests: [], contactPersons: [] },
  };

  const serializableInvitation = {
    id: invitation.id,
    slug: invitation.slug,
    templateId: invitation.templateId,
    colorSchemeId: invitation.colorSchemeId,
    status: invitation.status,
    content: initialContent,
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#faf8f5]">
      <WizardEditor invitation={serializableInvitation} />
    </div>
  );
}
