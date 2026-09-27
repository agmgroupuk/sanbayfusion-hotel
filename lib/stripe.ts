import "server-only";

import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY ?? "";
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

export const stripe = secretKey.startsWith("sk_test_")
  ? new Stripe(secretKey, { apiVersion: "2026-08-26.dahlia" })
  : null;

export const stripePublishableKey = publishableKey.startsWith("pk_test_") ? publishableKey : "";