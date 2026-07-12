import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getInvitationById, getRSVPsForInvitation } from "@/db/queries/invitation";
import { RSVPManager } from "@/components/RSVPManager";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function RSVPsPage(
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
    redirect(`/sign-in?callbackUrl=/dashboard/invitations/${id}/rsvps`);
  }

  // 2. Fetch invitation to check ownership
  const invitation = await getInvitationById(id, session.user.id);
  if (!invitation) {
    redirect("/dashboard");
  }

  // 3. Fetch guest responses
  const guests = await getRSVPsForInvitation(id, session.user.id);

  const serializableGuests = guests.map((g: { id: string; guestName: string; email: string | null; phone: string | null; attending: "yes" | "no" | "maybe"; guestCount: number; mealChoice: string | null; message: string | null; createdAt: Date }) => ({
    id: g.id,
    guestName: g.guestName,
    email: g.email,
    phone: g.phone,
    attending: g.attending,
    guestCount: g.guestCount,
    mealChoice: g.mealChoice,
    message: g.message,
    createdAt: g.createdAt.toISOString(),
  }));

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#faf8f5]">
      {/* Dashboard Top Header */}
      <header className="h-16 bg-white border-b border-[#eae6df] px-6 flex items-center justify-between flex-shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-[#666] hover:text-[#1a1a1a] flex items-center gap-1.5 transition-colors border border-[#eae6df] px-3 py-1.5 rounded-lg bg-[#faf8f5]"
          >
            ← Back to Dashboard
          </Link>
          <span className="h-4 w-px bg-[#eae6df]" />
          <h1 className="text-md font-serif font-bold text-[#1a1a1a]">
            RSVP Guest Manager
          </h1>
        </div>
      </header>

      {/* RSVP Manager Client Dashboard */}
      <div className="flex-1 p-6 md:p-8 max-w-6xl w-full mx-auto">
        <RSVPManager invitationId={id} initialGuests={serializableGuests} />
      </div>
    </div>
  );
}
