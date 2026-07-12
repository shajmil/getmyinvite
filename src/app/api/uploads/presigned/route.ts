import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

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
    const hasR2 =
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME;

    const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
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
      });

      const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        ContentType: contentType,
      });

      const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
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
  } catch (err: any) {
    console.error("presigned upload route error:", err);
    return NextResponse.json({ error: err.message || "Failed to generate upload URL" }, { status: 500 });
  }
}
