import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invitations } from "@/db/schema";
import { and, eq, lt } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    // 1. Optional security check (Cron Secret validation)
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret");
    
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get("authorization");
    
    if (cronSecret) {
      const isAuthorized = 
        secret === cronSecret || 
        authHeader === `Bearer ${cronSecret}`;
        
      if (!isAuthorized) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // 2. Clear drafts older than 7 days based on creation date
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    await db
      .delete(invitations)
      .where(
        and(
          eq(invitations.status, "draft"),
          lt(invitations.createdAt, sevenDaysAgo)
        )
      );

    return NextResponse.json({
      ok: true,
      message: "Expired drafts cleaned up successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Cleanup drafts cron error:", err);
    return NextResponse.json({ error: err.message || "Failed to cleanup drafts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}
