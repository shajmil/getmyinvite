import { GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { z } from "zod";

export const R2_UPLOAD_BUDGET_BYTES = 9_000_000_000;
export const R2_UPLOAD_URL_TTL_SECONDS = 900;
const STORAGE_BUDGET_KEY = "_system/upload-budget.json";
const LEGACY_UPLOAD_GRACE_MS = 60 * 60 * 1000;
const storageBudgetSchema = z.object({
  reservedBytes: z.number().int().nonnegative(),
  pendingUploads: z.array(z.object({
    key: z.string().startsWith("assets/"),
    sizeBytes: z.number().int().positive(),
    expiresAt: z.number().int().positive(),
    uploaded: z.boolean().optional(),
  })).optional(),
  legacyReconcileAfter: z.number().int().positive().optional(),
});
type StorageBudget = z.infer<typeof storageBudgetSchema>;

async function readStorageBudget(client: S3Client, bucket: string) {
  try {
    const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: STORAGE_BUDGET_KEY }));
    if (!result.Body || !result.ETag) throw new Error("R2 upload budget is unreadable");
    return {
      budget: storageBudgetSchema.parse(JSON.parse(await result.Body.transformToString())),
      etag: result.ETag,
      lastModified: result.LastModified,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "NoSuchKey") return null;
    throw error;
  }
}

async function listStoredUploads(client: S3Client, bucket: string) {
  let bytes = 0;
  const keys = new Set<string>();
  let continuationToken: string | undefined;
  do {
    const result = await client.send(new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: continuationToken }));
    for (const object of result.Contents ?? []) {
      if (object.Size === undefined || !object.Key) throw new Error("R2 object size or key is unavailable");
      bytes += object.Size;
      keys.add(object.Key);
    }
    if (result.IsTruncated && !result.NextContinuationToken) throw new Error("R2 storage listing is incomplete");
    continuationToken = result.IsTruncated ? result.NextContinuationToken : undefined;
  } while (continuationToken);
  return { bytes, keys };
}

function isWriteConflict(error: unknown): boolean {
  return error instanceof Error && ["PreconditionFailed", "ConditionalRequestConflict"].includes(error.name);
}

async function writeStorageBudget(client: S3Client, bucket: string, budget: StorageBudget, etag?: string) {
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: STORAGE_BUDGET_KEY,
    Body: JSON.stringify(budget),
    ContentType: "application/json",
    ...(etag ? { IfMatch: etag } : { IfNoneMatch: "*" }),
  }));
}

export async function reserveR2UploadSpace(client: S3Client, bucket: string, sizeBytes: number, key: string): Promise<boolean> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const current = await readStorageBudget(client, bucket);
    const reservedBytes = current?.budget.reservedBytes ?? (await listStoredUploads(client, bucket)).bytes;
    if (reservedBytes + sizeBytes > R2_UPLOAD_BUDGET_BYTES) return false;
    const budget: StorageBudget = {
      ...current?.budget,
      reservedBytes: reservedBytes + sizeBytes,
      pendingUploads: [...(current?.budget.pendingUploads ?? []), {
        key, sizeBytes, expiresAt: Date.now() + R2_UPLOAD_URL_TTL_SECONDS * 1000 + LEGACY_UPLOAD_GRACE_MS,
      }],
    };
    if (current && !current.budget.pendingUploads) {
      // Old counters did not record upload keys; let their issued URLs expire before recalculating.
      budget.legacyReconcileAfter = Date.now() + LEGACY_UPLOAD_GRACE_MS;
    }
    try {
      await writeStorageBudget(client, bucket, budget, current?.etag);
      return true;
    } catch (error) {
      if (!isWriteConflict(error)) throw error;
    }
  }
  throw new Error("R2 upload budget is busy. Please retry.");
}

export async function reconcileR2UploadBudget(client: S3Client, bucket: string) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const current = await readStorageBudget(client, bucket);
    if (!current) return { reconciled: false, reason: "Budget not created yet" };
    const snapshotTime = Date.now();
    const legacyReconcileAfter = current.budget.legacyReconcileAfter ??
      (!current.budget.pendingUploads ? (current.lastModified?.getTime() ?? snapshotTime) + LEGACY_UPLOAD_GRACE_MS : 0);
    if (snapshotTime < legacyReconcileAfter) {
      return { reconciled: false, reason: "Waiting for legacy upload URLs to expire" };
    }

    const stored = await listStoredUploads(client, bucket);
    const pendingUploads = (current.budget.pendingUploads ?? []).map((upload) => ({
      ...upload, uploaded: upload.uploaded || stored.keys.has(upload.key),
    })).filter((upload) => upload.expiresAt > snapshotTime || !upload.uploaded);
    // Keep unconfirmed and still-valid uploads reserved, even when this temporarily counts bytes twice.
    const reservedBytes = stored.bytes + pendingUploads.reduce((total, upload) => total + upload.sizeBytes, 0);
    try {
      await writeStorageBudget(client, bucket, { reservedBytes, pendingUploads }, current.etag);
      return { reconciled: true, reservedBytes, pendingUploads: pendingUploads.length };
    } catch (error) {
      if (!isWriteConflict(error)) throw error;
    }
  }
  throw new Error("R2 upload budget changed during reconciliation. Please retry.");
}
