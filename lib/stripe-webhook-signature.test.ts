import Stripe from "stripe";
import { describe, expect, it } from "vitest";
import { stripeWebhookSecrets, verifyStripeWebhookEvent } from "./stripe-webhook-signature";

const stripe = new Stripe("sk_test_webhook_signature_validation");
const payload = JSON.stringify({
  id: "evt_test_webhook_migration",
  object: "event",
  api_version: "2026-08-26.dahlia",
  created: 1_798_998_000,
  data: { object: { id: "pi_test_unrelated", object: "payment_intent", metadata: { payment_type: "UNRELATED_TEST" } } },
  livemode: false,
  pending_webhooks: 1,
  request: { id: null, idempotency_key: null },
  type: "payment_intent.succeeded",
});

describe("Stripe webhook signature overlap", () => {
  it("parses distinct configured endpoint secrets without exposing them", () => {
    expect(stripeWebhookSecrets(" whsec_old,whsec_new,whsec_old ")).toEqual(["whsec_old", "whsec_new"]);
    expect(stripeWebhookSecrets(undefined)).toEqual([]);
  });

  it("accepts events signed by either endpoint during migration", () => {
    const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: "whsec_new" });
    expect(verifyStripeWebhookEvent(stripe, payload, signature, ["whsec_old", "whsec_new"])?.id).toBe("evt_test_webhook_migration");
  });

  it("rejects an event that matches no configured endpoint secret", () => {
    const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: "whsec_unconfigured" });
    expect(verifyStripeWebhookEvent(stripe, payload, signature, ["whsec_old", "whsec_new"])).toBeNull();
  });
});
