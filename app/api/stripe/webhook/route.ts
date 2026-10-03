import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { recordMembershipPayment } from "@/lib/membership-activation";
import { recordOrderPayment, reconcileOrderPayment } from "@/lib/order-payment";
import { reconcileApplicationPayment } from "@/lib/membership-application";
import { reconcileMembershipInvoice } from "@/lib/membership-invoice";
import { reconcileCardVerification, stripeObjectId } from "@/lib/account/card-verification";
import { stripeWebhookSecrets, verifyStripeWebhookEvent } from "@/lib/stripe-webhook-signature";

export async function POST(request: Request) {
  const secrets = stripeWebhookSecrets(process.env.STRIPE_WEBHOOK_SECRET);
  if (!stripe || !secrets.length || !db) {
    return NextResponse.json({ error: "Stripe webhook not configured." }, { status: 503 });
  }

  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });

  const event: Stripe.Event | null = verifyStripeWebhookEvent(stripe, payload, signature, secrets);
  if (!event) {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  if (event.livemode) return NextResponse.json({ error: "Sandbox events only." }, { status: 400 });
  if (event.type.startsWith("invoice.")) {
    await reconcileMembershipInvoice((event.data.object as Stripe.Invoice).id);
    return NextResponse.json({ ok: true });
  }
  if (event.type.startsWith("refund.")) {
    const refund = event.data.object as Stripe.Refund;
    if (refund.metadata?.purpose === "CARD_VERIFICATION_REFUND" && refund.payment_intent) await reconcileCardVerification(stripeObjectId(refund.payment_intent)!);
    return NextResponse.json({ ok: true });
  }
  if (event.type.startsWith("payment_intent.")) {
    const intent = event.data.object as Stripe.PaymentIntent;
    if (intent.metadata.payment_type === "ORDER_PAYMENT") {
      await reconcileOrderPayment(intent.id);
      return NextResponse.json({ ok: true });
    }
    if (intent.metadata.purpose === "CARD_VERIFICATION") {
      await reconcileCardVerification(intent.id);
      return NextResponse.json({ ok: true });
    }
    if (intent.metadata.payment_type === "APPROVED_MEMBERSHIP" && intent.metadata.application_id) {
      await reconcileApplicationPayment(intent.metadata.application_id);
      return NextResponse.json({ ok: true });
    }
  }
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    if (paymentIntent.livemode) return NextResponse.json({ error: "Sandbox events only." }, { status: 400 });
    if (paymentIntent.metadata.payment_type === "ORDER_PAYMENT") {
      await recordOrderPayment(paymentIntent);
      return NextResponse.json({ ok: true });
    }
    if (paymentIntent.metadata.payment_type !== "MEMBERSHIP_PURCHASE") return NextResponse.json({ ok: true });
    const membershipId = paymentIntent.metadata.membership_id;
    const customerId = typeof paymentIntent.customer === "string" ? paymentIntent.customer : null;
    if (!membershipId || !customerId || paymentIntent.currency !== "thb") return NextResponse.json({ ok: true });
    const membership = await recordMembershipPayment({
      id: membershipId,
      stripeCustomerId: customerId,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      purchaseMode: paymentIntent.metadata.purchase_mode ?? "",
      snapshotHash: paymentIntent.metadata.purchase_snapshot_hash,
    });
    if (!membership) console.warn("[stripe webhook] Membership payment did not match a pending purchase", paymentIntent.id);
  }

  return NextResponse.json({ ok: true });
}
