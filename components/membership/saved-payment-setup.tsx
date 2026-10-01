"use client";
import { useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import type { Stripe } from "@stripe/stripe-js";

export const paymentAppearance = { theme: "night" as const, variables: { colorPrimary: "#c7a46a", colorBackground: "#141414", colorText: "#f3efe7", borderRadius: "2px" } };
export async function applicationRequest(action: string, body: Record<string, unknown>) {
  const response = await fetch("/api/membership/application", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...body, action }) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Unable to complete this step.");
  return data;
}
function Setup({ returnPath, onReady, onMessage }: { returnPath: string; onReady: () => Promise<void>; onMessage: (message: string) => void }) {
  const stripe = useStripe(); const elements = useElements(); const [busy, setBusy] = useState(false);
  async function save() {
    if (!stripe || !elements || busy) return;
    setBusy(true);
    try {
      const result = await stripe.confirmSetup({ elements, confirmParams: { return_url: `${window.location.origin}${returnPath}` }, redirect: "if_required" });
      if (result.error) throw new Error(result.error.message || "Payment method setup failed.");
      await onReady();
    } catch (error) { onMessage(error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(false); }
  }
  return <div className="space-y-5"><PaymentElement /><button type="button" disabled={!stripe || busy} onClick={save} className="rounded-full border border-gold px-6 py-3 text-gold disabled:opacity-50">{busy ? "Verifying payment method…" : "Save payment method securely"}</button></div>;
}
export function SavedPaymentSetup({ stripe, clientSecret, ...props }: { stripe: Promise<Stripe | null>; clientSecret: string; returnPath: string; onReady: () => Promise<void>; onMessage: (message: string) => void }) {
  return <Elements key={clientSecret} stripe={stripe} options={{ clientSecret, appearance: paymentAppearance }}><Setup {...props} /></Elements>;
}
