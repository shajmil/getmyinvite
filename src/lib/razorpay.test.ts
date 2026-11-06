import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { isCapturedPremiumPayment, isPremiumCheckoutEnabled, verifyRazorpaySignature } from "./razorpay";

afterEach(() => vi.unstubAllEnvs());

describe("Razorpay verification", () => {
  it("verifies the server order and payment signature", () => {
    const message = "order_123|pay_456";
    const signature = createHmac("sha256", "secret").update(message).digest("hex");
    expect(verifyRazorpaySignature(message, signature, "secret")).toBe(true);
    expect(verifyRazorpaySignature("order_other|pay_456", signature, "secret")).toBe(false);
    expect(verifyRazorpaySignature(message, signature, "wrong")).toBe(false);
    expect(verifyRazorpaySignature(message, "bad", "secret")).toBe(false);
  });

  it("signs the exact raw webhook bytes", () => {
    const body = Buffer.from('{ "event": "payment.captured" }');
    const signature = createHmac("sha256", "webhook-secret").update(body).digest("hex");
    expect(verifyRazorpaySignature(body, signature, "webhook-secret")).toBe(true);
    expect(verifyRazorpaySignature(JSON.stringify(JSON.parse(body.toString())), signature, "webhook-secret")).toBe(false);
  });

  const captured = { id: "pay_123", order_id: "order_123", amount: 9900, currency: "INR", status: "captured", captured: true };
  it("accepts only a captured ₹99 INR payment for the expected order", () => {
    expect(isCapturedPremiumPayment(captured, "order_123")).toBe(true);
    expect(isCapturedPremiumPayment(captured, "order_other")).toBe(false);
    expect(isCapturedPremiumPayment({ ...captured, amount: 99 }, "order_123")).toBe(false);
    expect(isCapturedPremiumPayment({ ...captured, currency: "USD" }, "order_123")).toBe(false);
    expect(isCapturedPremiumPayment({ ...captured, status: "authorized", captured: false }, "order_123")).toBe(false);
  });

  it("keeps checkout disabled until explicitly configured", () => {
    vi.stubEnv("PREMIUM_PAYMENTS_ENABLED", "false");
    expect(isPremiumCheckoutEnabled()).toBe(false);
    vi.stubEnv("PREMIUM_PAYMENTS_ENABLED", "true");
    vi.stubEnv("RAZORPAY_KEY_ID", "");
    expect(isPremiumCheckoutEnabled()).toBe(false);
  });

  it("prevents test checkout on Vercel Production", () => {
    vi.stubEnv("PREMIUM_PAYMENTS_ENABLED", "true");
    vi.stubEnv("RAZORPAY_KEY_ID", "rzp_test_123");
    vi.stubEnv("RAZORPAY_KEY_SECRET", "test-secret");
    vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", "test-webhook");
    vi.stubEnv("VERCEL_ENV", "production");
    expect(isPremiumCheckoutEnabled()).toBe(false);
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(isPremiumCheckoutEnabled()).toBe(true);
  });

  it("prevents test checkout on Cloudflare production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEPLOYMENT_ENV", "production");
    vi.stubEnv("PREMIUM_PAYMENTS_ENABLED", "true");
    vi.stubEnv("RAZORPAY_KEY_ID", "rzp_test_123");
    vi.stubEnv("RAZORPAY_KEY_SECRET", "test-secret");
    vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", "test-webhook");
    expect(isPremiumCheckoutEnabled()).toBe(false);
    vi.stubEnv("RAZORPAY_KEY_ID", "rzp_live_123");
    expect(isPremiumCheckoutEnabled()).toBe(true);
  });
});
