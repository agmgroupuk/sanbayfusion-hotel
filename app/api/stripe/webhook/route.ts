import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { membershipRequests } from "@/lib/db/schema";
import { activateMembershipRequest } from "@/lib/membership-activation";
import { eq } from "drizzle-orm";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  if (!stripe || !webhookSecret || !db) {
    return NextResponse.json({ error: "Stripe webhook not configured." }, { status: 503 });
  }

  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    if (paymentIntent.metadata.payment_type !== "MEMBERSHIP_FEE") return NextResponse.json({ ok: true });
    const membershipId = paymentIntent.metadata.membership_id;
    const customerId = typeof paymentIntent.customer === "string" ? paymentIntent.customer : null;
    if (!membershipId || !customerId || paymentIntent.currency !== "thb") return NextResponse.json({ ok: true });
    const membership = (await db.select().from(membershipRequests).where(eq(membershipRequests.id, membershipId)).limit(1))[0];
    if (!membership || membership.stripeCustomerId !== customerId || paymentIntent.amount !== membership.estimatedTotal * 100) return NextResponse.json({ ok: true });
    if (membership.stripePaymentIntentId && membership.stripePaymentIntentId !== paymentIntent.id) return NextResponse.json({ ok: true });
    await activateMembershipRequest({ id: membershipId, method: "STRIPE_PAYMENT", actor: "stripe-webhook" });
  }

  return NextResponse.json({ ok: true });
}
