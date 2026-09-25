import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentAccount } from "@/lib/auth";
import { db } from "@/lib/db";
import { membershipRequests } from "@/lib/db/schema";
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
    return NextResponse.json({ error: "Membership checkout is unavailable right now." }, { status: 503 });
  }

  let membership = (await db.select().from(membershipRequests).where(eq(membershipRequests.email, account.email)).limit(1))[0];
  if (!membership) {
    const requestNumber = `M-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const inserted = await db.insert(membershipRequests).values({
      customerAccountId: account.id,
      requestNumber,
      planId: plan.id,
      planName: plan.name,
      planSnapshot: {
        slug: plan.slug,
        name: plan.name,
        price: plan.price,
        description: plan.description,
      },
      annualFee: plan.price,
      addOnTotal: 0,
      estimatedTotal: plan.price,
      validityMonths: plan.validityMonths,
      deliveryDays: plan.deliveryDays,
      annualDeliveryDays: plan.deliveryDaysPerYear,
      fullName: account.fullName,
      phone: account.phone ?? "",
      email: account.email,
      address: { city: "Bangkok", country: "Thailand" },
      contactPreferences: { email: true, sms: true },
      configuration: selection.configuration ?? {},
      status: "payment_pending",
      invoiceStatus: "awaiting_payment",
      stripeCustomerId: null,
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
    amount: Math.round(plan.price * 100),
    currency: "thb",
    automatic_payment_methods: { enabled: true },
    metadata: {
      type: "MEMBERSHIP_FEE",
      membershipRequestId: String(membership.id),
      customerAccountId: account.id,
      planSlug: plan.slug,
    },
    description: `${plan.name} membership purchase`,
  });

  return NextResponse.json({ clientSecret: paymentIntent.client_secret, membershipRequestId: membership.id, planSlug: plan.slug });
}
