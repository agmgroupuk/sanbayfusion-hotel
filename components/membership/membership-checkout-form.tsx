"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useMemo, useState } from "react";
import type { MembershipPlan } from "@/lib/membership-plans";
import { catalogueCategories } from "@/lib/catalogue";
import type { MembershipPurchaseSnapshot } from "@/lib/membership-request";

type Address = { line1: string; line2: string; subdistrict: string; district: string; province: string; postalCode: string; country: string };
const emptyAddress: Address = { line1: "", line2: "", subdistrict: "", district: "", province: "", postalCode: "", country: "Thailand" };
const money = (value: number) => `฿${value.toLocaleString("en-US")}`;

function AddressFields({ title, address, onChange }: { title: string; address: Address; onChange: (value: Address) => void }) {
  const set = (field: keyof Address, value: string) => onChange({ ...address, [field]: value });
  return <fieldset className="space-y-4"><legend className="text-eyebrow text-gold">{title}</legend><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm sm:col-span-2">Address line 1 *<input required value={address.line1} onChange={(event) => set("line1", event.target.value)} className="mt-2 h-12 w-full rounded-sm border border-input bg-background px-3" /></label><label className="text-sm sm:col-span-2">Address line 2<input value={address.line2} onChange={(event) => set("line2", event.target.value)} className="mt-2 h-12 w-full rounded-sm border border-input bg-background px-3" /></label><label className="text-sm">Subdistrict *<input required value={address.subdistrict} onChange={(event) => set("subdistrict", event.target.value)} className="mt-2 h-12 w-full rounded-sm border border-input bg-background px-3" /></label><label className="text-sm">District *<input required value={address.district} onChange={(event) => set("district", event.target.value)} className="mt-2 h-12 w-full rounded-sm border border-input bg-background px-3" /></label><label className="text-sm">Province *<input required value={address.province} onChange={(event) => set("province", event.target.value)} className="mt-2 h-12 w-full rounded-sm border border-input bg-background px-3" /></label><label className="text-sm">Postal code *<input required inputMode="numeric" value={address.postalCode} onChange={(event) => set("postalCode", event.target.value)} className="mt-2 h-12 w-full rounded-sm border border-input bg-background px-3" /></label><label className="text-sm sm:col-span-2">Country<input value={address.country} readOnly className="mt-2 h-12 w-full rounded-sm border border-input bg-muted px-3" /></label></div></fieldset>;
}

