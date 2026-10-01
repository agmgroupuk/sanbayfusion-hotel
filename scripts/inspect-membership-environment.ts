import postgres from "postgres";
import Stripe from "stripe";

async function main() {
  for (const name of ["STRIPE_SECRET_KEY", "DATABASE_URL", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "STRIPE_WEBHOOK_SECRET"]) {
    const value = process.env[name];
    const wrongMode = (name === "STRIPE_SECRET_KEY" && value && !value.startsWith("sk_test_")) || (name === "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" && value && !value.startsWith("pk_test_"));
    console.log(`${name}: ${value === undefined ? "MISSING" : !value.trim() ? "EMPTY" : wrongMode ? "WRONG MODE" : "PRESENT"}`);
  }
  const url = process.env.DATABASE_URL;
  if (url) {
    const parsed = new URL(url);
    console.log(`Database target: host=${parsed.hostname}, database=${parsed.pathname.slice(1)}`);
    const sql = postgres(url, { prepare: false, connect_timeout: 15 });
    try {
      const rows = await sql`select plan_id, plan_slug, amount, currency, mode from stripe_membership_catalog order by plan_id`;
      console.log(JSON.stringify({ catalogMappings: rows }));
    } catch { console.log("Database catalog inspection: connection or query failed (details suppressed)"); }
    finally { await sql.end({ timeout: 5 }); }
  }
  const key = process.env.STRIPE_SECRET_KEY;
  if (key?.startsWith("sk_test_")) {
    const stripe = new Stripe(key, { apiVersion: "2026-08-26.dahlia" });
    const products = [];
    for await (const product of stripe.products.list({ limit: 100 })) {
      if (product.livemode) throw new Error("Unexpected live product; inspection stopped");
      if (product.metadata.sanbay_plan_id) products.push({ id: product.id, name: product.name, active: product.active, planId: product.metadata.sanbay_plan_id });
    }
    console.log(JSON.stringify({ sandboxMembershipProducts: products }));
  }
}
main().catch(() => { console.error("Environment inspection failed; sensitive error details suppressed."); process.exitCode = 1; });
