import { GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export const R2_UPLOAD_BUDGET_BYTES = 9_000_000_000;
const STORAGE_BUDGET_KEY = "_system/upload-budget.json";

export async function reserveR2UploadSpace(client: S3Client, bucket: string, sizeBytes: number): Promise<boolean> {
  for (let attempt = 0; attempt < 5; attempt++) {
    let reservedBytes = 0;
    let budgetEtag: string | undefined;

    try {
      const budget = await client.send(new GetObjectCommand({ Bucket: bucket, Key: STORAGE_BUDGET_KEY }));
      if (!budget.Body || !budget.ETag) throw new Error("R2 upload budget is unreadable");
      const storedBudget: unknown = JSON.parse(await budget.Body.transformToString());
      if (!storedBudget || typeof storedBudget !== "object" || !("reservedBytes" in storedBudget) ||
        !Number.isSafeInteger(storedBudget.reservedBytes) || typeof storedBudget.reservedBytes !== "number" || storedBudget.reservedBytes < 0) {
        throw new Error("R2 upload budget is invalid");
      }
      reservedBytes = storedBudget.reservedBytes;
      budgetEtag = budget.ETag;
    } catch (error) {
      if (!(error instanceof Error) || error.name !== "NoSuchKey") throw error;

      // Seed the counter with all existing objects before reserving new uploads.
      let continuationToken: string | undefined;
      do {
        const objects = await client.send(new ListObjectsV2Command({
          Bucket: bucket,
          ContinuationToken: continuationToken,
        }));
        for (const object of objects.Contents ?? []) {
          if (object.Size === undefined) throw new Error("R2 object size is unavailable");
          reservedBytes += object.Size;
        }
        if (objects.IsTruncated && !objects.NextContinuationToken) {
          throw new Error("R2 storage listing is incomplete");
        }
        continuationToken = objects.IsTruncated ? objects.NextContinuationToken : undefined;
      } while (continuationToken);
    }

    if (reservedBytes + sizeBytes > R2_UPLOAD_BUDGET_BYTES) return false;

    try {
      await client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: STORAGE_BUDGET_KEY,
        Body: JSON.stringify({ reservedBytes: reservedBytes + sizeBytes }),
        ContentType: "application/json",
        // Conditional writes prevent simultaneous requests from sharing the same remaining space.
        ...(budgetEtag ? { IfMatch: budgetEtag } : { IfNoneMatch: "*" }),
      }));
      return true;
    } catch (error) {
      if (!(error instanceof Error) || !["PreconditionFailed", "ConditionalRequestConflict"].includes(error.name)) throw error;
    }
  }
  throw new Error("R2 upload budget is busy. Please retry.");
}
