import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { stripeMembershipCatalog } from "@/lib/db/schema";
import { membershipPlans } from "@/lib/membership-plans";

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey?.startsWith("sk_test_")) throw new Error("Sandbox sync requires a Stripe test-mode secret key.");
if (!db) throw new Error("DATABASE_URL is required for catalog synchronization.");

const stripe = new Stripe(secretKey, { apiVersion: "2026-08-26.dahlia" });

async function findProduct(plan: (typeof membershipPlans)[number]) {
  const byMetadata = await stripe.products.search({ query: `metadata['sanbay_plan_id']:'${plan.id}'` });
  if (byMetadata.data[0]) return byMetadata.data[0];
  const bySlug = await stripe.products.search({ query: `metadata['sanbay_plan_slug']:'${plan.slug}'` });
  return bySlug.data[0] ?? null;
}

async function syncPlan(plan: (typeof membershipPlans)[number]) {
  let product = await findProduct(plan);
  if (!product) {
    product = await stripe.products.create({
      name: plan.name,
      description: `${plan.name} - 12-month Sanbay Fusion membership`,
      metadata: { sanbay_plan_id: plan.id, sanbay_plan_slug: plan.slug, membership_validity_months: String(plan.validityMonths), environment: "sandbox" },
    });
  } else {
    product = await stripe.products.update(product.id, {
      name: plan.name,
      description: `${plan.name} - 12-month Sanbay Fusion membership`,
      metadata: { ...product.metadata, sanbay_plan_id: plan.id, sanbay_plan_slug: plan.slug, membership_validity_months: String(plan.validityMonths), environment: "sandbox" },
    });
  }

  const prices = await stripe.prices.list({ product: product.id, active: true, limit: 100 });
  let price = prices.data.find((candidate) => candidate.type === "one_time" && candidate.currency === "thb" && candidate.unit_amount === plan.price * 100);
  if (!price) {
    price = await stripe.prices.create({
      product: product.id,
      currency: "thb",
      unit_amount: plan.price * 100,
      metadata: { sanbay_plan_id: plan.id, sanbay_plan_slug: plan.slug, environment: "sandbox" },
    });
  }

  await db.insert(stripeMembershipCatalog).values({ planId: plan.id, planSlug: plan.slug, productId: product.id, priceId: price.id, amount: plan.price * 100, currency: "thb", mode: "test", updatedAt: new Date() }).onConflictDoUpdate({ target: stripeMembershipCatalog.planId, set: { planSlug: plan.slug, productId: product.id, priceId: price.id, amount: plan.price * 100, currency: "thb", mode: "test", updatedAt: new Date() } });
  return { plan, product, price };
}

async function main() {
  const synced = [];
  for (const plan of membershipPlans) synced.push(await syncPlan(plan));
  for (const item of synced) console.log(`${item.plan.id}\t${item.plan.slug}\t${item.plan.price}\t${item.product.id}\t${item.price.id}`);
  console.log(`Synced ${synced.length} Sandbox membership plans.`);
}

void main();
