import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../db/schema";

const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/getmyinvite";

const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
};

const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: dbUrl,
    ssl: dbUrl.includes("neon.tech") ? { rejectUnauthorized: false } : undefined,
    max: 2, // Prevent Neon connection limit exhaustion in serverless environments
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 20000,
    keepAlive: true, // Prevent firewall NAT terminations of idle connections
  });

// Prevent idle connection terminations (like Neon scale-down) from crashing Node.js
pool.on("error", (err) => {
  console.error("Unexpected database pool client error:", err);
});

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}

export const db = drizzle(pool, { schema });


