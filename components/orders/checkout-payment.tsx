"use client";

import { CardElement, Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useState } from "react";
import Link from "next/link";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");
const money = (value: number) => `฿${value.toLocaleString("en-US")}`;

type Item = { category: string; name: string; quantity: number; price: number; lineTotal: number };

function PaymentForm({ items, subtotal, notes, customer, membership, delivery, orderNumber, onConfirmed }: { items: Item[]; subtotal: number; notes: string; customer: { name: string; email: string; phone: string }; membership: { plan: string; memberId: string; status: string }; delivery: unknown; orderNumber: string; onConfirmed: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function pay(event: React.FormEvent) {
    event.preventDefault();
    if (!stripe || !elements) return;
    setPending(true); setError("");
    const result = await stripe.confirmPayment({ elements, redirect: "if_required" });
    if (result.error) { setError(result.error.message ?? "Payment could not be completed."); setPending(false); return; }
    const response = await fetch("/api/orders/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderNumber }) });
    if (!response.ok) { setError("Payment was received, but confirmation is still processing. Please contact Sanbay Fusion."); setPending(false); return; }
    onConfirmed();
  }

  return <form onSubmit={pay} className="space-y-8"><section className="rounded-sm border border-border/60 bg-card/30 p-6"><p className="text-eyebrow text-gold">Customer details</p><dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-muted-foreground">Name</dt><dd className="mt-1">{customer.name || "Not provided"}</dd></div><div><dt className="text-muted-foreground">Email</dt><dd className="mt-1">{customer.email}</dd></div><div><dt className="text-muted-foreground">Phone</dt><dd className="mt-1">{customer.phone || "Not provided"}</dd></div><div><dt className="text-muted-foreground">Member ID</dt><dd className="mt-1">{membership.memberId}</dd></div></dl></section><section className="rounded-sm border border-border/60 bg-card/30 p-6"><p className="text-eyebrow text-gold">Order summary</p><div className="mt-5 space-y-3 text-sm">{items.map((item) => <div key={`${item.category}:${item.name}`} className="flex justify-between gap-4"><span>{item.quantity} × {item.name}</span><span>{money(item.lineTotal)}</span></div>)}<div className="flex justify-between border-t border-border/50 pt-4 text-lg"><strong>Total</strong><strong className="text-gold">{money(subtotal)}</strong></div></div>{notes && <p className="mt-5 border-t border-border/50 pt-5 text-sm text-muted-foreground">Notes: <span className="text-foreground">{notes}</span></p>}</section><section className="rounded-sm border border-border/60 bg-card/30 p-6"><p className="text-eyebrow text-gold">Secure payment</p><div className="mt-5 rounded-sm border border-input bg-background p-4"><PaymentElement /></div></section><label className="flex gap-3 text-sm leading-relaxed"><input required type="checkbox" className="mt-1 size-4 accent-[var(--gold)]" />I confirm that my order and delivery details are correct and I agree to the applicable order terms.</label>{error && <p role="alert" className="rounded-sm border border-destructive/50 bg-destructive/10 p-4 text-sm">{error}</p>}<button disabled={pending || !stripe} className="inline-flex h-12 w-full items-center justify-center rounded-full bg-gold px-6 text-eyebrow text-gold-foreground disabled:opacity-60">{pending ? "PROCESSING PAYMENT" : `PAY & CONFIRM ORDER · ${money(subtotal)}`}</button></form>;
}

export function CheckoutPayment(props: Omit<React.ComponentProps<typeof PaymentForm>, "onConfirmed">) {
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  useEffect(() => { fetch("/api/orders/payment-intent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cart: props.items.map(({ category, name, quantity }) => ({ category, name, quantity })), notes: props.notes }) }).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error); setClientSecret(data.clientSecret); }).catch((reason: Error) => setError(reason.message)); }, [props.items, props.notes]);
  if (confirmed) return <section className="rounded-sm border border-gold/50 bg-gold/5 p-8 text-center sm:p-12"><p className="text-eyebrow text-gold">Payment paid</p><h2 className="mt-5 font-display text-4xl font-light italic">Order Confirmed</h2><p className="mt-4 text-sm text-foreground/75">Thank you. Your order has been received.</p><p className="mt-6 text-sm">Order number: <strong>{props.orderNumber}</strong></p><div className="mt-8 flex flex-wrap justify-center gap-3"><Link href="/dashboard" className="rounded-full bg-gold px-6 py-3 text-eyebrow text-gold-foreground">BACK TO DASHBOARD</Link></div></section>;
  if (error) return <p role="alert" className="rounded-sm border border-destructive/50 bg-destructive/10 p-5 text-sm">{error}</p>;
  if (!clientSecret) return <p className="rounded-sm border border-border/60 p-5 text-sm text-muted-foreground">Preparing secure payment...</p>;
  return <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "night", variables: { colorPrimary: "#dcb56a" } } }}><PaymentForm {...props} onConfirmed={() => setConfirmed(true)} /></Elements>;
}