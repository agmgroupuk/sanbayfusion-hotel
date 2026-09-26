import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentAccount } from "@/lib/auth";
import { db } from "@/lib/db";
import { customerAccounts, membershipRequests } from "@/lib/db/schema";
import { membershipPlans } from "@/lib/membership-plans";
import { readMembershipCheckoutSelection } from "@/lib/membership-checkout";
import { stripe } from "@/lib/stripe";

export async function POST() {
  const account = await getCurrentAccount();
  if (!account) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const selection = await readMembershipCheckoutSelection();
  if (!selection) {
    return NextResponse.json({ error: "No membership plan has been selected." }, { status: 400 });
  }

  const plan = membershipPlans.find((item) => item.slug === selection.planSlug);
  if (!plan) {
    return NextResponse.json({ error: "Membership plan not found." }, { status: 404 });
  }

  if (!db || !stripe) {
    console.error("[membership payment-intent] Stripe is not configured: missing STRIPE_SECRET_KEY or environment settings.");
    return NextResponse.json({ error: "Stripe Sandbox credentials are not configured for this environment. Add STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY before checkout can run." }, { status: 503 });
  }

  try {
    let stripeCustomerId = account.stripeCustomerId ?? null;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: account.email,
        name: account.fullName ?? undefined,
        metadata: { sanbayAccountId: account.id, accountType: "customer" },
      });
      stripeCustomerId = customer.id;
      await db.update(customerAccounts).set({ stripeCustomerId, updatedAt: new Date() }).where(eq(customerAccounts.id, account.id));
    }

    let membership = (await db.select().from(membershipRequests).where(eq(membershipRequests.email, account.email)).limit(1))[0];
    if (!membership) {
      const requestNumber = `M-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const inserted = await db.insert(membershipRequests).values({
        customerAccountId: account.id,
        requestNumber,
        planId: plan.id,
        planName: plan.name,
        planSnapshot: { slug: plan.slug, name: plan.name, price: plan.price, description: plan.description },
        annualFee: plan.price,
        addOnTotal: 0,
        estimatedTotal: plan.price,
        validityMonths: plan.validityMonths,
        deliveryDays: plan.deliveryDays,
        annualDeliveryDays: plan.deliveryDaysPerYear,
        fullName: account.fullName ?? "",
        phone: account.phone ?? "",
        email: account.email,
        address: { city: "Bangkok", country: "Thailand" },
        contactPreferences: { email: true, sms: true },
        configuration: selection.configuration ?? {},
        status: "payment_pending",
        invoiceStatus: "awaiting_payment",
        stripeCustomerId,
        stripeInvoiceId: null,
        stripePaymentIntentId: null,
        memberId: null,
        membershipNumber: null,
        membershipStartDate: null,
        membershipExpiryDate: null,
        finalMembershipSnapshot: null,
        notes: null,
        allergies: null,
      }).returning();
      membership = inserted[0];
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: plan.price * 100,
      currency: "thb",
      customer: stripeCustomerId,
      automatic_payment_methods: { enabled: true },
      metadata: {
        payment_type: "MEMBERSHIP_FEE",
        user_id: account.id,
        membership_id: String(membership.id),
        plan_id: plan.slug,
      },
      description: `${plan.name} membership purchase`,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      membershipRequestId: membership.id,
      planSlug: plan.slug,
      stripeCustomerId,
    });
  } catch (error) {
    console.error("[membership payment-intent] Failed to create Stripe PaymentIntent", error);
    const message = error instanceof Error ? error.message : "Unknown Stripe error";
    return NextResponse.json({ error: `Unable to create a payment intent: ${message}` }, { status: 500 });
  }
}
