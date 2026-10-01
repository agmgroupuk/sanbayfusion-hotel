from pathlib import Path
root=Path(__file__).resolve().parents[1]
(root/'scripts/sync-stripe-memberships.ts').write_text('''import Stripe from "stripe";
import { inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { stripeMembershipCatalog } from "@/lib/db/schema";
import { membershipPlans } from "@/lib/membership-plans";

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey?.startsWith("sk_test_")) throw new Error("Sandbox sync requires a Stripe test-mode secret key.");
const stripe = new Stripe(secretKey, { apiVersion: "2026-08-26.dahlia" });

async function main() {
  const database = db;
  if (!database) throw new Error("DATABASE_URL is required for catalog synchronization.");
  // Preflight before any Stripe mutation. Only the catalog table is written.
  await database.select({ planId: stripeMembershipCatalog.planId }).from(stripeMembershipCatalog).limit(1);
  const allProducts = [];
  for await (const product of stripe.products.list({ limit: 100 })) {
    if (product.livemode) throw new Error("Live data detected; refusing synchronization.");
    allProducts.push(product);
  }
  const synced = [];
  for (const plan of membershipPlans) {
    const metadata = { sanbay_plan_id: plan.id, sanbay_plan_slug: plan.slug, duration_months: String(plan.durationMonths), environment: "sandbox", catalog_version: "duration-v3" };
    let product = allProducts.find(item => item.metadata.sanbay_plan_id === plan.id);
    if (!product) product = await stripe.products.create({ name: plan.name, description: `${plan.durationMonths} calendar months from final admin activation. One-time membership payment.`, metadata }, { idempotencyKey: `duration-v3-product-${plan.id}` });
    else product = await stripe.products.update(product.id, { name: plan.name, description: `${plan.durationMonths} calendar months from final admin activation. One-time membership payment.`, active: true, metadata });
    if (product.livemode) throw new Error("Live product detected");
    const prices = [];
    for await (const price of stripe.prices.list({ product: product.id, limit: 100 })) prices.push(price);
    let price = prices.find(item => item.active && item.type === "one_time" && item.currency === "thb" && item.unit_amount === plan.price * 100);
    if (!price) price = await stripe.prices.create({ product: product.id, currency: "thb", unit_amount: plan.price * 100, metadata }, { idempotencyKey: `duration-v3-price-${product.id}-${plan.price}` });
    if (price.livemode || price.type !== "one_time") throw new Error("Invalid Sandbox price");
    for (const old of prices) if (old.active && old.id !== price.id) await stripe.prices.update(old.id, { active: false });
    await stripe.products.update(product.id, { default_price: price.id });
    synced.push({ plan, product, price });
  }
  await database.transaction(async tx => {
    for (const { plan, product, price } of synced) {
      const mapping = { planId: plan.id, planSlug: plan.slug, productId: product.id, priceId: price.id, amount: plan.price * 100, currency: "thb", mode: "test", updatedAt: new Date() };
      await tx.insert(stripeMembershipCatalog).values(mapping).onConflictDoUpdate({ target: stripeMembershipCatalog.planId, set: mapping });
    }
    // Historical mappings remain queryable, but can no longer be selected for new purchases.
    const legacyIds = Array.from({ length: 20 }, (_, index) => String(index + 1).padStart(2, "0"));
    await tx.update(stripeMembershipCatalog).set({ mode: "archived", updatedAt: new Date() }).where(inArray(stripeMembershipCatalog.planId, legacyIds));
  });
  const keep = new Set(synced.map(item => item.product.id));
  const knownPlans = new Set([...membershipPlans.map(plan => plan.id), ...Array.from({ length: 20 }, (_, i) => String(i + 1).padStart(2, "0"))]);
  for (const product of allProducts) {
    if (!product.active || keep.has(product.id) || !knownPlans.has(product.metadata.sanbay_plan_id)) continue;
    for await (const price of stripe.prices.list({ product: product.id, active: true, limit: 100 })) {
      if (price.livemode) throw new Error("Live price detected");
      await stripe.prices.update(price.id, { active: false });
    }
    await stripe.products.update(product.id, { active: false });
  }
  const mappings = await database.select().from(stripeMembershipCatalog).where(inArray(stripeMembershipCatalog.planId, membershipPlans.map(plan => plan.id)));
  if (mappings.length !== 12 || synced.some(({ plan, price }) => !mappings.some(row => row.planId === plan.id && row.priceId === price.id && row.amount === plan.price * 100 && row.mode === "test"))) throw new Error("Catalog verification failed");
  let activeCount = 0;
  for await (const product of stripe.products.list({ active: true, limit: 100 })) if (knownPlans.has(product.metadata.sanbay_plan_id)) activeCount++;
  if (activeCount !== 12) throw new Error("Expected exactly twelve active Sandbox membership products");
  for (const { plan } of synced) console.log(`${plan.name}: THB ${plan.price}, ${plan.durationMonths} months, one-time, mapping verified`);
  console.log("Verified 12 active Sandbox products and prices. Legacy products/prices archived; historical mappings retained. No customer or membership records changed.");
}
main().then(() => process.exit(0)).catch(() => { console.error("Sandbox catalog synchronization failed; sensitive error details suppressed."); process.exit(1); });
''',encoding='utf-8')
