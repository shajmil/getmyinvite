import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rsvps, invitations, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Resend } from "resend";

export const runtime = "nodejs";

// Simple In-Memory Rate Limiter (Memory Map)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const limitWindowMs = 60 * 1000; // 1 minute
  const maxRequests = 5;

  const rate = rateLimitMap.get(ip);
  if (!rate || now > rate.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + limitWindowMs });
    return false;
  }

  if (rate.count >= maxRequests) {
    return true;
  }

  rate.count += 1;
  return false;
}

export async function POST(req: Request) {
  try {
    // 1. Rate Limiting Check
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many RSVP submissions. Please try again in a minute." },
        { status: 429 }
      );
    }

    const body = await req.json();

    // 2. Honeypot check to block automatic bot scrapers
    if (body.botField) {
      // Quietly reject as success to fool simple bots
      return NextResponse.json({ ok: true, msg: "Honeypot triggered" });
    }

    const {
      invitationId,
      guestName,
      email,
      phone,
      attending,
      guestCount,
      mealChoice,
      message,
    } = body;

    if (!invitationId || !guestName || !attending) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 3. Save RSVP to Database
    const rsvpId = `rsvp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    await db.insert(rsvps).values({
      id: rsvpId,
      invitationId,
      guestName,
      email: email || null,
      phone: phone || null,
      attending,
      guestCount: Number(guestCount) || 1,
      mealChoice: mealChoice || null,
      message: message || null,
    });

    // 4. Trigger Email Notification (if configured and Resend API key is present)
    const invitationList = await db
      .select()
      .from(invitations)
      .where(eq(invitations.id, invitationId))
      .limit(1);

    if (invitationList.length > 0) {
      const invitation = invitationList[0];
      const hostUserList = await db
        .select()
        .from(user)
        .where(eq(user.id, invitation.userId))
        .limit(1);

      if (hostUserList.length > 0 && process.env.RESEND_API_KEY) {
        const hostUser = hostUserList[0];
        const resend = new Resend(process.env.RESEND_API_KEY);

        const emailContent = `
          <h3>New RSVP Submitted!</h3>
          <p>Hi ${hostUser.name},</p>
          <p>A new guest has RSVP'd to your wedding invitation website:</p>
          <ul>
            <li><strong>Guest Name:</strong> ${guestName}</li>
            <li><strong>Attending:</strong> ${attending.toUpperCase()}</li>
            <li><strong>Guests count:</strong> ${guestCount}</li>
            <li><strong>Email:</strong> ${email || "Not provided"}</li>
            <li><strong>Phone:</strong> ${phone || "Not provided"}</li>
            <li><strong>Meal Preference:</strong> ${mealChoice || "None"}</li>
            <li><strong>Message:</strong> ${message || "No message left"}</li>
          </ul>
        `;

        await resend.emails.send({
          from: "MakeMyInvite RSVP <rsvp@makemyinvite.app>",
          to: hostUser.email,
          subject: `RSVP Alert: ${guestName} is attending!`,
          html: emailContent,
        }).catch((err) => {
          console.error("Resend notification failed", err);
        });
      }
    }

    return NextResponse.json({ ok: true, rsvpId });
  } catch (err: any) {
    console.error("RSVP route error:", err);
    return NextResponse.json({ error: err.message || "Failed to submit RSVP" }, { status: 500 });
  }
}
