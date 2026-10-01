"use client";
import { useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { SavedPaymentSetup, applicationRequest } from "@/components/membership/saved-payment-setup";
export function MembershipPaymentRecovery({ applicationId, publishableKey, initial }: { applicationId: string; publishableKey: string; initial: { status: string; clientSecret: string | null; paymentMethodId: string | null; failure: string | null } }) {
  const stripe = useMemo(() => publishableKey ? loadStripe(publishableKey) : null, [publishableKey]);
  const [state, setState] = useState(initial); const [secret, setSecret] = useState(""); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  async function act(action: "retry" | "authenticate" | "change-method" | "payment-status") {
    setBusy(true); setMessage("");
    try {
      if (action === "authenticate") {
        const current = await applicationRequest("payment-status", { applicationId });
        if (current.clientSecret && current.paymentMethodId && stripe) {
          const sdk = await stripe;
          if (!sdk) throw new Error("Payment authentication is unavailable.");
          const result = await sdk.confirmCardPayment(current.clientSecret, { payment_method: current.paymentMethodId });
          if (result.error) throw new Error(result.error.message);
        }
        setState(await applicationRequest("payment-status", { applicationId }));
      } else {
        const data = await applicationRequest(action, { applicationId });
        if (action === "change-method") setSecret(data.clientSecret); else setState(data);
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Please try again."); } finally { setBusy(false); }
  }
  const ready = async () => { await applicationRequest("setup-status", { applicationId }); setSecret(""); setMessage("New payment method saved. Select Retry authorized payment to continue."); };
  return <div className="space-y-5"><p>Status: {state.status.replaceAll("_", " ").toUpperCase()}</p>{state.failure && <p>{state.failure}</p>}{state.status === "active" ? <a href="/dashboard" className="text-gold underline">Payment succeeded. View your active membership.</a> : <div className="flex flex-wrap gap-4">{state.status === "approved_payment_action_required" && <button disabled={busy || !stripe} onClick={() => act("authenticate")} className="rounded-full bg-gold px-6 py-3 text-gold-foreground">Complete bank authentication</button>}{["approved_payment_failed", "approved_payment_action_required"].includes(state.status) && <><button disabled={busy || !!secret} onClick={() => act("retry")} className="rounded-full border border-gold px-6 py-3">Retry authorized payment</button><button disabled={busy} onClick={() => act("change-method")} className="text-gold underline">Update payment method</button></>}<button disabled={busy} onClick={() => act("payment-status")} className="text-gold underline">Refresh payment status</button></div>}{secret && stripe && <SavedPaymentSetup stripe={stripe} clientSecret={secret} returnPath={`/membership/payment?id=${applicationId}`} onReady={ready} onMessage={setMessage} />}{message && <p role="status">{message}</p>}</div>;
}
