import "server-only";

import Stripe from "stripe";
import { membershipPlans } from "@/lib/membership-plans";

export const stripeMembershipCatalog = membershipPlans.map((plan) => ({
  internalPlanId: plan.slug,
  internalPlanName: plan.name,
  amount: plan.price,
  currency: "thb",
  stripeProductName: `Sanbay Fusion ${plan.name}`,
}));

export function getMembershipPlanForStripe(planSlug: string) {
  return membershipPlans.find((plan) => plan.slug === planSlug) ?? null;
}

export function getStripeAmountInMinorUnits(amount: number) {
  const safeAmount = Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : 0;
  return safeAmount * 100;
}

export function resolveStripeCustomerId(customerId: string | null | undefined) {
  if (!customerId || !customerId.startsWith("cus_")) return null;
  return customerId;
}

export async function ensureStripeCustomerForAccount({ stripe, account, email, fullName }: { stripe: Stripe; account: { id: string; email: string; fullName: string | null; stripeCustomerId?: string | null }; email?: string; fullName?: string | null }) {
  if (account.stripeCustomerId) {
    return account.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: email ?? account.email,
    name: fullName ?? account.fullName ?? undefined,
    metadata: {
      sanbayAccountId: account.id,
      accountType: "customer",
    },
  });

  return customer.id;
}
