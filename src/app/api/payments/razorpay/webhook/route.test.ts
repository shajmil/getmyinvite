import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { confirmPremiumPayment } from "@/db/queries/premium";
vi.mock("@/db/queries/premium", () => ({ confirmPremiumPayment: vi.fn() }));
import { POST } from "./route";

const secret = "webhook-test-secret";
const payload = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_123", order_id: "order_123" } } } });

function webhook(body = payload, signature = createHmac("sha256", secret).update(body).digest("hex")) {
  return POST(new Request("https://example.com/api/payments/razorpay/webhook", {
    method: "POST", body, headers: { "x-razorpay-signature": signature },
  }));
}

beforeEach(() => { vi.clearAllMocks(); vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", secret); });
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("Razorpay webhook", () => {
  it("rejects requests with no or invalid signature before granting premium", async () => {
    expect((await webhook(payload, "wrong")).status).toBe(400);
    expect(confirmPremiumPayment).not.toHaveBeenCalled();
  });
  it("fails closed when not configured", async () => {
    vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", "");
    expect((await webhook()).status).toBe(503);
  });
  it("passes signed captured events to server confirmation", async () => {
    vi.mocked(confirmPremiumPayment).mockResolvedValue("paid");
    expect((await webhook()).status).toBe(200);
    expect(confirmPremiumPayment).toHaveBeenCalledWith("order_123", "pay_123");
  });
  it("asks Razorpay to retry if the database or provider is unavailable", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(confirmPremiumPayment).mockRejectedValue(new Error("Unavailable"));
    expect((await webhook()).status).toBe(500);
  });
  it("asks Razorpay to retry if its payment lookup has not confirmed capture yet", async () => {
    vi.mocked(confirmPremiumPayment).mockResolvedValue("pending");
    expect((await webhook()).status).toBe(500);
  });
});
