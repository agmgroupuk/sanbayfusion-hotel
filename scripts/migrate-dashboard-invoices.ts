import postgres from "postgres";
import Stripe from "stripe";
import { readMigrationFiles } from "drizzle-orm/migrator";
async function main() {
  if (process.env.RAILWAY_PROJECT_ID !== "ea31f46e-5f06-4394-8580-22f343c28132" || !process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") || !process.env.DATABASE_URL) throw new Error("Sandbox environment guard failed");
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-08-26.dahlia" });
  const account = await stripe.accounts.retrieve(null);
  const balance = await stripe.balance.retrieve(); if (balance.livemode) throw new Error("Sandbox mode required");
  const client = postgres(process.env.DATABASE_URL, { prepare: false, onnotice: () => {} });
  try {
    const migrations = readMigrationFiles({ migrationsFolder: "drizzle" });
    const previous = migrations[11], migration = migrations[12];
    if (!migration?.sql.some(sql => sql.includes("sbf_protect_invoice_application"))) throw new Error("Unexpected migration set");
    const baseline = await client`select hash from drizzle.__drizzle_migrations where created_at=${previous.folderMillis}`;
    if (baseline[0]?.hash !== previous.hash) throw new Error("Apply the reviewed service-month baseline first");
    const existing = await client`select hash from drizzle.__drizzle_migrations where created_at=${migration.folderMillis}`;
    if (existing.length) { if (existing[0].hash !== migration.hash) throw new Error("Migration hash mismatch"); console.log("Dashboard invoice migration already applied."); return; }
    const [tables] = await client`select to_regclass('public.card_verifications') as verification`;
    if (tables.verification) throw new Error("Partial migration needs review");
    console.log(JSON.stringify({ stripeAccount: account.id, mode: "test", migration: "0012_dashboard_invoice_flow", effect: "Add verification ledger and invoice state; protect new submitted snapshots. Preserve historical records." }));
    if (!process.argv.includes("--apply")) { console.log("Read-only migration preflight passed."); return; }
    await client.begin(async tx => {
      await tx`select pg_advisory_xact_lock(731946212)`;
      const applied = await tx`select hash from drizzle.__drizzle_migrations where created_at=${migration.folderMillis}`;
      if (applied.length) { if (applied[0].hash !== migration.hash) throw new Error("Migration hash mismatch"); return; }
      for (const statement of migration.sql) await tx.unsafe(statement);
      await tx`insert into drizzle.__drizzle_migrations (hash, created_at) values (${migration.hash}, ${migration.folderMillis})`;
    });
    console.log("Dashboard invoice schema applied. Existing account and membership data preserved.");
  } finally { await client.end(); }
}
main().catch(error => { const allowed = ["Sandbox environment guard failed", "Sandbox mode required", "Unexpected migration set", "Apply the reviewed service-month baseline first", "Migration hash mismatch", "Partial migration needs review"]; console.error(allowed.includes(error.message) ? error.message : "Migration stopped; connection and error details suppressed."); process.exitCode = 1; });
