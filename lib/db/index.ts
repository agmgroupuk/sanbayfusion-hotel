import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;

/** True when a Postgres/Supabase connection is configured. */
export const dbConfigured = Boolean(url);

// Reuse the client across hot reloads / fluid invocations.
const globalForDb = globalThis as unknown as {
  __mnPg?: ReturnType<typeof postgres>;
};

const client =
  url !== undefined
    ? (globalForDb.__mnPg ??= postgres(url, { prepare: false }))
    : null;

export const db = client ? drizzle(client, { schema }) : null;
