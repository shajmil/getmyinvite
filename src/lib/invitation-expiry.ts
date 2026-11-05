import { z } from "zod";

const invitationDatesSchema = z.object({
  wedding: z.object({ date: z.iso.date() }),
  events: z.array(z.object({ date: z.iso.date() })).optional(),
});

export function isInvitationExpired(invitation: {
  status: "draft" | "published";
  createdAt: Date;
  content: unknown;
}, now: Date): boolean {
  if (invitation.status === "draft") {
    return invitation.createdAt.getTime() < now.getTime() - 7 * 24 * 60 * 60 * 1000;
  }

  const parsedDates = invitationDatesSchema.safeParse(invitation.content);
  if (!parsedDates.success) return false;

  const dates = [parsedDates.data.wedding.date, ...(parsedDates.data.events ?? []).map((event) => event.date)];
  dates.sort();
  const lastEventDate = dates[dates.length - 1];
  const cutoff = new Date(now);
  cutoff.setUTCDate(cutoff.getUTCDate() - 7);
  return lastEventDate < cutoff.toISOString().slice(0, 10);
}
