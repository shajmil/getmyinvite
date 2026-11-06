import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import { drizzle as neonDrizzle } from "drizzle-orm/neon-serverless";
import { cache } from "react";
import * as schema from "../db/schema";

// Regular queries use HTTPS; interactive transactions retain a WebSocket connection.
neonConfig.poolQueryViaFetch = true;

export const getDb = cache(() => {
  const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/getmyinvite";
  if (new URL(dbUrl).hostname.endsWith(".neon.tech")) {
    const pool = new NeonPool({
      connectionString: dbUrl,
      max: 2,
      maxUses: 1,
      connectionTimeoutMillis: 20000,
    });
    pool.on("error", (error: Error) => {
      console.error("Unexpected Neon pool client error:", error);
    });
    return neonDrizzle(pool, { schema });
  }

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


