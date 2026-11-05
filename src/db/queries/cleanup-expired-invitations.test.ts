import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  candidates: vi.fn(),
  lockedInvitation: vi.fn(),
  contents: vi.fn(),
  otherContents: vi.fn(),
  deleteRecords: vi.fn(),
  deleteBlob: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ getDb: () => ({
  select: () => ({ from: () => ({ leftJoin: () => ({ orderBy: mocks.candidates }) }) }),
  transaction: async (callback: (transaction: unknown) => Promise<unknown>) => callback({
    select: (columns?: Record<string, unknown>) => ({ from: () => columns?.slug ? {
      innerJoin: () => ({ where: () => ({ limit: () => ({ for: mocks.lockedInvitation }) }) }),
    } : { where: columns ? mocks.otherContents : mocks.contents } }),
    delete: () => ({ where: mocks.deleteRecords }),
  }),
}) }));
vi.mock("@vercel/blob", () => ({ del: mocks.deleteBlob }));

import { cleanupExpiredInvitations } from "./invitation";

const now = new Date("2026-11-05T12:00:00Z");
const expired = {
  id: "past-invitation",
  slug: "past-wedding",
  status: "published",
  createdAt: new Date("2026-01-01"),
  content: { wedding: { date: "2026-10-01" }, events: [] },
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.candidates.mockResolvedValue([expired]);
  mocks.lockedInvitation.mockResolvedValue([expired]);
  mocks.contents.mockResolvedValue([]);
  mocks.otherContents.mockResolvedValue([]);
  mocks.deleteRecords.mockResolvedValue(undefined);
});

describe("expired invitation cleanup", () => {
  it("rechecks under a row lock before deleting data", async () => {
    const result = await cleanupExpiredInvitations(now);
    expect(result).toEqual({ deletedSlugs: ["past-wedding"], failed: 0, remaining: 0 });
    expect(mocks.lockedInvitation).toHaveBeenCalledWith("update", { skipLocked: true });
    expect(mocks.deleteRecords).toHaveBeenCalledTimes(2);
  });

  it("preserves an invitation rescheduled after the initial scan", async () => {
    mocks.lockedInvitation.mockResolvedValue([{ ...expired, content: { wedding: { date: "2026-12-01" } } }]);
    expect((await cleanupExpiredInvitations(now)).deletedSlugs).toEqual([]);
    expect(mocks.deleteRecords).not.toHaveBeenCalled();
  });

  it("skips rows locked by another cleanup or editor", async () => {
    mocks.lockedInvitation.mockResolvedValue([]);
    expect((await cleanupExpiredInvitations(now)).deletedSlugs).toEqual([]);
    expect(mocks.deleteRecords).not.toHaveBeenCalled();
  });

  it("continues with other invitations when one deletion fails", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      mocks.candidates.mockResolvedValue([expired, { ...expired, id: "second", slug: "second-wedding" }]);
      mocks.lockedInvitation.mockRejectedValueOnce(new Error("Temporary database error"))
        .mockResolvedValueOnce([{ ...expired, id: "second", slug: "second-wedding" }]);
      const result = await cleanupExpiredInvitations(now);
      expect(result).toEqual({ deletedSlugs: ["second-wedding"], failed: 1, remaining: 0 });
    } finally {
      consoleError.mockRestore();
    }
  });
});
