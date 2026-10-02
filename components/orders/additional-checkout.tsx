"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { platformUrl } from "@/lib/platform-hosts";
import { loadStripe } from "@stripe/stripe-js";
import type { SafeCard, SavedAddress } from "@/lib/account/types";
import { orderDeliveryTimes } from "@/lib/order-schedule";
import { standardMealTimeLabel } from "@/lib/standard-meal";

type Item = { category: string; name: string; quantity: number; price: number; lineTotal: number };
const money = (value: number) => `฿${value.toLocaleString("en-US")}`;
const control = "mt-2 min-h-12 w-full rounded border border-border bg-background p-3";
const button = "min-h-12 rounded-full bg-gold px-6 py-3 text-sm text-gold-foreground disabled:opacity-40";
export function AdditionalCheckout({ items, notes, addresses, cards, dates, publishableKey, initialAttempt }: { items: Item[]; notes: string; addresses: SavedAddress[]; cards: SafeCard[]; dates: string[]; publishableKey: string; initialAttempt?: {requestId:string;deliveryDate:string;deliveryTime:string;addressId:string;paymentMethodId:string} }) {
  const [step, setStep] = useState(initialAttempt ? 2 : 0);
  const [deliveryDate, setDate] = useState(initialAttempt?.deliveryDate ?? dates[0] ?? "");
  const [deliveryTime, setTime] = useState(initialAttempt?.deliveryTime ?? "11:00");
  const [addressId, setAddress] = useState(initialAttempt?.addressId ?? addresses.find(row => row.isDefault)?.id ?? addresses[0]?.id ?? "");
  const [paymentMethodId, setCard] = useState(initialAttempt?.paymentMethodId ?? cards.find(row => row.isDefault)?.id ?? cards[0]?.id ?? "");
  const [requestId, setRequestId] = useState(initialAttempt?.requestId ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const total = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const address = addresses.find(row => row.id === addressId);
  const card = cards.find(row => row.id === paymentMethodId);
  // Store only an attempt ID and non-sensitive choices; server reloads prices and ownership.
  const storageKey = `sbf-order:${JSON.stringify(items.map(({category,name,quantity}) => ({category,name,quantity})))}:${notes}`;
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? "null");
      // Restore browser-only draft choices after hydration; server validates every field.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (!initialAttempt && saved?.requestId) { setRequestId(saved.requestId); setDate(saved.deliveryDate); setTime(saved.deliveryTime); setAddress(saved.addressId); setCard(saved.paymentMethodId); setStep(2); }
    } catch { /* Storage is optional. */ }
  }, [storageKey, initialAttempt]);
  async function pay() {
    setBusy(true); setMessage("Preparing your saved-card payment…");
    const attempt = requestId || crypto.randomUUID(); setRequestId(attempt);
    try {
      try { sessionStorage.setItem(storageKey, JSON.stringify({requestId:attempt,deliveryDate,deliveryTime,addressId,paymentMethodId})); } catch { /* Storage is optional. */ }
      const response = await fetch("/api/orders/payment-intent", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({requestId:attempt,cart:items.map(({category,name,quantity}) => ({category,name,quantity})),notes,deliveryDate,deliveryTime,addressId,paymentMethodId}) });
      const data = await response.json();
      if (!response.ok) {
        if ([400,403].includes(response.status) && !initialAttempt) {setRequestId("");setStep(0);try{sessionStorage.removeItem(storageKey);}catch{}}
        throw new Error(data.error || "Unable to prepare payment.");
      }
      setOrderNumber(data.orderNumber);
      window.history.replaceState(null, "", `/dashboard/checkout?order=${attempt}`);
      if (data.total !== total) throw new Error("Prices changed. Reload checkout to review the current total before paying.");
      if (data.paymentStatus !== "succeeded") {
        const stripe = await loadStripe(publishableKey);
        if (!stripe) throw new Error("Payment service is unavailable. Please retry.");
        setMessage("Complete any card authentication requested by your bank. Your order is not yet confirmed.");
        const result = await stripe.confirmCardPayment(data.clientSecret);
        if (result.error) throw new Error(result.error.message || "Payment was not completed. Retry safely using the same order.");
        if (result.paymentIntent?.status !== "succeeded") throw new Error("Payment is processing or needs authentication. Check your order history before retrying.");
      }
      const confirmation = await fetch("/api/orders/confirm", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({orderNumber:data.orderNumber})});
      const result = await confirmation.json();
      if (!confirmation.ok) throw new Error(result.error || "Confirmation is processing. Check your order history.");
      setConfirmed(true); setMessage("Payment received. Your order is confirmed.");
      try { sessionStorage.removeItem(storageKey); } catch { /* Storage is optional. */ }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to complete payment. Retry this order safely."); }
    finally { setBusy(false); }
  }
  async function cancelAttempt() {
    setBusy(true);
    try {
      const response = await fetch("/api/orders/cancel",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({orderNumber:orderNumber || `SBF-O-${requestId.slice(0,18)}`})});
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      try{sessionStorage.removeItem(storageKey);}catch{}
      const query = new URLSearchParams({cart:encodeURIComponent(JSON.stringify(items.map(({category,name,quantity})=>({category,name,quantity})))),notes:encodeURIComponent(notes)});
      window.location.assign(`/dashboard/checkout?${query}`);
    } catch(error){setMessage(error instanceof Error ? error.message : "Unable to cancel this attempt.");}
    finally{setBusy(false);}
  }
  return <section className="space-y-6">
    <h2 className="font-display text-3xl">{confirmed ? "Order confirmed" : "Your member order"}</h2>
    <p className="text-sm text-muted-foreground">Orders must be scheduled at least 3 days in advance. Dates and times use Thailand time (Asia/Bangkok).</p>
    <ol aria-label="Checkout progress" className="flex flex-wrap gap-4 text-sm">{["Delivery", "Saved card", "Review & pay"].map((label,index) => <li key={label} aria-current={step === index ? "step" : undefined} className={step === index ? "text-gold" : "text-muted-foreground"}>{index+1}. {label}</li>)}</ol>
    {!confirmed && step === 0 && <div className="space-y-5">
      <label className="block">Delivery date<select className={control} value={deliveryDate} onChange={e => setDate(e.target.value)} disabled={!!requestId}><option value="" disabled>Choose an eligible date</option>{dates.map(date => <option key={date} value={date}>{date}</option>)}</select></label>
      {!dates.length && <p role="alert">No eligible delivery dates remain in your current membership service periods.</p>}
      <label className="block">Delivery time<select className={control} value={deliveryTime} onChange={e=>setTime(e.target.value)} disabled={!!requestId}>{orderDeliveryTimes.map(time => <option key={time} value={time}>{standardMealTimeLabel(time)}</option>)}</select></label>
      <label className="block">Saved delivery address<select className={control} value={addressId} onChange={e=>setAddress(e.target.value)} disabled={!!requestId}><option value="" disabled>Select an address</option>{addresses.map(row => <option key={row.id} value={row.id}>{row.details.name} — {row.details.line1}, {row.details.district}</option>)}</select></label>
      <Link className="block text-gold underline" href={platformUrl("account","/dashboard/addresses")}>Manage delivery addresses</Link>
    </div>}
    {!confirmed && step === 1 && <fieldset className="space-y-4"><legend className="mb-4">Use a verified saved card</legend>{cards.map(row=><label key={row.id} className="flex min-h-14 items-center gap-3 rounded border border-border p-4"><input type="radio" name="card" value={row.id} checked={paymentMethodId===row.id} onChange={()=>setCard(row.id)} disabled={!!requestId}/><span className="capitalize">{row.brand} •••• {row.last4} · {row.expMonth}/{row.expYear}{row.isDefault ? " · Default" : ""}</span></label>)}{!cards.length && <p>Add and verify a card in Account Center before continuing.</p>}<Link className="block text-gold underline" href={platformUrl("account","/dashboard/payment-methods")}>Manage saved cards</Link></fieldset>}
    {(step === 2 || confirmed) && <div className="space-y-5 rounded border border-gold/40 p-5"><h3 className="text-xl">Order summary</h3>{items.map(item=><div key={`${item.category}:${item.name}`} className="flex flex-wrap justify-between gap-2 border-b border-border pb-3 text-sm"><span>{item.name}<small className="block">{item.quantity} × {money(item.price)}</small></span><span>{money(item.lineTotal)}</span></div>)}<p className="text-xl text-gold">Total {money(total)}</p><p>Delivery: {deliveryDate} · {standardMealTimeLabel(deliveryTime)} (Thailand)</p><p className="break-words">{address ? [address.details.name,address.details.line1,address.details.line2,address.details.subdistrict,address.details.district,address.details.province,address.details.postalCode].filter(Boolean).join(", ") : "Select a delivery address"}</p><p className="capitalize">{card ? `${card.brand} ending ${card.last4}` : "Select a saved card"}</p>{notes && <p>Notes: {notes}</p>}{orderNumber && <p>Order: {orderNumber}</p>}</div>}
    <p role="status" aria-live="polite" className="text-sm">{message}</p>
    {confirmed ? <Link href="/dashboard/orders" className={button}>View order history</Link> : <div className="flex flex-wrap justify-between gap-4">{step>0 && <button className={button} disabled={busy || !!requestId} onClick={()=>setStep(step-1)}>Previous</button>}{step<2 ? <button className={button} disabled={!deliveryDate || !addressId || (step===1 && !paymentMethodId)} onClick={()=>setStep(step+1)}>Continue</button> : <button className={button} disabled={busy || !paymentMethodId || !addressId || !deliveryDate || !publishableKey} onClick={pay}>{busy ? "Processing…" : `Pay ${money(total)}`}</button>}</div>}
    {requestId && !confirmed && <div className="space-y-3"><p className="text-sm text-muted-foreground">This order attempt is saved. Retrying uses the same payment. Check order history before starting another checkout.</p><button className="min-h-12 text-sm text-gold underline" disabled={busy} onClick={cancelAttempt}>Cancel unpaid attempt and edit checkout</button></div>}
  </section>;
}
