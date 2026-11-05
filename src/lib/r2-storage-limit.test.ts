import { describe, expect, it, vi } from "vitest";
import { S3Client } from "@aws-sdk/client-s3";
import { R2_UPLOAD_BUDGET_BYTES, reserveR2UploadSpace } from "./r2-storage-limit";

function budgetObject(reservedBytes: number, etag = "version-1") {
  return {
    ETag: etag,
    Body: { transformToString: async () => JSON.stringify({ reservedBytes }) },
  };
}

describe("R2 storage reservations", () => {
  it("blocks a reservation that exceeds the budget without writing", async () => {
    const send = vi.fn().mockResolvedValue(budgetObject(R2_UPLOAD_BUDGET_BYTES - 100));
    expect(await reserveR2UploadSpace({ send } as unknown as S3Client, "photos", 101)).toBe(false);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("atomically reserves space using the current object version", async () => {
    const send = vi.fn().mockResolvedValueOnce(budgetObject(100)).mockResolvedValueOnce({});
    expect(await reserveR2UploadSpace({ send } as unknown as S3Client, "photos", 200)).toBe(true);
    expect(send.mock.calls[1][0].input).toMatchObject({
      IfMatch: "version-1",
      Body: JSON.stringify({ reservedBytes: 300 }),
    });
  });

  it("rechecks capacity when another request wins a reservation", async () => {
    const send = vi.fn()
      .mockResolvedValueOnce(budgetObject(R2_UPLOAD_BUDGET_BYTES - 100))
      .mockRejectedValueOnce(Object.assign(new Error("Conflict"), { name: "PreconditionFailed" }))
      .mockResolvedValueOnce(budgetObject(R2_UPLOAD_BUDGET_BYTES, "version-2"));
    expect(await reserveR2UploadSpace({ send } as unknown as S3Client, "photos", 100)).toBe(false);
    expect(send).toHaveBeenCalledTimes(3);
  });

  it("includes all pages of existing objects before creating the counter", async () => {
    const send = vi.fn()
      .mockRejectedValueOnce(Object.assign(new Error("Missing"), { name: "NoSuchKey" }))
      .mockResolvedValueOnce({ Contents: [{ Size: 100 }], IsTruncated: true, NextContinuationToken: "next-page" })
      .mockResolvedValueOnce({ Contents: [{ Size: 200 }], IsTruncated: false })
      .mockResolvedValueOnce({});
    expect(await reserveR2UploadSpace({ send } as unknown as S3Client, "photos", 50)).toBe(true);
    expect(send.mock.calls[2][0].input.ContinuationToken).toBe("next-page");
    expect(send.mock.calls[3][0].input).toMatchObject({
      IfNoneMatch: "*",
      Body: JSON.stringify({ reservedBytes: 350 }),
    });
  });

  it("fails closed if R2 cannot provide the budget", async () => {
    const send = vi.fn().mockRejectedValue(new Error("Access denied"));
    await expect(reserveR2UploadSpace({ send } as unknown as S3Client, "photos", 100)).rejects.toThrow("Access denied");
    expect(send).toHaveBeenCalledTimes(1);
  });
});
