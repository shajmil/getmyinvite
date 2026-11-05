import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { S3Client } from "@aws-sdk/client-s3";
import { cleanupExpiredInvitations } from "@/db/queries/invitation";
import { reconcileR2UploadBudget } from "@/lib/r2-storage-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function reconcileStorage() {
  const requiredSettings = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME", "R2_PUBLIC_URL"];
  if (requiredSettings.every((name) => !process.env[name]?.trim())) {
    return { reconciled: false, reason: "R2 is not configured" };
  }
  if (requiredSettings.some((name) => !process.env[name]?.trim())) {
    throw new Error("R2 configuration is incomplete");
  }
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
  });
  return reconcileR2UploadBudget(client, process.env.R2_BUCKET_NAME!);
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "Cleanup is disabled until CRON_SECRET is configured" }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Observe completed uploads before deleting files so their reservations can be reconciled safely.
    await reconcileStorage();
    const cleanup = await cleanupExpiredInvitations();
    for (const slug of cleanup.deletedSlugs) revalidatePath(`/${slug}`);
    const storage = await reconcileStorage();
    const summary = {
      ok: cleanup.failed === 0,
      deletedInvitations: cleanup.deletedSlugs.length,
      failedInvitations: cleanup.failed,
      remainingInvitations: cleanup.remaining,
      storage,
      timestamp: new Date().toISOString(),
    };
    console.info("Daily invitation cleanup:", summary);
    return NextResponse.json(summary, { status: cleanup.failed ? 500 : 200 });
  } catch (error) {
    console.error("Daily invitation cleanup failed:", error);
    return NextResponse.json({ error: "Cleanup failed. Check server logs before retrying." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}
