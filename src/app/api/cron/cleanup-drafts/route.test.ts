import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanupExpiredInvitations } from "@/db/queries/invitation";
import { reconcileR2UploadBudget } from "@/lib/r2-storage-limit";
import { revalidatePath } from "next/cache";

vi.mock("@/db/queries/invitation", () => ({ cleanupExpiredInvitations: vi.fn() }));
vi.mock("@/lib/r2-storage-limit", () => ({ reconcileR2UploadBudget: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { GET, POST } from "./route";

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("CRON_SECRET", "test-cron-secret");
  for (const name of ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME", "R2_PUBLIC_URL"]) {
    vi.stubEnv(name, "");
  }
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.mocked(cleanupExpiredInvitations).mockResolvedValue({ deletedSlugs: ["past-wedding"], failed: 0, remaining: 0 });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("secured daily cleanup", () => {
  it("fails closed when CRON_SECRET is missing", async () => {
    vi.stubEnv("CRON_SECRET", "");
    expect((await GET(new Request("https://example.com/api/cron/cleanup-drafts"))).status).toBe(503);
    expect(cleanupExpiredInvitations).not.toHaveBeenCalled();
  });

  it.each(["", "Bearer wrong-secret"])("rejects unauthorized requests", async (authorization) => {
    const response = await GET(new Request("https://example.com/api/cron/cleanup-drafts?secret=test-cron-secret", { headers: { authorization } }));
    expect(response.status).toBe(401);
    expect(cleanupExpiredInvitations).not.toHaveBeenCalled();
  });

  it("cleans up authorized requests and invalidates removed invitation pages", async () => {
    const response = await POST(new Request("https://example.com/api/cron/cleanup-drafts", { headers: { authorization: "Bearer test-cron-secret" } }));
    expect(response.status).toBe(200);
    expect(revalidatePath).toHaveBeenCalledWith("/past-wedding");
    expect(await response.json()).toMatchObject({ ok: true, deletedInvitations: 1 });
  });

  it("reconciles storage before and after deletion", async () => {
    for (const name of ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME", "R2_PUBLIC_URL"]) {
      vi.stubEnv(name, "test-setting");
    }
    vi.mocked(reconcileR2UploadBudget).mockResolvedValue({ reconciled: true, reservedBytes: 100, pendingUploads: 0 });
    const response = await GET(new Request("https://example.com/api/cron/cleanup-drafts", { headers: { authorization: "Bearer test-cron-secret" } }));
    expect(response.status).toBe(200);
    expect(reconcileR2UploadBudget).toHaveBeenCalledTimes(2);
    const cleanupOrder = vi.mocked(cleanupExpiredInvitations).mock.invocationCallOrder[0];
    const reconciliationOrder = vi.mocked(reconcileR2UploadBudget).mock.invocationCallOrder;
    expect(reconciliationOrder[0]).toBeLessThan(cleanupOrder);
    expect(reconciliationOrder[1]).toBeGreaterThan(cleanupOrder);
  });

  it("reports failed invitations so storage errors remain visible", async () => {
    vi.mocked(cleanupExpiredInvitations).mockResolvedValue({ deletedSlugs: [], failed: 1, remaining: 0 });
    const response = await GET(new Request("https://example.com/api/cron/cleanup-drafts", { headers: { authorization: "Bearer test-cron-secret" } }));
    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ ok: false, failedInvitations: 1 });
  });
});
