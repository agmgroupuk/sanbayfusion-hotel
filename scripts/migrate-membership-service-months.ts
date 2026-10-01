import postgres from "postgres";
import { readMigrationFiles } from "drizzle-orm/migrator";

/** Add only the reviewed calendar-month migration to an already baselined database. */
async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL required");
  const client = postgres(process.env.DATABASE_URL, { prepare: false, onnotice: () => {} });
  try {
    const migrations = readMigrationFiles({ migrationsFolder: "drizzle" });
    const migration = migrations[11];
    if (!migration || !migration.sql.some(statement => statement.includes("sbf_check_service_month_agreement"))) throw new Error("Unexpected migration set");
    const columns = await client`select column_name from information_schema.columns where table_schema='public' and table_name='membership_requests'`;
    const has = (name: string) => columns.some(column => column.column_name === name);
    if (!["customer_account_id", "validity_months", "purchase_snapshot", "application_snapshot", "submitted_at"].every(has)) throw new Error("Unexpected membership baseline");
    const applied = await client`select hash from drizzle.__drizzle_migrations where created_at=${migration.folderMillis}`;
    if (applied.length) {
      if (applied[0].hash !== migration.hash) throw new Error("Migration hash mismatch");
      console.log("Service-month migration already applied."); return;
    }
    const [existing] = await client`select to_regclass('public.membership_benefit_redemptions') as benefits`;
    if (has("selected_service_months") || existing.benefits) throw new Error("Partial migration requires review");
    console.log("Ready: add selected service months, a unique monthly benefit ledger, and agreement immutability validation. Existing agreements are preserved.");
    if (!process.argv.includes("--apply")) { console.log("Read-only preflight. Use --apply to apply this migration to the configured database."); return; }
    await client.begin(async tx => {
      await tx`select pg_advisory_xact_lock(731946211)`;
      const already = await tx`select hash from drizzle.__drizzle_migrations where created_at=${migration.folderMillis}`;
      if (already.length) { if (already[0].hash !== migration.hash) throw new Error("Migration hash mismatch"); return; }
      for (const statement of migration.sql) await tx.unsafe(statement);
      await tx`insert into drizzle.__drizzle_migrations (hash, created_at) values (${migration.hash}, ${migration.folderMillis})`;
    });
    console.log("Service-month schema applied; existing membership, account and payment data preserved.");
  } finally { await client.end(); }
}
main().catch(() => { console.error("Service-month migration stopped. Check the database baseline and migration ledger; connection details suppressed."); process.exitCode = 1; });
