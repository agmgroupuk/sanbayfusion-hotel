import postgres from "postgres";
import { readMigrationFiles } from "drizzle-orm/migrator";
async function main() {
  if (!process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) throw new Error("Sandbox required");
  for (const name of ["STRIPE_SECRET_KEY", "DATABASE_URL", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "STRIPE_WEBHOOK_SECRET"]) {
    const value = process.env[name];
    console.log(`${name}: ${value === undefined ? "MISSING" : !value.trim() ? "EMPTY" : name === "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" && !value.startsWith("pk_test_") ? "WRONG MODE" : "PRESENT"}`);
  }
  const client = postgres(process.env.DATABASE_URL!, { prepare: false, onnotice: () => {} });
  try {
    const migrations = readMigrationFiles({ migrationsFolder: "drizzle" });
    const columns = await client`select column_name from information_schema.columns where table_schema='public' and table_name='membership_requests'`;
    const has = (name: string) => columns.some(c => c.column_name === name);
    if (!["customer_account_id", "stripe_payment_intent_id", "final_membership_snapshot", "validity_months"].every(has)) throw new Error("Unexpected baseline schema");
    const [table] = await client`select to_regclass('public.membership_delivery_entitlements') as present`;
    const pending = [!has("purchase_snapshot") ? migrations[7] : null, !table.present ? migrations[8] : null, !has("application_snapshot") ? migrations[9] : null].filter(m => m !== null);
    if (pending.length === 0) { console.log("Required application schema already present."); return; }
    console.log(`Preflight: ${pending.length} explicitly selected additive migrations (purchase snapshot, delivery ledger if absent, application fields). Historical migration ledger will be preserved.`);
    if (!process.argv.includes("--apply")) return;
    await client.begin(async tx => {
      await tx`select pg_advisory_xact_lock(731946209)`;
      for (const migration of pending) {
        for (const statement of migration.sql) await tx.unsafe(statement);
        await tx`insert into drizzle.__drizzle_migrations (hash, created_at) values (${migration.hash}, ${migration.folderMillis})`;
      }
    });
    console.log("Additive schema applied. No existing customer, membership or payment rows changed.");
  } finally { await client.end(); }
}
main().catch(error => { console.error(`Migration stopped: ${["Unexpected baseline schema", "Sandbox required"].includes(error.message) ? error.message : "database operation failed; sensitive details suppressed"}`); process.exitCode = 1; });
