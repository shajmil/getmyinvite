import { head } from "@vercel/blob";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key } = await params;
  if (key[0] !== "assets" || key.some(segment => !segment || segment === "." || segment === ".." || /[\\/]/.test(segment))) {
    return new Response("Not Found", { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  const filePath = key.join("/");

  if (process.env.R2_PUBLIC_URL) {
    const r2Url = `${process.env.R2_PUBLIC_URL.replace(/\/$/, "")}/${key.map(encodeURIComponent).join("/")}`;
    try {
      const r2Response = await fetch(r2Url);
      if (r2Response.ok) {
        return new Response(r2Response.body, {
          headers: {
            "Content-Type": r2Response.headers.get("Content-Type") || "image/webp",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }
    } catch {
      // Legacy photos can still be available in Blob when R2 is unavailable.
    }
  }

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blobMeta = await head(filePath);
      const blobRes = await fetch(blobMeta.url);

      if (!blobRes.ok) {
        return new Response(null, {
          status: blobRes.status,
          headers: { "Cache-Control": "no-store" },
        });
      }

      return new Response(blobRes.body, {
        headers: {
          "Content-Type": blobMeta.contentType || "image/webp",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch (err) {
      console.error("Vercel Blob fetch error:", err);
      return new Response("Not Found in Vercel Blob", {
        status: 404,
        headers: { "Cache-Control": "no-store" },
      });
    }
  }

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
