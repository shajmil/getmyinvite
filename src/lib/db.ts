import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { cache } from "react";
import * as schema from "../db/schema";

export const getDb = cache(() => {
  const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/getmyinvite";
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: dbUrl.includes("neon.tech") ? { rejectUnauthorized: false } : undefined,
    max: 2,
    // Workers cannot reuse a connection opened by another request.
    maxUses: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 20000,
    keepAlive: true,
  });

  pool.on("error", (error) => {
    console.error("Unexpected database pool client error:", error);
  });
  return drizzle(pool, { schema });
});


