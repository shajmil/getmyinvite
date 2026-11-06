import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ select: vi.fn(), execute: vi.fn(), update: vi.fn(), paymentUpdate: vi.fn(), lock: vi.fn(), request: vi.fn() }));
vi.mock("@/lib/db", () => ({ getDb: () => ({
  execute: mocks.execute,
  select: () => ({ from: () => ({ where: () => ({ limit: mocks.select, then: (resolve: (rows: unknown) => void) => mocks.select().then(resolve) }) }) }),
  transaction: async (callback: (transaction: unknown) => Promise<unknown>) => callback({
    select: () => ({ from: () => ({ where: () => ({ for: mocks.lock }) }) }),
    update: () => ({ set: mocks.update }),
  }),
}) }));
vi.mock("@/lib/razorpay", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/razorpay")>(), razorpayRequest: mocks.request,
}));

import { confirmPremiumPayment, getPremiumInvitationIds, isInvitationPaymentProtected } from "./premium";

const purchase = { orderId: "order_123", invitationId: "inv-123", userId: "user-123", amount: 9900, currency: "INR", status: "pending", lastCheckoutAt: new Date() };
const payment = { id: "pay_123", order_id: "order_123", amount: 9900, currency: "INR", status: "captured", captured: true };

beforeEach(() => {
  vi.resetAllMocks();
  mocks.execute.mockResolvedValue({ rows: [{ payment_table: "invitation_payments" }] });
  mocks.select.mockResolvedValue([purchase]);
  mocks.request.mockResolvedValue(payment);
  mocks.lock.mockResolvedValue([{ id: "inv-123" }]);
  mocks.update.mockReturnValue({ where: mocks.paymentUpdate });
  mocks.paymentUpdate.mockResolvedValue(undefined);
});
afterEach(() => vi.unstubAllEnvs());

describe("premium persistence and cleanup protection", () => {
  it("does not require the migration for existing free invitations", async () => {
    mocks.execute.mockResolvedValue({ rows: [{ payment_table: null }] });
    vi.stubEnv("PREMIUM_PAYMENTS_ENABLED", "false");
    expect(await getPremiumInvitationIds(["inv-123"])).toEqual(new Set());
    expect(await isInvitationPaymentProtected("inv-123")).toBe(false);
    expect(mocks.select).not.toHaveBeenCalled();
  });

  it("stops cleanup if premium is enabled without its migration", async () => {
    mocks.execute.mockResolvedValue({ rows: [{ payment_table: null }] });
    vi.stubEnv("PREMIUM_PAYMENTS_ENABLED", "true");
    await expect(isInvitationPaymentProtected("inv-123")).rejects.toThrow("migration");
  });

  it("protects paid invitations even after checkout is disabled", async () => {
    vi.stubEnv("PREMIUM_PAYMENTS_ENABLED", "false");
    mocks.select.mockResolvedValue([{ ...purchase, status: "paid", lastCheckoutAt: new Date("2020-01-01") }]);
    expect(await isInvitationPaymentProtected("inv-123")).toBe(true);
    expect(mocks.request).not.toHaveBeenCalled();
  });

  it("protects a checkout in progress", async () => {
    expect(await isInvitationPaymentProtected("inv-123")).toBe(true);
  });

  it("checks Razorpay before cleaning up an older pending checkout", async () => {
    mocks.select.mockResolvedValue([{ ...purchase, lastCheckoutAt: new Date("2020-01-01") }]);
    mocks.request.mockResolvedValue({ items: [payment] });
    expect(await isInvitationPaymentProtected("inv-123")).toBe(true);
    expect(mocks.request).toHaveBeenCalledWith("orders/order_123/payments");
  });

  it("allows expiry of abandoned checkouts only after checking with the provider", async () => {
    mocks.select.mockResolvedValue([{ ...purchase, lastCheckoutAt: new Date("2020-01-01") }]);
    mocks.request.mockResolvedValue({ items: [{ ...payment, status: "failed", captured: false }] });
    expect(await isInvitationPaymentProtected("inv-123")).toBe(false);
  });

  it("preserves authorized payments awaiting capture", async () => {
    mocks.select.mockResolvedValue([{ ...purchase, lastCheckoutAt: new Date("2020-01-01") }]);
    mocks.request.mockResolvedValue({ items: [{ ...payment, status: "authorized", captured: false }] });
    expect(await isInvitationPaymentProtected("inv-123")).toBe(true);
  });

  it("never permits cleanup when provider confirmation fails", async () => {
    mocks.select.mockResolvedValue([{ ...purchase, lastCheckoutAt: new Date("2020-01-01") }]);
    mocks.request.mockRejectedValue(new Error("Provider unavailable"));
    await expect(isInvitationPaymentProtected("inv-123")).rejects.toThrow("Provider unavailable");
  });

  it("persists only server-confirmed captured payments", async () => {
    expect(await confirmPremiumPayment("order_123", "pay_123")).toBe("paid");
    expect(mocks.lock).toHaveBeenCalledWith("update");
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ status: "paid", paymentId: "pay_123" }));
  });

  it.each([
    { ...payment, amount: 99 },
    { ...payment, order_id: "order_other" },
    { ...payment, currency: "USD" },
    { ...payment, status: "authorized", captured: false },
  ])("does not grant premium for mismatched or uncaptured payments", async (providerPayment) => {
    mocks.request.mockResolvedValue(providerPayment);
    expect(await confirmPremiumPayment("order_123", "pay_123")).toBe("pending");
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("handles duplicate callbacks and webhooks idempotently", async () => {
    mocks.select.mockResolvedValue([{ ...purchase, status: "paid", paymentId: "pay_123" }]);
    expect(await confirmPremiumPayment("order_123", "pay_123")).toBe("paid");
    expect(mocks.request).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
