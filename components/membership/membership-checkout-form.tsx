"use client";

import { useState } from "react";
import type { MembershipPlan } from "@/lib/membership-plans";

export function MembershipCheckoutForm({
  plan,
  account,
  configuration,
}: {
  plan: MembershipPlan;
  account: { fullName: string; email: string; phone: string };
  configuration: Record<string, unknown>;
}) {
  const [isPreparing, setIsPreparing] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<string>("Ready to begin secure checkout.");

  async function startSecureCheckout() {
    setIsPreparing(true);
    setCheckoutStatus("Preparing your secure Stripe checkout…");

    try {
      const response = await fetch("/api/membership/payment-intent", { method: "POST" });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error ?? "Unable to create a payment intent.");
      }
      const payload = await response.json();
      setCheckoutStatus(`Secure payment intent created for ${plan.name}. You can now complete the card payment in Stripe test mode.`);
      console.info("membership checkout secret created", payload.clientSecret ? "ok" : "missing");
    } catch (error) {
      setCheckoutStatus(error instanceof Error ? error.message : "Unable to start secure checkout.");
    } finally {
      setIsPreparing(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pb-28 sm:px-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-8 rounded-sm border border-border/60 bg-card/30 p-6 sm:p-8">
          <div>
            <p className="text-eyebrow text-gold">Membership details</p>
            <h2 className="mt-3 font-display text-4xl font-light italic">{plan.name}</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-muted-foreground">Full name</span>
              <input defaultValue={account.fullName} className="h-12 w-full rounded-sm border border-input bg-background px-3" readOnly />
            </label>
            <label className="block text-sm">
              <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-muted-foreground">Email</span>
              <input defaultValue={account.email} className="h-12 w-full rounded-sm border border-input bg-background px-3" readOnly />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-muted-foreground">Mobile</span>
              <input defaultValue={account.phone || "Not provided"} className="h-12 w-full rounded-sm border border-input bg-background px-3" readOnly />
            </label>
          </div>

          <div className="rounded-sm border border-gold/50 bg-gold/5 p-5 text-sm leading-relaxed text-foreground/80">
            <p className="font-medium text-foreground">Selected configuration</p>
            <pre className="mt-3 whitespace-pre-wrap break-words text-xs text-muted-foreground">{JSON.stringify(configuration, null, 2)}</pre>
          </div>
        </div>

        <aside className="rounded-sm border border-gold/50 bg-card/50 p-6 sm:p-8">
          <p className="text-eyebrow text-gold">Secure payment</p>
          <h3 className="mt-3 font-display text-3xl font-light italic">฿{plan.price.toLocaleString("en-US")}</h3>
          <p className="mt-2 text-sm text-muted-foreground">Annual membership fee · 12-month validity</p>

          <button
            type="button"
            onClick={startSecureCheckout}
            disabled={isPreparing}
            className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-gold px-6 py-3 text-eyebrow text-gold-foreground disabled:opacity-60"
          >
            {isPreparing ? "PREPARING…” : "START SECURE CHECKOUT"}
          </button>

          <p className="mt-6 text-sm leading-relaxed text-foreground/75">{checkoutStatus}</p>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Stripe handles the payment collection. Sanbay Fusion remains the source of truth for membership activation and access checks.
          </p>
        </aside>
      </div>
    </div>
  );
}
