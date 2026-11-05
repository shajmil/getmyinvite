import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  deleteBlob: vi.fn(),
  selectContent: vi.fn(),
  deleteRecords: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({ from: () => ({ where: mocks.selectContent }) }),
    delete: () => ({ where: mocks.deleteRecords }),
  },
}));
vi.mock("@vercel/blob", () => ({ del: mocks.deleteBlob }));

import { deleteAsset, deleteInvitationsByIds } from "./invitation";

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("BLOB_READ_WRITE_TOKEN", "test-token");
  vi.spyOn(console, "error").mockImplementation(() => {});
  mocks.selectContent.mockResolvedValue([
    { content: { hero: "/uploads/assets/user/photo.webp", gallery: ["/uploads/assets/user/photo.webp"] } },
  ]);
  mocks.deleteRecords.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("invitation asset cleanup", () => {
  it("prevents invitation content from deleting the R2 quota counter", async () => {
    vi.stubEnv("R2_PUBLIC_URL", "https://assets.example.com");
    await expect(deleteAsset("https://assets.example.com/_system/upload-budget.json")).rejects.toThrow(
      "Only uploaded assets can be deleted"
    );
  });

  it("deletes legacy Blob pathnames once and waits before deleting invitation records", async () => {
    let completeDeletion: () => void = () => {};
    mocks.deleteBlob.mockImplementation(() => new Promise<void>((resolve) => {
      completeDeletion = resolve;
    }));
    const deletion = deleteInvitationsByIds(["invitation-1"]);
    await vi.waitFor(() => expect(mocks.deleteBlob).toHaveBeenCalledWith("assets/user/photo.webp"));
    expect(mocks.deleteRecords).not.toHaveBeenCalled();
    completeDeletion();
    await deletion;
    expect(mocks.deleteBlob).toHaveBeenCalledTimes(1);
    expect(mocks.deleteRecords).toHaveBeenCalledTimes(1);
  });

  it("keeps invitation records for retry when Blob deletion fails", async () => {
    mocks.deleteBlob.mockRejectedValue(new Error("Store suspended"));
    await expect(deleteInvitationsByIds(["invitation-1"])).rejects.toThrow("Store suspended");
    expect(mocks.deleteRecords).not.toHaveBeenCalled();
  });
});
