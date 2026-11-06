import { NextResponse } from "next/server";
import { z } from "zod";
import { confirmPremiumPayment } from "@/db/queries/premium";
import { verifyRazorpaySignature } from "@/lib/razorpay";

export const runtime = "nodejs";

const webhookSchema = z.object({
  event: z.string(),
  payload: z.object({ payment: z.object({ entity: z.object({
    id: z.string().regex(/^pay_[a-zA-Z0-9]+$/),
    order_id: z.string().regex(/^order_[a-zA-Z0-9]+$/),
  }) }).optional() }),
});

export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook is not configured" }, { status: 503 });
  const rawBody = Buffer.from(await request.arrayBuffer());
  if (!verifyRazorpaySignature(rawBody, request.headers.get("x-razorpay-signature") ?? "", secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  try {
    const event = webhookSchema.parse(JSON.parse(rawBody.toString("utf8")));
    if (!["payment.captured", "order.paid"].includes(event.event)) return NextResponse.json({ ok: true });
    const payment = event.payload.payment?.entity;
    if (!payment) return NextResponse.json({ error: "Missing payment" }, { status: 400 });
    const result = await confirmPremiumPayment(payment.order_id, payment.id);
    if (result === "pending") return NextResponse.json({ error: "Payment confirmation pending" }, { status: 500 });
    if (result === "missing") console.warn("Unrecognized premium payment order:", payment.order_id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Razorpay webhook failed; retry required:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