function PaymentStep({ clientSecret, purchaseSnapshot, onMessage }: { clientSecret: string; purchaseSnapshot: MembershipPurchaseSnapshot; onMessage: (message: string) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [pending, setPending] = useState(false);
  async function pay() {
    if (!stripe || !elements || pending) return;
    setPending(true);
    const result = await stripe.confirmPayment({ elements, confirmParams: { return_url: `${window.location.origin}/membership/thank-you` }, redirect: "if_required" });
    if (result.error) {
      window.location.assign("/membership/payment-failed");
      return;
    }
    if (result.paymentIntent?.status === "succeeded") {
      window.location.assign(`/membership/thank-you?payment_intent=${encodeURIComponent(result.paymentIntent.id)}`);
      return;
    }
    onMessage("Your payment is being confirmed securely. Your membership will remain pending review until payment is verified.");
    setPending(false);
  }
  return <div className="space-y-5"><div className="rounded-sm border border-border/60 bg-background/60 p-4"><PaymentElement options={{ layout: "tabs" }} /></div><button type="button" onClick={pay} disabled={pending || !stripe} className="inline-flex h-13 w-full items-center justify-center rounded-full bg-gold px-6 text-eyebrow text-gold-foreground disabled:opacity-60">{pending ? "PROCESSING PAYMENT" : `PAY ${money(purchaseSnapshot.total)} & SUBMIT FOR REVIEW`}</button></div>;
}

export function MembershipCheckoutForm({ plan, account, purchaseSnapshot, publishableKey }: { plan: MembershipPlan; account: { fullName: string; email: string; phone: string }; purchaseSnapshot: MembershipPurchaseSnapshot; publishableKey: string }) {
  const stripePromise = useMemo(() => publishableKey ? loadStripe(publishableKey) : null, [publishableKey]);
  const [fullName, setFullName] = useState(account.fullName);
  const [phone, setPhone] = useState(account.phone);
  const [billing, setBilling] = useState<Address>(emptyAddress);
  const [delivery, setDelivery] = useState<Address>(emptyAddress);
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [savePaymentMethod, setSavePaymentMethod] = useState(true);
  const [terms, setTerms] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [message, setMessage] = useState("");
  const prepaid = purchaseSnapshot.purchaseMode === "membership_with_package";
  const containsAlcohol = [...purchaseSnapshot.products, ...purchaseSnapshot.preferences].some((item) => catalogueCategories.find((category) => category.name === item.category)?.group === "alcohol");

  async function preparePayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!terms) { setMessage("Please confirm your details and accept the membership terms before payment."); return; }
    setMessage("Preparing secure payment...");
    const response = await fetch("/api/membership/payment-intent", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ customer: { fullName, phone }, billingAddress: billing, deliveryAddress: delivery, sameAsBilling, savePaymentMethod }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) { setMessage(payload.error ?? "Unable to start payment. Please review your details or try again."); return; }
    setClientSecret(payload.clientSecret);
    setMessage("Secure payment fields are ready.");
  }

  const paymentOptions = clientSecret ? { clientSecret, appearance: { theme: "night" as const, variables: { colorPrimary: "#c7a46a", colorBackground: "#141414", colorText: "#f3efe7", colorDanger: "#d97777", borderRadius: "2px" } } } : undefined;
  return <div className="mx-auto max-w-7xl px-5 pb-28 sm:px-8"><div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]"><form onSubmit={preparePayment} className="order-2 space-y-8 rounded-sm border border-border/60 bg-card/30 p-6 sm:p-8 lg:order-1"><section><p className="text-eyebrow text-gold">Customer information</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm">Full name *<input required value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-2 h-12 w-full rounded-sm border border-input bg-background px-3" /></label><label className="text-sm">Email<input value={account.email} readOnly className="mt-2 h-12 w-full rounded-sm border border-input bg-muted px-3" /></label><label className="text-sm sm:col-span-2">Mobile *<input required value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-2 h-12 w-full rounded-sm border border-input bg-background px-3" /></label></div></section><section><AddressFields title="Billing address" address={billing} onChange={setBilling} /><label className="mt-5 flex gap-3 text-sm"><input type="checkbox" checked={sameAsBilling} onChange={(event) => setSameAsBilling(event.target.checked)} className="mt-1 size-4 accent-[var(--gold)]" /> Same as billing address</label></section>{!sameAsBilling && <AddressFields title="Delivery address" address={delivery} onChange={setDelivery} />}<section><p className="text-eyebrow text-gold">Payment</p>{!stripePromise ? <p className="mt-4 text-sm text-destructive">Secure payment is not configured for this environment.</p> : clientSecret ? <div className="mt-5"><Elements stripe={stripePromise} options={paymentOptions}><PaymentStep clientSecret={clientSecret} purchaseSnapshot={purchaseSnapshot} onMessage={setMessage} /></Elements></div> : <p className="mt-4 text-sm text-muted-foreground">Confirm your details below to load secure Stripe payment fields.</p>}</section><label className="flex gap-3 text-sm leading-relaxed"><input type="checkbox" checked={terms} onChange={(event) => setTerms(event.target.checked)} className="mt-1 size-4 accent-[var(--gold)]" /> I confirm my information is correct and agree to the <a href="/terms-and-conditions" className="text-gold underline">Membership Terms & Conditions</a> and <a href="/privacy-policy" className="text-gold underline">Privacy Policy</a>.</label>{!clientSecret && <button type="submit" className="inline-flex h-13 w-full items-center justify-center rounded-full bg-gold px-6 text-eyebrow text-gold-foreground">CONTINUE TO PAYMENT</button>}{message && <p role="status" className="rounded-sm border border-gold/50 bg-gold/5 p-4 text-sm text-gold">{message}</p>}</form><aside className="order-1 h-fit rounded-sm border border-gold/50 bg-card/50 p-6 sm:p-8 lg:sticky lg:top-28 lg:order-2"><p className="text-eyebrow text-gold">Membership summary</p><h2 className="mt-3 font-display text-3xl font-light italic">{plan.name}</h2><p className="mt-2 text-sm text-muted-foreground">{plan.validityMonths}-month membership · {plan.deliveryDays} delivery days/month</p><p className="mt-2 text-sm">{prepaid ? "Membership + prepaid annual package" : "Membership only"}</p><div className="mt-7 space-y-4 border-t border-border/60 pt-5 text-sm"><div className="flex justify-between gap-4"><span className="text-muted-foreground">Delivery area</span><span className="text-right">{purchaseSnapshot.delivery.area}</span></div><div className="flex justify-between gap-4"><span className="text-muted-foreground">Preferred day</span><span className="text-right">{purchaseSnapshot.delivery.preferredDay}</span></div><div className="flex justify-between gap-4"><span className="text-muted-foreground">Preferred time</span><span className="text-right">{purchaseSnapshot.delivery.preferredTime}</span></div><div className="flex justify-between gap-4"><span className="text-muted-foreground">Alcohol</span><span className="text-right">{containsAlcohol ? (prepaid ? "Included in package" : "Preference only · not prepaid") : "Not selected"}</span></div>{prepaid ? <><div className="border-t border-border/50 pt-4"><p className="text-eyebrow text-gold">Prepaid annual package</p><p className="mt-1 text-xs text-muted-foreground">Each item is priced for {purchaseSnapshot.delivery.deliveriesPerYear} scheduled deliveries.</p><div className="mt-3 space-y-3">{purchaseSnapshot.products.map((item) => <div key={`${item.category}:${item.name}`} className="flex justify-between gap-3"><span>{item.name}<span className="block text-xs text-muted-foreground">{item.category} · {item.quantityPerDelivery} per delivery · {item.annualQuantity} annually</span></span><span className="shrink-0">{money(item.lineTotal)}</span></div>)}{purchaseSnapshot.addOns.map((item) => <div key={`${item.category}:${item.name}`} className="flex justify-between gap-3"><span>{item.name}<span className="block text-xs text-muted-foreground">Add-on · quantity {item.quantity}</span></span><span className="shrink-0">{money(item.lineTotal)}</span></div>)}</div></div><div className="flex justify-between gap-4 border-t border-border/50 pt-3"><span className="text-muted-foreground">Package subtotal</span><span>{money(purchaseSnapshot.packageSubtotal)}</span></div><p className="text-xs leading-relaxed text-muted-foreground">Your selected package is prepaid for this membership term and will be fulfilled according to the finalized delivery schedule. Included items will not be charged again.</p></> : purchaseSnapshot.preferences.length > 0 && <div className="border-t border-border/50 pt-4"><p className="text-eyebrow text-gold">Selected preferences · not prepaid</p><div className="mt-3 space-y-2">{purchaseSnapshot.preferences.map((item) => <div key={`${item.category}:${item.name}`} className="flex justify-between gap-3"><span>{item.name}<span className="block text-xs text-muted-foreground">{item.category} · {item.quantityPerDelivery} per delivery</span></span><span className="shrink-0 text-muted-foreground">Separate order</span></div>)}</div><p className="mt-3 text-xs leading-relaxed text-muted-foreground">Food and beverage orders placed later through your member dashboard are charged separately.</p></div>}<div className="flex justify-between gap-4 border-t border-border/50 pt-4"><span>Annual membership fee</span><span>{money(purchaseSnapshot.membershipFee)}</span></div><div className="flex justify-between gap-4 text-lg font-medium"><span>Total due today</span><span className="text-gold">{money(purchaseSnapshot.total)}</span></div></div><label className="mt-6 flex gap-3 text-xs leading-relaxed text-muted-foreground"><input type="checkbox" checked={savePaymentMethod} onChange={(event) => setSavePaymentMethod(event.target.checked)} className="mt-0.5 size-4 accent-[var(--gold)]" /> Save this payment method securely with Stripe for future extra orders.</label></aside></div></div>;
}
