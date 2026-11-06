import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ session: vi.fn(), select: vi.fn(), transaction: vi.fn(), provider: vi.fn(), insert: vi.fn(), update: vi.fn() }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/lib/auth", () => ({ getAuth: () => ({ api: { getSession: mocks.session } }) }));
vi.mock("@/lib/db", () => ({ getDb: () => ({
  select: () => ({ from: () => ({ where: () => ({ limit: mocks.select }) }) }), transaction: mocks.transaction,
}) }));
vi.mock("@/db/queries/premium", () => ({
  confirmPremiumPayment: vi.fn(), getPremiumInvitationIds: vi.fn(), isPremiumStorageReady: vi.fn(), reconcileInvitationPayment: vi.fn(),
}));
vi.mock("@/lib/razorpay", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/razorpay")>(), razorpayRequest: mocks.provider,
}));
import { confirmPremiumPayment, getPremiumInvitationIds, isPremiumStorageReady } from "@/db/queries/premium";
import { GET, POST, PUT } from "./route";

function request(body: unknown) {
  return new Request("https://example.com/api/payments/premium?invitationId=inv-123", {
    method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.session.mockResolvedValue({ user: { id: "owner" } });
  vi.stubEnv("PREMIUM_PAYMENTS_ENABLED", "false");
  vi.stubEnv("RAZORPAY_KEY_SECRET", "secret");
  vi.mocked(isPremiumStorageReady).mockResolvedValue(true);
  vi.mocked(getPremiumInvitationIds).mockResolvedValue(new Set());
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("premium API access and verification", () => {
  it("requires login for all customer endpoints", async () => {
    mocks.session.mockResolvedValue(null);
    for (const handler of [GET, POST, PUT]) expect((await handler(request({ invitationId: "inv-123" }))).status).toBe(401);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("does not create an order until enabled", async () => {
    expect((await POST(request({ invitationId: "inv-123", amount: 1 }))).status).toBe(503);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  function enableCheckout(existingOrder?: string, invitationExists = true) {
    vi.stubEnv("PREMIUM_PAYMENTS_ENABLED", "true");
    vi.stubEnv("RAZORPAY_KEY_ID", "rzp_live_test");
    vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", "webhook-secret");
    mocks.transaction.mockImplementation(async (callback) => callback({
      select: () => ({ from: () => ({ where: () => ({
        limit: () => ({ for: async () => invitationExists ? [{ id: "inv-123" }] : [] }),
        orderBy: () => ({ limit: async () => existingOrder ? [{ orderId: existingOrder }] : [] }),
      }) }) }),
      insert: () => ({ values: mocks.insert }),
      update: () => ({ set: (value: unknown) => { mocks.update(value); return { where: async () => undefined }; } }),
    }));
    mocks.provider.mockResolvedValue({ id: "order_123", amount: 9900, currency: "INR" });
  }

  it("creates only a server-priced INR order, ignoring browser prices", async () => {
    enableCheckout();
    const response = await POST(request({ invitationId: "inv-123", amount: 1, currency: "USD" }));
    expect(response.status).toBe(200);
    expect(mocks.provider).toHaveBeenCalledWith("orders", expect.objectContaining({ amount: 9900, currency: "INR" }));
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ orderId: "order_123", userId: "owner", amount: 9900 }));
    expect(await response.json()).toMatchObject({ amount: 9900, currency: "INR", orderId: "order_123" });
  });

  it("reuses pending orders and refreshes cleanup protection when checkout resumes", async () => {
    enableCheckout("order_existing");
    const response = await POST(request({ invitationId: "inv-123" }));
    expect(await response.json()).toMatchObject({ orderId: "order_existing" });
    expect(mocks.update).toHaveBeenCalledWith({ lastCheckoutAt: expect.any(Date) });
    expect(mocks.provider).not.toHaveBeenCalled();
  });

  it("never creates another order for an already paid invitation", async () => {
    enableCheckout();
    vi.mocked(getPremiumInvitationIds).mockResolvedValue(new Set(["inv-123"]));
    expect(await (await POST(request({ invitationId: "inv-123" }))).json()).toEqual({ paid: true });
    expect(mocks.provider).not.toHaveBeenCalled();
  });

  it("checks ownership inside the checkout transaction", async () => {
    enableCheckout(undefined, false);
    expect((await POST(request({ invitationId: "inv-123" }))).status).toBe(404);
    expect(mocks.provider).not.toHaveBeenCalled();
  });

  it("rejects status access to an invitation not owned by the user", async () => {
    mocks.select.mockResolvedValue([]);
    expect((await GET(request({}))).status).toBe(404);
  });

  const signature = createHmac("sha256", "secret").update("order_123|pay_123").digest("hex");
  const body = { invitationId: "inv-123", razorpay_order_id: "order_123", razorpay_payment_id: "pay_123", razorpay_signature: signature };
  it("rejects a checkout for another owner's order", async () => {
    mocks.select.mockResolvedValue([]);
    expect((await PUT(request(body))).status).toBe(400);
    expect(confirmPremiumPayment).not.toHaveBeenCalled();
  });

  it("rejects forged browser success responses", async () => {
    mocks.select.mockResolvedValue([{ orderId: "order_123" }]);
    expect((await PUT(request({ ...body, razorpay_signature: "0".repeat(64) }))).status).toBe(400);
    expect(confirmPremiumPayment).not.toHaveBeenCalled();
  });

  it("verifies valid callbacks on the server before returning paid", async () => {
    mocks.select.mockResolvedValue([{ orderId: "order_123" }]);
    vi.mocked(confirmPremiumPayment).mockResolvedValue("paid");
    const response = await PUT(request(body));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ paid: true, pending: false });
    expect(confirmPremiumPayment).toHaveBeenCalledWith("order_123", "pay_123");
  });
});
