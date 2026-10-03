import Stripe from "stripe";
import { membershipPlans } from "@/lib/membership-plans";
import { validateMembershipConfiguration } from "@/lib/membership-request";

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key?.startsWith("sk_test_")) throw new Error("Sandbox key required");
  const stripe = new Stripe(key, { apiVersion: "2026-08-26.dahlia" });
  const year = new Date().getFullYear() + 1;
  for (const purchaseMode of ["membership_only", "membership_with_package"] as const) {
    const quote = validateMembershipConfiguration({ planSlug: membershipPlans[2].slug, selectedServiceMonths: [`${year}-01`, `${year}-02`, `${year}-03`], purchaseMode, foodPreferences: [], deliveryArea: "Bangkok", preferredDay: "Monday", preferredTime: "09:00–12:00", selectedProducts: purchaseMode === "membership_with_package" ? [{ category: "Thai soups", name: "Tom Yum Goong", quantity: 4 }] : [] });
    if (!quote.ok) throw new Error("Pricing validation failed");
    const intent = await stripe.paymentIntents.create({ amount: quote.total * 100, currency: "thb", payment_method_types: ["card"], metadata: { payment_type: "CATALOG_VERIFICATION", purpose: "duration-v3-smoke-check" } });
    if (intent.livemode || intent.amount !== quote.total * 100 || intent.currency !== "thb") throw new Error("Sandbox intent mismatch");
    await stripe.paymentIntents.cancel(intent.id);
    console.log(`${purchaseMode}: Stripe Sandbox accepted THB ${quote.total}; verification intent canceled without payment or customer data changes.`);
  }
}
main().catch(() => { console.error("Sandbox checkout verification failed; sensitive details suppressed."); process.exitCode = 1; });
