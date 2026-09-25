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

  if (event.type === "customer.subscription.created" || event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice;
    const customerId = invoice.customer as string | null;
    const amountPaid = invoice.amount_paid ?? 0;
    const membershipId = invoice.metadata?.membershipRequestId ?? null;

    if (!customerId || !membershipId) return NextResponse.json({ ok: true });

    const membership = (await db.select().from(membershipRequests).where(eq(membershipRequests.id, membershipId)).limit(1))[0];
    if (!membership || membership.stripeCustomerId !== customerId) return NextResponse.json({ ok: true });
    if (amountPaid < (membership.estimatedTotal ?? 0) * 100) return NextResponse.json({ ok: true });

    await activateMembershipRequest({ id: membershipId, method: "STRIPE_PAYMENT", actor: "stripe-webhook" });
    return NextResponse.json({ ok: true });
  }

  if (event.type === "charge.succeeded") {
    const charge = event.data.object as Stripe.Charge;
    const customerId = typeof charge.customer === "string" ? charge.customer : null;
    if (!customerId) return NextResponse.json({ ok: true });
    const membership = (await db.select().from(membershipRequests).where(eq(membershipRequests.stripeCustomerId, customerId)).limit(1))[0];
    if (!membership) return NextResponse.json({ ok: true });
    if (charge.amount !== (membership.estimatedTotal ?? 0) * 100) return NextResponse.json({ ok: true });
    await activateMembershipRequest({ id: membership.id, method: "STRIPE_PAYMENT", actor: "stripe-webhook" });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}
