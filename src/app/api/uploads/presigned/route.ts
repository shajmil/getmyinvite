import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { reserveR2UploadSpace, R2_UPLOAD_URL_TTL_SECONDS } from "@/lib/r2-storage-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // 1. Authenticate user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { filename, contentType, size } = await req.json();

    if (typeof filename !== "string" || !filename.trim() || typeof size !== "number" || !Number.isSafeInteger(size) || size <= 0) {
      return NextResponse.json({ error: "A filename and valid file size are required" }, { status: 400 });
    }

    // Limit files to 8MB
    if (size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "File exceeds 8MB size limit" }, { status: 400 });
    }

    // MIME list checks
    const allowedMime = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "video/mp4",
      "audio/mpeg",
      "audio/mp3",
    ];
    if (!allowedMime.includes(contentType)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // R2 Settings
    const r2Variables = [
      "R2_ACCOUNT_ID",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
      "R2_BUCKET_NAME",
      "R2_PUBLIC_URL",
    ] as const;
    const hasR2Settings = r2Variables.some((name) => process.env[name]?.trim());
    const missingR2Variables = r2Variables.filter((name) => !process.env[name]?.trim());
    if (hasR2Settings && missingR2Variables.length > 0) {
      console.error("Incomplete R2 configuration. Missing:", missingR2Variables.join(", "));
      return NextResponse.json(
        { error: "R2 uploads are not fully configured. Add all five R2 environment variables to the deployment environment and redeploy." },
        { status: 503 }
      );
    }
    const hasR2 = hasR2Settings && missingR2Variables.length === 0;

    const fileId = crypto.randomUUID();
    const fileExtension = filename.split(".").pop();
    const key = `assets/${session.user.id}/${fileId}.${fileExtension}`;

    if (hasR2) {
      // Import AWS S3 SDK dynamically to avoid bundling issues if not used
      const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
      const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

      const s3 = new S3Client({
        region: "auto",
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID!,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        },
        requestChecksumCalculation: "WHEN_REQUIRED",
      });

      const hasUploadSpace = await reserveR2UploadSpace(s3, process.env.R2_BUCKET_NAME!, size, key);
      if (!hasUploadSpace) {
        return NextResponse.json(
          { error: "Photo storage is full for now. Please message us on Instagram for help." },
          { status: 507 }
        );
      }

      const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        ContentType: contentType,
        ContentLength: size,
      });

      const uploadUrl = await getSignedUrl(s3, command, {
        expiresIn: R2_UPLOAD_URL_TTL_SECONDS,
        signableHeaders: new Set(["content-length", "content-type"]),
      });
      const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

      return NextResponse.json({
        uploadUrl,
        publicUrl,
        key,
        isLocal: false,
      }); 
    } else {
      // Local development mock fallback
      const mockUploadUrl = `/api/uploads/local?key=${encodeURIComponent(key)}`;
      const mockPublicUrl = `/uploads/${key}`;

      return NextResponse.json({
        uploadUrl: mockUploadUrl,
        publicUrl: mockPublicUrl,
        key,
        isLocal: true,
      });
    }
  } catch (err: unknown) {
    console.error("presigned upload route error:", err);
    return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
  }
}
