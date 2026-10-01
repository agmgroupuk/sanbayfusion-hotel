"use client";
import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useMemo, useState } from "react";
import { PackageSummary } from "@/components/membership/package-summary";
import { SavedPaymentSetup, applicationRequest } from "@/components/membership/saved-payment-setup";
import type { MembershipPlan } from "@/lib/membership-plans";
import type { MembershipPurchaseSnapshot } from "@/lib/membership-request";
import { applicationDetailsSchema, applicationConsentVersion, chargeAuthorization, type ApplicationDetails, type PaymentMethodSummary } from "@/lib/membership-application-types";
import { billingCountries } from "@/lib/billing-countries";
const money = (value: number) => `฿${value.toLocaleString("en-US")}`;
const inputClass = "mt-2 h-12 w-full rounded-sm border border-input bg-background px-3";
export type ApplicationResume = { applicationId: string; details: ApplicationDetails; purchaseSnapshot: MembershipPurchaseSnapshot };
export function MembershipCheckoutForm({ plan, account, purchaseSnapshot: initialSnapshot, publishableKey, resume }: { plan: MembershipPlan; account: { fullName: string; email: string; phone: string }; purchaseSnapshot: MembershipPurchaseSnapshot; publishableKey: string; resume?: ApplicationResume }) {
  const stripe = useMemo(() => publishableKey ? loadStripe(publishableKey) : null, [publishableKey]);
  const [details, setDetails] = useState<ApplicationDetails>(resume?.details ?? { customer: { fullName: account.fullName, phone: account.phone }, billingAddress: { country: "TH", line1: "", line2: "", city: "", state: "", postalCode: "" }, deliveryAddress: { country: "Thailand", line1: "", line2: "", subdistrict: "", district: "", province: "Bangkok", postalCode: "" } });
  const [snapshot, setSnapshot] = useState(resume?.purchaseSnapshot ?? initialSnapshot);
  const [applicationId, setId] = useState(resume?.applicationId ?? "");
  const [secret, setSecret] = useState(""); const [hash, setHash] = useState("");
  const [method, setMethod] = useState<PaymentMethodSummary | null>(null);
  const [verified, setVerified] = useState(false); const [busy, setBusy] = useState(Boolean(resume));
  const [authorization, setAuthorization] = useState(false); const [terms, setTerms] = useState(false); const [privacy, setPrivacy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!resume) return;
    let cancelled = false;
    applicationRequest("setup-status", { applicationId: resume.applicationId }).then(data => {
      if (cancelled) return;
      setMethod(data.paymentMethod); setHash(data.quoteHash); setSnapshot(data.purchaseSnapshot); setVerified(true);
    }).catch(() => { if (!cancelled) setMessage("Review your saved details and continue to payment method setup."); }).finally(() => { if (!cancelled) setBusy(false); });
    return () => { cancelled = true; };
  }, [resume]);
  function edit(value: ApplicationDetails) { setDetails(value); setVerified(false); setMethod(null); setSecret(""); setAuthorization(false); }
  async function ready(id = applicationId) {
    const data = await applicationRequest("setup-status", { applicationId: id });
    setMethod(data.paymentMethod); setHash(data.quoteHash); setSnapshot(data.purchaseSnapshot); setVerified(true); setSecret(""); setMessage("Payment method added. No membership charge has been made.");
  }
  async function prepare(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const data = await applicationRequest("prepare", { details, applicationId });
      window.history.replaceState(null, "", `/membership/checkout?application=${data.applicationId}`);
      setId(data.applicationId); setSnapshot(data.purchaseSnapshot); setHash(data.quoteHash); setAuthorization(false);
      if (data.setupStatus === "succeeded") await ready(data.applicationId); else setSecret(data.clientSecret);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Please try again."); } finally { setBusy(false); }
  }
  async function change() {
    setBusy(true); setMessage("");
    try { const data = await applicationRequest("change-method", { applicationId }); setSecret(data.clientSecret); setMethod(null); setVerified(false); setAuthorization(false); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Please try again."); } finally { setBusy(false); }
  }
  async function submit() {
    setBusy(true); setMessage("");
    try {
      const data = await applicationRequest("submit", { applicationId, quoteHash: hash, authorizeCharge: authorization, acceptTerms: terms, acceptPrivacy: privacy, consentVersion: applicationConsentVersion });
      window.location.assign(`/membership/request-received?id=${encodeURIComponent(data.applicationId)}`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Please try again."); setBusy(false); }
  }
  const valid = applicationDetailsSchema.safeParse(details).success;
  const fields = (group: "customer" | "billingAddress" | "deliveryAddress", names: [string, string, boolean][]) => names.map(([field, label, required]) => <label key={field} className="text-sm">{label}{required ? " *" : ""}<input required={required} maxLength={200} value={(details[group] as Record<string, string>)[field]} onChange={event => edit({ ...details, [group]: { ...details[group], [field]: event.target.value } })} className={inputClass} /></label>);
  return <div className="mx-auto max-w-7xl px-5 pb-28 sm:px-8"><div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
    <div className="space-y-8 rounded-sm border border-border/60 bg-card/30 p-6 sm:p-8">
      <form onSubmit={prepare} className="space-y-8">
        <fieldset disabled={busy || !!secret}><legend className="text-eyebrow text-gold">Customer information</legend><div className="mt-5 grid gap-4 sm:grid-cols-2">{fields("customer", [["fullName", "Full name", true], ["phone", "Phone", true]])}<label className="text-sm sm:col-span-2">Email<input value={account.email} readOnly className={inputClass} /></label></div></fieldset>
        <fieldset disabled={busy || !!secret}><legend className="text-eyebrow text-gold">Billing address</legend><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm sm:col-span-2">Country *<select value={details.billingAddress.country} onChange={event => edit({ ...details, billingAddress: { ...details.billingAddress, country: event.target.value } })} className={inputClass}>{billingCountries.map(country => <option key={country.code} value={country.code}>{country.name}</option>)}</select></label>{fields("billingAddress", [["line1", "Address line 1", true], ["line2", "Address line 2", false], ["city", "City", true], ["state", "State / province / region", false], ["postalCode", "Postal / ZIP code", ["TH", "US", "CA", "GB", "AU", "DE", "FR", "JP"].includes(details.billingAddress.country)]])}</div></fieldset>
        <fieldset disabled={busy || !!secret}><legend className="text-eyebrow text-gold">Delivery address · Thailand</legend><p className="mt-3 text-sm text-muted-foreground">Your service address must be within our supported delivery area.</p><div className="mt-5 grid gap-4 sm:grid-cols-2">{fields("deliveryAddress", [["line1", "Address", true], ["line2", "Address line 2", false], ["subdistrict", "Subdistrict / Khwaeng / Tambon", true], ["district", "District / Khet / Amphoe", true], ["province", "Province", true], ["postalCode", "Postal code", true]])}</div></fieldset>
        <button disabled={!valid || busy || !stripe} className="rounded-full border border-gold px-6 py-3 text-gold disabled:opacity-50">{busy ? "Please wait…" : "Validate details & continue"}</button>
      </form>
      <section className="space-y-5"><h2 className="text-eyebrow text-gold">Payment method</h2><p className="text-sm text-muted-foreground">Save a card securely for the authorized charge after approval. Your payment method may be temporarily authorized for a small amount to verify it. Any temporary amount is released according to the payment provider and your card issuer’s processing time.</p>
        {!stripe && <p role="alert">Secure payment setup is currently unavailable.</p>}
        {secret && stripe && <SavedPaymentSetup stripe={stripe} clientSecret={secret} returnPath={`/membership/checkout?application=${applicationId}`} onReady={() => ready()} onMessage={setMessage} />}
        {method && <div className="rounded-sm border border-gold/40 p-4"><p className="text-gold">PAYMENT METHOD ADDED</p><p className="mt-2 capitalize">{method.brand} •••• {method.last4} · Expires {method.expMonth}/{method.expYear}</p><button type="button" onClick={change} disabled={busy} className="mt-3 text-sm text-gold underline">Change payment method</button></div>}
      </section>
      <section className="space-y-4 text-sm"><h2 className="text-eyebrow text-gold">Application agreements</h2>
        <label className="flex gap-3"><input type="checkbox" checked={authorization} onChange={e => setAuthorization(e.target.checked)} /> <span>{chargeAuthorization} The exact authorized amount is <strong>{money(snapshot.total)}</strong>.</span></label>
        <label className="flex gap-3"><input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} /><span>I accept the <a href="/terms-and-conditions" className="text-gold underline">Membership Terms & Conditions</a>.</span></label>
        <label className="flex gap-3"><input type="checkbox" checked={privacy} onChange={e => setPrivacy(e.target.checked)} /><span>I accept the <a href="/privacy-policy" className="text-gold underline">Privacy Policy</a>.</span></label>
      </section>
      {message && <p role="status" className="rounded-sm border border-gold/40 p-4 text-sm">{message}</p>}
    </div>
    <aside className="h-fit space-y-5 rounded-sm border border-gold/50 bg-card/50 p-6 lg:sticky lg:top-28"><p className="text-eyebrow text-gold">Membership summary</p><h2 className="font-display text-3xl">{plan.name}</h2><p>{snapshot.plan.durationMonths} months from activation</p><p>{snapshot.purchaseMode === "membership_with_package" ? "Membership + prepaid package" : "Membership only"}</p><PackageSummary snapshot={snapshot} /><p>Membership fee: {money(snapshot.membershipFee)}</p><p className="border-t border-border pt-4">Expected charge upon approval <strong className="mt-2 block text-2xl text-gold">{money(snapshot.total)}</strong></p><p className="text-sm text-muted-foreground">No membership charge on submission. Your application will be reviewed before the authorized charge is attempted.</p><button type="button" disabled={!valid || !verified || !method || !authorization || !terms || !privacy || busy} onClick={submit} className="w-full rounded-full bg-gold px-5 py-4 text-eyebrow text-gold-foreground disabled:opacity-40">{busy ? "Please wait…" : "SUBMIT MEMBERSHIP REQUEST"}</button></aside>
  </div></div>;
}
