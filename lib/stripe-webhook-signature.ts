import type Stripe from "stripe";

export function stripeWebhookSecrets(configuration: string | undefined) {
  return [...new Set((configuration ?? "").split(",").map(secret => secret.trim()).filter(Boolean))];
}

export function verifyStripeWebhookEvent(stripe: Stripe, payload: string, signature: string, secrets: readonly string[]) {
  for (const secret of secrets) {
    try {
      return stripe.webhooks.constructEvent(payload, signature, secret);
    } catch {
      // During endpoint migration, try the next configured endpoint secret.
    }
  }
  return null;
}
