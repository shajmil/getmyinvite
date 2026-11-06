import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { invitationPayments, invitations } from "@/db/schema";
import { confirmPremiumPayment, getPremiumInvitationIds, isPremiumStorageReady, reconcileInvitationPayment } from "@/db/queries/premium";
import { isPremiumCheckoutEnabled, PREMIUM_CURRENCY, PREMIUM_PRICE_PAISE, razorpayOrderSchema, razorpayRequest, verifyRazorpaySignature } from "@/lib/razorpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const invitationIdSchema = z.string().min(1).max(100);
const verificationSchema = z.object({
  invitationId: invitationIdSchema,
  razorpay_order_id: z.string().regex(/^order_[a-zA-Z0-9]+$/),
  razorpay_payment_id: z.string().regex(/^pay_[a-zA-Z0-9]+$/),
  razorpay_signature: z.string().regex(/^[a-f0-9]{64}$/i),
});

async function authenticatedUser() {
  return (await getAuth().api.getSession({ headers: await headers() }))?.user;
}

export async function GET(request: Request) {
  try {
    const user = await authenticatedUser();
    if (!user) return NextResponse.json({ error: "Please sign in again" }, { status: 401 });
    const parsedId = invitationIdSchema.safeParse(new URL(request.url).searchParams.get("invitationId"));
    if (!parsedId.success) return NextResponse.json({ error: "Invalid invitation" }, { status: 400 });
    const [invitation] = await getDb().select({ id: invitations.id }).from(invitations)
      .where(and(eq(invitations.id, parsedId.data), eq(invitations.userId, user.id))).limit(1);
    if (!invitation) return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    const ready = await isPremiumStorageReady();
    let paid = ready && (await getPremiumInvitationIds([invitation.id])).has(invitation.id);
    if (ready && !paid && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      paid = await reconcileInvitationPayment(invitation.id);
    }
    return NextResponse.json({ paid, available: ready && isPremiumCheckoutEnabled() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Premium status failed:", error);
    return NextResponse.json({ error: "Could not check premium status. Please retry." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await authenticatedUser();
    if (!user) return NextResponse.json({ error: "Please sign in again" }, { status: 401 });
    if (!isPremiumCheckoutEnabled() || !await isPremiumStorageReady()) {
      return NextResponse.json({ error: "Premium payments are not available yet. Free publishing is still available." }, { status: 503 });
    }
    const body = z.object({ invitationId: invitationIdSchema }).safeParse(await request.json());
    if (!body.success) return NextResponse.json({ error: "Invalid invitation" }, { status: 400 });
    const result = await getDb().transaction(async (transaction) => {
      const [invitation] = await transaction.select({ id: invitations.id }).from(invitations)
        .where(and(eq(invitations.id, body.data.invitationId), eq(invitations.userId, user.id)))
        .limit(1).for("update");
      if (!invitation) return null;
      if ((await getPremiumInvitationIds([invitation.id], transaction)).has(invitation.id)) return { paid: true as const };
      const [existing] = await transaction.select().from(invitationPayments)
        .where(and(eq(invitationPayments.invitationId, invitation.id), eq(invitationPayments.status, "pending")))
        .orderBy(desc(invitationPayments.createdAt)).limit(1);
      if (existing) {
        await transaction.update(invitationPayments).set({ lastCheckoutAt: new Date() })
          .where(eq(invitationPayments.orderId, existing.orderId));
        return { paid: false as const, orderId: existing.orderId };
      }
      const order = razorpayOrderSchema.parse(await razorpayRequest("orders", {
        amount: PREMIUM_PRICE_PAISE,
        currency: PREMIUM_CURRENCY,
        receipt: crypto.randomUUID(),
        notes: { invitationId: invitation.id, purpose: "keep_forever" },
      }));
      if (order.amount !== PREMIUM_PRICE_PAISE || order.currency !== PREMIUM_CURRENCY) throw new Error("Unexpected payment order amount");
      await transaction.insert(invitationPayments).values({
        orderId: order.id, invitationId: invitation.id, userId: user.id,
        amount: PREMIUM_PRICE_PAISE, currency: PREMIUM_CURRENCY,
      });
      return { paid: false as const, orderId: order.id };
    });
    if (!result) return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    if (result.paid) return NextResponse.json({ paid: true });
    return NextResponse.json({ ...result, keyId: process.env.RAZORPAY_KEY_ID, amount: PREMIUM_PRICE_PAISE, currency: PREMIUM_CURRENCY });
  } catch (error) {
    console.error("Premium checkout failed:", error);
    return NextResponse.json({ error: "Could not start checkout. Please try again." }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await authenticatedUser();
    if (!user) return NextResponse.json({ error: "Please sign in again" }, { status: 401 });
    if (!process.env.RAZORPAY_KEY_SECRET || !await isPremiumStorageReady()) {
      return NextResponse.json({ error: "Payment verification is temporarily unavailable" }, { status: 503 });
    }
    const parsed = verificationSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid payment response" }, { status: 400 });
    const payment = parsed.data;
    const [purchase] = await getDb().select().from(invitationPayments).where(and(
      eq(invitationPayments.orderId, payment.razorpay_order_id),
      eq(invitationPayments.invitationId, payment.invitationId), eq(invitationPayments.userId, user.id),
    )).limit(1);
    if (!purchase || !verifyRazorpaySignature(`${purchase.orderId}|${payment.razorpay_payment_id}`, payment.razorpay_signature, process.env.RAZORPAY_KEY_SECRET)) {
      return NextResponse.json({ error: "Payment could not be verified" }, { status: 400 });
    }
    const result = await confirmPremiumPayment(purchase.orderId, payment.razorpay_payment_id);
    return NextResponse.json({ paid: result === "paid", pending: result === "pending" });
  } catch (error) {
    console.error("Premium payment verification failed:", error);
    return NextResponse.json({ error: "Verification is pending. Please check your dashboard before paying again." }, { status: 503 });
  }
}
