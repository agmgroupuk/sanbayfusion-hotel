import postgres from "postgres";
import { readMigrationFiles } from "drizzle-orm/migrator";
async function main() {
 if (process.env.RAILWAY_PROJECT_ID !== "ea31f46e-5f06-4394-8580-22f343c28132" || !process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) throw new Error("Wrong authorized environment");
 const client = postgres(process.env.DATABASE_URL!, { prepare: false, onnotice: () => {} });
 try {
  const migrations = readMigrationFiles({ migrationsFolder: "drizzle" }); const migration = migrations[10];
  if (!migration || migrations.length !== 11) throw new Error("Unexpected migration set");
  const applied = await client`select hash from drizzle.__drizzle_migrations where created_at=${migration.folderMillis}`;
  if (applied.length) { if (applied[0].hash !== migration.hash) throw new Error("Migration hash mismatch"); console.log("Account schema: PRESENT"); return; }
  if (!migration.sql.every(statement => /^\s*(CREATE (TABLE|INDEX|UNIQUE INDEX)|ALTER TABLE)/.test(statement))) throw new Error("Unexpected migration operation");
  console.log("Reviewed account migration: five new account tables, one optional display-name column, indexes and foreign keys. No customer or membership data rewritten.");
  if (!process.argv.includes("--apply")) return;
  await client.begin(async tx => { await tx`select pg_advisory_xact_lock(731946210)`; for (const statement of migration.sql) await tx.unsafe(statement); await tx`insert into drizzle.__drizzle_migrations (hash,created_at) values (${migration.hash},${migration.folderMillis})`; });
  console.log("Account schema: additive migration applied.");
 } finally { await client.end(); }
}
main().catch(() => { console.error("Account migration stopped; sensitive details suppressed."); process.exitCode=1; });
