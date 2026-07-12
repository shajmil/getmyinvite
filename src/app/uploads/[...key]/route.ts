import { NextResponse } from "next/server";
import { head } from "@vercel/blob";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  props: { params: Promise<{ key: string[] }> }
) {
  const { key } = await props.params;
  const filePath = key.join("/");

  // 1. If Vercel Blob is active in production, fetch and stream the file
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blobMeta = await head(filePath);
      const blobRes = await fetch(blobMeta.url);

      return new Response(blobRes.body, {
        headers: {
          "Content-Type": blobMeta.contentType || "image/webp",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch (err) {
      console.error("Vercel Blob fetch error:", err);
      return new Response("Not Found in Vercel Blob", { status: 404 });
    }
  }

  // 2. Fallback to reading the local static directory (for local development)
  const fullPath = path.join(process.cwd(), "public", "uploads", filePath);
  if (!fs.existsSync(fullPath)) {
    return new Response("Not Found on Local Disk", { status: 404 });
  }

  const fileBuffer = fs.readFileSync(fullPath);
  const ext = path.extname(fullPath).toLowerCase();
  
  let contentType = "image/webp";
  if (ext === ".png") contentType = "image/png";
  if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
  if (ext === ".gif") contentType = "image/gif";
  if (ext === ".mp4") contentType = "video/mp4";
  if (ext === ".mpeg" || ext === ".mp3") contentType = "audio/mpeg";

  return new Response(fileBuffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
