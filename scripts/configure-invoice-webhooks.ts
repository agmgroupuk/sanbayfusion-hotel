import Stripe from "stripe";
import { publicSiteUrl } from "../lib/platform-hosts";
const key = process.env.STRIPE_SECRET_KEY;
if (!key?.startsWith("sk_test_") || process.env.RAILWAY_PROJECT_ID !== "ea31f46e-5f06-4394-8580-22f343c28132") throw new Error("Expected Sanbay Fusion Sandbox environment");
const stripe = new Stripe(key, { apiVersion: "2026-08-26.dahlia" });
const required: Stripe.WebhookEndpointUpdateParams.EnabledEvent[] = ["payment_intent.succeeded", "payment_intent.payment_failed", "payment_intent.requires_action", "refund.created", "refund.updated", "refund.failed", "invoice.finalized", "invoice.updated", "invoice.paid", "invoice.payment_succeeded", "invoice.payment_failed", "invoice.payment_action_required", "invoice.voided"];
async function main() {
  const webhookUrl = new URL("/api/stripe/webhook", publicSiteUrl()).href;
  const endpoint = (await stripe.webhookEndpoints.list({ limit: 100 })).data.find(item => item.url === webhookUrl);
  if (!endpoint || endpoint.livemode || !process.env.STRIPE_WEBHOOK_SECRET?.startsWith("whsec_")) throw new Error("Existing configured Sandbox endpoint required");
  const events = endpoint.enabled_events.includes("*") ? ["*" as const] : [...new Set([...endpoint.enabled_events, ...required])] as Stripe.WebhookEndpointUpdateParams.EnabledEvent[];
  console.log(JSON.stringify({ id: endpoint.id, url: endpoint.url, mode: "test", events, emailConfigured: !!process.env.RESEND_API_KEY, staffEmailConfigured: !!process.env.RESTAURANT_NOTIFY_EMAIL }));
  if (process.argv.includes("--apply")) { await stripe.webhookEndpoints.update(endpoint.id, { enabled_events: events }); console.log("Sandbox endpoint events updated; signing secret and existing subscriptions preserved."); }
}
main().catch(() => { console.error("Sandbox webhook configuration stopped; sensitive details suppressed."); process.exitCode = 1; });
