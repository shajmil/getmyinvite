import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export const PREMIUM_PRICE_PAISE = 9900;
export const PREMIUM_CURRENCY = "INR";

export function isPremiumCheckoutEnabled(): boolean {
  const deploymentEnvironment = process.env.DEPLOYMENT_ENV ?? process.env.VERCEL_ENV ?? process.env.NODE_ENV;
  return process.env.PREMIUM_PAYMENTS_ENABLED === "true" && Boolean(
    process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_WEBHOOK_SECRET
  ) && (deploymentEnvironment !== "production" || process.env.RAZORPAY_KEY_ID?.startsWith("rzp_live_") === true);
}

export function verifyRazorpaySignature(message: string | Buffer, signature: string, secret: string): boolean {
  if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = createHmac("sha256", secret).update(message).digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}

export async function razorpayRequest(path: string, body?: Record<string, unknown>): Promise<unknown> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("Razorpay is not configured");
  const response = await fetch(`https://api.razorpay.com/v1/${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Razorpay request failed (${response.status})`);
  return response.json();
}

export const razorpayOrderSchema = z.object({
  id: z.string().regex(/^order_[a-zA-Z0-9]+$/),
  amount: z.number().int(),
  currency: z.string(),
});

export const razorpayPaymentSchema = z.object({
  id: z.string().regex(/^pay_[a-zA-Z0-9]+$/),
  order_id: z.string(),
  amount: z.number().int(),
  currency: z.string(),
  status: z.string(),
  captured: z.boolean(),
});

export function isCapturedPremiumPayment(payment: z.infer<typeof razorpayPaymentSchema>, orderId: string): boolean {
  return payment.order_id === orderId && payment.amount === PREMIUM_PRICE_PAISE &&
    payment.currency === PREMIUM_CURRENCY && payment.status === "captured" && payment.captured;
}
