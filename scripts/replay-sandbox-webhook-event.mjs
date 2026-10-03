import { createHmac } from "node:crypto";
import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const paymentIntentId = process.argv[2];
if (!secretKey?.startsWith("sk_test_")) throw new Error("Webhook replay requires a Stripe test-mode key.");
if (!webhookSecret?.startsWith("whsec_")) throw new Error("Webhook signing secret is required.");
if (!paymentIntentId?.startsWith("pi_")) throw new Error("Pass a Sandbox PaymentIntent ID.");

const stripe = new Stripe(secretKey, { apiVersion: "2026-08-26.dahlia" });
const events = await stripe.events.list({ type: "payment_intent.succeeded", limit: 100 });
const event = events.data.find((item) => item.data.object.id === paymentIntentId);
if (!event) throw new Error("No payment_intent.succeeded event found for that PaymentIntent.");
const payload = JSON.stringify(event);
const timestamp = Math.floor(Date.now() / 1000);
const signature = createHmac("sha256", webhookSecret).update(`${timestamp}.${payload}`).digest("hex");
const response = await fetch("https://pay.sanbayfusion.com/api/stripe/webhook", {
  method: "POST",
  headers: { "content-type": "application/json", "stripe-signature": `t=${timestamp},v1=${signature}` },
  body: payload,
});
console.log(JSON.stringify({ eventId: event.id, paymentIntentId, httpStatus: response.status, response: await response.text() }));
