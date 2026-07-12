import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../db/schema";

const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/makemyinvite";

const pool = new Pool({
  connectionString: dbUrl,
  ssl: dbUrl.includes("neon.tech") ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool, { schema });

