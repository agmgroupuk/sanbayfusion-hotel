"use client";
import { useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import Link from "next/link";
import { applicationRequest } from "./saved-payment-setup";
type PaymentState = { status: string; invoiceStatus: string | null; paymentConfirmed: boolean; clientSecret: string | null; failure: string | null; invoicePdf: string | null };
export function InvoicePaymentRecovery({ applicationId, initial, publishableKey }: { applicationId: string; initial: PaymentState; publishableKey: string }) {
  const stripe = useMemo(() => publishableKey ? loadStripe(publishableKey) : null, [publishableKey]);
  const [payment, setPayment] = useState(initial), [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  async function refresh(authenticate = false) {
    setBusy(true); setMessage("");
    try {
      if (authenticate && payment.clientSecret) {
        const provider = await stripe; if (!provider) throw new Error("Secure authentication unavailable.");
        const result = await provider.confirmCardPayment(payment.clientSecret);
        if (result.error) throw new Error(result.error.message ?? "Authentication was not completed.");
      }
      setPayment(await applicationRequest("payment-status", { applicationId }));
    } catch (error) { setMessage((error as Error).message); } finally { setBusy(false); }
  }
  return <section className="space-y-5 rounded-sm border border-gold/40 p-6"><p>Invoice: {payment.invoiceStatus?.toUpperCase()}</p><p>Payment: {payment.paymentConfirmed ? "PAID" : "NOT PAID / AWAITING CONFIRMATION"}</p>{payment.failure && <p>{payment.failure}</p>}{payment.clientSecret && <button disabled={busy} onClick={() => refresh(true)} className="rounded-full bg-gold px-5 py-3 text-gold-foreground">Authenticate saved card payment</button>}{!payment.paymentConfirmed && <p className="text-sm text-muted-foreground">Your approved invoice is managed by our team in Stripe. Contact us if a payment retry is needed. Membership remains inactive until the authorized payment succeeds.</p>}<button disabled={busy} onClick={() => refresh()} className="block text-gold underline">Refresh payment status</button>{payment.invoicePdf && <a href={payment.invoicePdf} target="_blank" rel="noopener noreferrer" className="block text-gold underline">Download paid Stripe invoice</a>}{message && <p role="alert">{message}</p>}<Link href="/dashboard/membership" className="block text-gold underline">View my membership</Link></section>;
}
