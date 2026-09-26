import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey?.startsWith("sk_test_")) throw new Error("Sandbox webhook setup requires a Stripe test-mode secret key.");
const stripe = new Stripe(secretKey, { apiVersion: "2026-08-26.dahlia" });
const url = "https://sanbayfusion.com/api/stripe/webhook";
const events: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = ["payment_intent.succeeded"];
async function main() {
  const existing = (await stripe.webhookEndpoints.list({ limit: 100 })).data.find((endpoint) => endpoint.url === url);
  if (existing) {
    const updated = await stripe.webhookEndpoints.update(existing.id, { enabled_events: events, description: "Sanbay Fusion Sandbox membership activation" });
    console.log(JSON.stringify({ id: updated.id, url: updated.url, status: updated.status, events: updated.enabled_events, reused: true }));
  } else {
    const created = await stripe.webhookEndpoints.create({ url, enabled_events: events, description: "Sanbay Fusion Sandbox membership activation" });
    console.log(JSON.stringify({ id: created.id, url: created.url, status: created.status, events: created.enabled_events, secret: created.secret, reused: false }));
  }
}

void main();
