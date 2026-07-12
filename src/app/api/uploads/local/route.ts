import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

export async function PUT(req: Request) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    if (!key) {
      return NextResponse.json({ error: "Missing key" }, { status: 400 });
    }

    // Safety check to prevent directory traversal
    if (key.includes("..")) {
      return NextResponse.json({ error: "Invalid key" }, { status: 400 });
    }

    const arrayBuffer = await req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Write file to public/uploads/[key]
    const destPath = path.join(process.cwd(), "public", "uploads", key);
    const destDir = path.dirname(destPath);

    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    fs.writeFileSync(destPath, buffer);

    return NextResponse.json({
      ok: true,
      url: `/uploads/${key}`,
    });
  } catch (err: any) {
    console.error("Local mock upload error:", err);
    return NextResponse.json({ error: err.message || "Failed to upload file locally" }, { status: 500 });
  }
}
export async function POST(req: Request) {
  return PUT(req);
}
