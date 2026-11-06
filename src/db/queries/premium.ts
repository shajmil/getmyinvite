import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { invitationPayments, invitations } from "@/db/schema";
import { isCapturedPremiumPayment, PREMIUM_CURRENCY, PREMIUM_PRICE_PAISE, razorpayPaymentSchema, razorpayRequest } from "@/lib/razorpay";
import { z } from "zod";

type PremiumDatabase = Pick<ReturnType<typeof getDb>, "execute" | "select">;

export async function isPremiumStorageReady(database: PremiumDatabase = getDb()): Promise<boolean> {
  const result = await database.execute(sql`select to_regclass('public.invitation_payments') as payment_table`);
  return Boolean(result.rows[0]?.payment_table);
}

export async function getPremiumInvitationIds(ids: string[], database: PremiumDatabase = getDb()): Promise<Set<string>> {
  if (!ids.length || !await isPremiumStorageReady(database)) return new Set();
  const payments = await database.select({ invitationId: invitationPayments.invitationId })
    .from(invitationPayments).where(and(inArray(invitationPayments.invitationId, ids), eq(invitationPayments.status, "paid")));
  return new Set(payments.flatMap((payment) => payment.invitationId ? [payment.invitationId] : []));
}

export async function isInvitationPaymentProtected(id: string, database: PremiumDatabase = getDb()): Promise<boolean> {
  if (!await isPremiumStorageReady(database)) {
    if (process.env.PREMIUM_PAYMENTS_ENABLED === "true") throw new Error("Premium migration must be applied before cleanup");
    return false;
  }
  const payments = await database.select({ orderId: invitationPayments.orderId, status: invitationPayments.status, lastCheckoutAt: invitationPayments.lastCheckoutAt })
    .from(invitationPayments).where(eq(invitationPayments.invitationId, id));
  if (payments.some((payment) => payment.status === "paid" || payment.lastCheckoutAt.getTime() > Date.now() - 24 * 60 * 60 * 1000)) return true;
  for (const purchase of payments) {
    // Reconcile missed webhooks before deleting an invitation with an older checkout.
    const result = z.object({ items: z.array(razorpayPaymentSchema) }).parse(
      await razorpayRequest(`orders/${encodeURIComponent(purchase.orderId)}/payments`)
    );
    if (result.items.some((payment) => isCapturedPremiumPayment(payment, purchase.orderId) || payment.status === "authorized")) return true;
  }
  return false;
}

export async function confirmPremiumPayment(orderId: string, paymentId: string): Promise<"paid" | "pending" | "missing"> {
  const [purchase] = await getDb().select().from(invitationPayments).where(eq(invitationPayments.orderId, orderId)).limit(1);
  if (!purchase) return "missing";
  if (purchase.status === "paid") return purchase.paymentId === paymentId ? "paid" : "missing";
  const payment = razorpayPaymentSchema.parse(await razorpayRequest(`payments/${encodeURIComponent(paymentId)}`));
  if (!isCapturedPremiumPayment(payment, purchase.orderId) || purchase.amount !== PREMIUM_PRICE_PAISE || purchase.currency !== PREMIUM_CURRENCY) return "pending";
  await getDb().transaction(async (transaction) => {
    // Match the cleanup lock so payment activation and invitation deletion cannot interleave.
    if (purchase.invitationId) {
      await transaction.select({ id: invitations.id }).from(invitations)
        .where(eq(invitations.id, purchase.invitationId)).for("update");
    }
    await transaction.update(invitationPayments).set({ status: "paid", paymentId: payment.id, paidAt: new Date() })
      .where(and(eq(invitationPayments.orderId, purchase.orderId), eq(invitationPayments.status, "pending")));
  });
  return "paid";
}

export async function reconcileInvitationPayment(invitationId: string): Promise<boolean> {
  const [pending] = await getDb().select().from(invitationPayments)
    .where(and(eq(invitationPayments.invitationId, invitationId), eq(invitationPayments.status, "pending"))).limit(1);
  if (!pending) return false;
  const result = z.object({ items: z.array(razorpayPaymentSchema) }).parse(
    await razorpayRequest(`orders/${encodeURIComponent(pending.orderId)}/payments`)
  );
  const captured = result.items.find((payment) => isCapturedPremiumPayment(payment, pending.orderId));
  return captured ? await confirmPremiumPayment(pending.orderId, captured.id) === "paid" : false;
}
