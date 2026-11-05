import { describe, expect, it, vi } from "vitest";
import { S3Client } from "@aws-sdk/client-s3";
import { R2_UPLOAD_BUDGET_BYTES, reserveR2UploadSpace, reconcileR2UploadBudget } from "./r2-storage-limit";

function budgetObject(reservedBytes: number, etag = "version-1") {
  return {
    ETag: etag,
    Body: { transformToString: async () => JSON.stringify({ reservedBytes, pendingUploads: [] }) },
  };
}

describe("R2 storage reservations", () => {
  it("blocks a reservation that exceeds the budget without writing", async () => {
    const send = vi.fn().mockResolvedValue(budgetObject(R2_UPLOAD_BUDGET_BYTES - 100));
    expect(await reserveR2UploadSpace({ send } as unknown as S3Client, "photos", 101, "assets/new.webp")).toBe(false);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("atomically reserves space using the current object version", async () => {
    const send = vi.fn().mockResolvedValueOnce(budgetObject(100)).mockResolvedValueOnce({});
    expect(await reserveR2UploadSpace({ send } as unknown as S3Client, "photos", 200, "assets/new.webp")).toBe(true);
    expect(JSON.parse(send.mock.calls[1][0].input.Body)).toMatchObject({ reservedBytes: 300, pendingUploads: [{ key: "assets/new.webp", sizeBytes: 200 }] });
    expect(send.mock.calls[1][0].input).toMatchObject({
      IfMatch: "version-1",
    });
  });

  it("rechecks capacity when another request wins a reservation", async () => {
    const send = vi.fn()
      .mockResolvedValueOnce(budgetObject(R2_UPLOAD_BUDGET_BYTES - 100))
      .mockRejectedValueOnce(Object.assign(new Error("Conflict"), { name: "PreconditionFailed" }))
      .mockResolvedValueOnce(budgetObject(R2_UPLOAD_BUDGET_BYTES, "version-2"));
    expect(await reserveR2UploadSpace({ send } as unknown as S3Client, "photos", 100, "assets/new.webp")).toBe(false);
    expect(send).toHaveBeenCalledTimes(3);
  });

  it("includes all pages of existing objects before creating the counter", async () => {
    const send = vi.fn()
      .mockRejectedValueOnce(Object.assign(new Error("Missing"), { name: "NoSuchKey" }))
      .mockResolvedValueOnce({ Contents: [{ Key: "assets/first.webp", Size: 100 }], IsTruncated: true, NextContinuationToken: "next-page" })
      .mockResolvedValueOnce({ Contents: [{ Key: "assets/second.webp", Size: 200 }], IsTruncated: false })
      .mockResolvedValueOnce({});
    expect(await reserveR2UploadSpace({ send } as unknown as S3Client, "photos", 50, "assets/new.webp")).toBe(true);
    expect(send.mock.calls[2][0].input.ContinuationToken).toBe("next-page");
    expect(JSON.parse(send.mock.calls[3][0].input.Body).reservedBytes).toBe(350);
    expect(send.mock.calls[3][0].input).toMatchObject({
      IfNoneMatch: "*",
    });
  });

  it("fails closed if R2 cannot provide the budget", async () => {
    const send = vi.fn().mockRejectedValue(new Error("Access denied"));
    await expect(reserveR2UploadSpace({ send } as unknown as S3Client, "photos", 100, "assets/new.webp")).rejects.toThrow("Access denied");
    expect(send).toHaveBeenCalledTimes(1);
  });
});

describe("R2 storage reconciliation", () => {
  function recordedBudget(pendingUploads: Array<{ key: string; sizeBytes: number; expiresAt: number; uploaded?: boolean }>, etag = "version-1") {
    return { ETag: etag, Body: { transformToString: async () => JSON.stringify({ reservedBytes: 9000, pendingUploads }) } };
  }

  it("reclaims deleted file storage and completed reservations after URL expiry", async () => {
    const send = vi.fn()
      .mockResolvedValueOnce(recordedBudget([{ key: "assets/old.webp", sizeBytes: 500, expiresAt: Date.now() - 1000, uploaded: true }]))
      .mockResolvedValueOnce({ Contents: [{ Key: "assets/remaining.webp", Size: 100 }] })
      .mockResolvedValueOnce({});
    const result = await reconcileR2UploadBudget({ send } as unknown as S3Client, "photos");
    expect(result).toMatchObject({ reconciled: true, reservedBytes: 100, pendingUploads: 0 });
    expect(send.mock.calls[2][0].input.IfMatch).toBe("version-1");
  });

  it("retains still-valid URLs even when their files already exist", async () => {
    const send = vi.fn()
      .mockResolvedValueOnce(recordedBudget([{ key: "assets/new.webp", sizeBytes: 500, expiresAt: Date.now() + 60000 }]))
      .mockResolvedValueOnce({ Contents: [{ Key: "assets/new.webp", Size: 500 }] })
      .mockResolvedValueOnce({});
    expect(await reconcileR2UploadBudget({ send } as unknown as S3Client, "photos")).toMatchObject({ reservedBytes: 1000, pendingUploads: 1 });
    expect(JSON.parse(send.mock.calls[2][0].input.Body).pendingUploads[0].uploaded).toBe(true);
  });

  it("keeps an unconfirmed upload reserved even after expiry", async () => {
    const send = vi.fn()
      .mockResolvedValueOnce(recordedBudget([{ key: "assets/unconfirmed.webp", sizeBytes: 500, expiresAt: Date.now() - 60000 }]))
      .mockResolvedValueOnce({ Contents: [] })
      .mockResolvedValueOnce({});
    expect(await reconcileR2UploadBudget({ send } as unknown as S3Client, "photos")).toMatchObject({ reservedBytes: 500, pendingUploads: 1 });
  });

  it("retries after a concurrent upload without losing its reservation", async () => {
    const pending = [{ key: "assets/concurrent.webp", sizeBytes: 80, expiresAt: Date.now() + 60000 }];
    const send = vi.fn()
      .mockResolvedValueOnce(recordedBudget([]))
      .mockResolvedValueOnce({ Contents: [{ Key: "assets/existing.webp", Size: 100 }] })
      .mockRejectedValueOnce(Object.assign(new Error("Conflict"), { name: "PreconditionFailed" }))
      .mockResolvedValueOnce(recordedBudget(pending, "version-2"))
      .mockResolvedValueOnce({ Contents: [{ Key: "assets/existing.webp", Size: 100 }] })
      .mockResolvedValueOnce({});
    expect(await reconcileR2UploadBudget({ send } as unknown as S3Client, "photos")).toMatchObject({ reservedBytes: 180, pendingUploads: 1 });
    expect(send.mock.calls[5][0].input.IfMatch).toBe("version-2");
  });

  it("waits before reconciling a legacy counter with recently issued upload URLs", async () => {
    const send = vi.fn().mockResolvedValue({
      ...budgetObject(1000),
      LastModified: new Date(),
      Body: { transformToString: async () => JSON.stringify({ reservedBytes: 1000 }) },
    });
    expect(await reconcileR2UploadBudget({ send } as unknown as S3Client, "photos")).toMatchObject({ reconciled: false });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("reconciles an older legacy counter after its URL grace period", async () => {
    const send = vi.fn()
      .mockResolvedValueOnce({ ETag: "legacy", LastModified: new Date(Date.now() - 2 * 60 * 60 * 1000), Body: { transformToString: async () => JSON.stringify({ reservedBytes: 1000 }) } })
      .mockResolvedValueOnce({ Contents: [{ Key: "assets/existing.webp", Size: 100 }] })
      .mockResolvedValueOnce({});
    expect(await reconcileR2UploadBudget({ send } as unknown as S3Client, "photos")).toMatchObject({ reservedBytes: 100, pendingUploads: 0 });
  });
});
