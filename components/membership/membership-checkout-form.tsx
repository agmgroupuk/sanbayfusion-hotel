"use client";
import { useEffect, useState } from "react";
import { Check, CircleAlert, CreditCard, ArrowUpRight } from "lucide-react";
import { PackageSummary } from "./package-summary";
import { MembershipDialog } from "./membership-dialog";
import { applicationRequest } from "./saved-payment-setup";
import type { MembershipPlan } from "@/lib/membership-plans";
import type { MembershipPurchaseSnapshot } from "@/lib/membership-request";
import type { MembershipAccountReview } from "@/lib/membership-review-types";
import { applicationConsentVersion, chargeAuthorization } from "@/lib/membership-application-types";
import { MembershipEligibilityNotice } from "./eligibility-notice";
import { membershipEligibilityConfirmation, membershipEligibilityVersion } from "@/lib/membership-eligibility";
const money = (value: number) => `฿${value.toLocaleString("en-US")}`;
const dashboard = (section: string) => `/dashboard/${section}?returnTo=membership`;
type Prepared = { review: MembershipAccountReview; applicationId: string | null; purchaseSnapshot: MembershipPurchaseSnapshot; quoteHash: string; reviewHash: string };
export function MembershipCheckoutForm({ plan, purchaseSnapshot, applicationId }: { plan: MembershipPlan; purchaseSnapshot: MembershipPurchaseSnapshot; applicationId?: string }) {
  const [prepared, setPrepared] = useState<Prepared | null>(null);
  const [selectedCard, setSelectedCard] = useState("");
  const [changeCard, setChangeCard] = useState(false);
  const [showMissing, setShowMissing] = useState(false);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState("");
  const [agreements, setAgreements] = useState({ eligibility: false, authorization: false, terms: false, privacy: false });
  useEffect(() => {
    let cancelled = false;
    applicationRequest("prepare", { applicationId }).then((data: Prepared) => {
      if (cancelled) return;
      setPrepared(data); setSelectedCard(data.review.cards.find(card => card.isDefault)?.id ?? ""); setShowMissing(!data.review.complete);
      if (data.applicationId) window.history.replaceState(null, "", `/membership/checkout?application=${data.applicationId}`);
    }).catch(error => { if (!cancelled) setMessage(error.message); }).finally(() => { if (!cancelled) setBusy(false); });
    return () => { cancelled = true; };
  }, [applicationId]);
  const review = prepared?.review;
  const snapshot = prepared?.purchaseSnapshot ?? purchaseSnapshot;
  const card = review?.cards.find(item => item.id === selectedCard);
  async function submit() {
    if (!prepared || busy) return;
    setBusy(true); setMessage("");
    try {
      const result = await applicationRequest("submit", { applicationId: prepared.applicationId, quoteHash: prepared.quoteHash, reviewHash: prepared.reviewHash, paymentMethodId: selectedCard, confirmInternationalVisitor: agreements.eligibility, eligibilityVersion: membershipEligibilityVersion, authorizeCharge: agreements.authorization, acceptTerms: agreements.terms, acceptPrivacy: agreements.privacy, consentVersion: applicationConsentVersion });
      sessionStorage.removeItem("sbf-account-return");
      window.location.assign(`/membership/request-received?id=${encodeURIComponent(result.applicationId)}`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Please retry."); setBusy(false); }
  }
  const address = (value: object | null | undefined) => value ? [...new Set(["line1", "line2", "subdistrict", "district", "city", "state", "province", "postalCode", "country"].map(key => (value as Record<string, string>)[key]).filter(Boolean))].join(", ") : "Complete this in your Dashboard.";
  return <div className="mx-auto max-w-7xl px-5 pb-28 sm:px-8"><MembershipEligibilityNotice /><div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_25rem]">
    <div className="space-y-6">
      <section className="rounded-sm border border-gold/30 bg-card/40 p-6 sm:p-8"><p className="text-eyebrow text-gold">Your account, ready for review</p><h2 className="mt-3 font-display text-3xl">Saved Dashboard information</h2><p className="mt-3 text-sm text-muted-foreground">Your profile, default addresses and verified cards are loaded from your Account Center.</p>
        {busy && !review && <p role="status" className="mt-6">Loading your account…</p>}
        {review && <div className="mt-7 space-y-7">{[
          { title: "Customer", content: <><p>{review.customer.fullName || "Name required"}</p><p className="break-all">{review.customer.email}</p><p>{review.customer.phone || "Phone required"}</p></>, section: "personal" },
          { title: "Billing address", content: address(review.billingAddress), section: "addresses" },
          { title: "Thailand delivery address", content: address(review.deliveryAddress), section: "addresses" },
        ].map(item => <div key={item.title} className="border-t border-border/60 pt-5"><div className="flex items-center justify-between gap-4"><h3 className="text-eyebrow text-gold">{item.title}</h3><a href={dashboard(item.section)} className="text-sm text-gold underline">Edit in Dashboard</a></div><div className="mt-3 text-sm leading-7">{item.content}</div></div>)}</div>}
      </section>
      <section className="space-y-5 rounded-sm border border-border/60 bg-card/30 p-6 sm:p-8"><div className="flex items-center gap-3 text-gold"><CreditCard size={20} /><h2 className="text-eyebrow">Payment method</h2></div>
        {card ? <><p className="capitalize">{card.brand} •••• {card.last4} <span className="ml-2 text-xs text-gold">VERIFIED</span></p><p className="text-sm text-muted-foreground">Expires {String(card.expMonth).padStart(2, "0")}/{card.expYear}</p><button onClick={() => setChangeCard(!changeCard)} className="text-sm text-gold underline">CHANGE PAYMENT METHOD</button></> : <p className="text-sm text-muted-foreground">Add and verify a card in your Dashboard, then set it as default.</p>}
        {changeCard && <fieldset className="space-y-3"><legend className="mb-3 text-sm">Choose a verified saved card</legend>{review?.cards.map(item => <label key={item.id} className="flex gap-3 rounded-sm border border-border p-4 text-sm"><input type="radio" name="saved-card" value={item.id} checked={selectedCard === item.id} onChange={() => { setSelectedCard(item.id); setAgreements({ eligibility: false, authorization: false, terms: false, privacy: false }); }} /><span className="capitalize">{item.brand} •••• {item.last4} · {item.expMonth}/{item.expYear}{item.isDefault ? " · Default" : ""}</span></label>)}</fieldset>}
        <a href={dashboard("payment-methods")} className="block text-sm text-gold underline">Manage cards / add a new payment method</a><p className="text-sm leading-6 text-muted-foreground">New cards are verified in your Dashboard with a separate, automatically refunded USD $2 payment. That verification is never included in this membership total.</p>
      </section>
      {!review?.complete && review && <button onClick={() => setShowMissing(true)} className="w-full rounded-sm border border-gold/40 p-5 text-gold">COMPLETE YOUR ACCOUNT</button>}
      <section className="space-y-4 rounded-sm border border-border/60 p-6 text-sm sm:p-8"><h2 className="text-eyebrow text-gold">Application agreements</h2>
        <label className="flex gap-3 rounded-sm border border-gold/40 bg-gold/5 p-4 leading-7"><input type="checkbox" required checked={agreements.eligibility} onChange={e => setAgreements({ ...agreements, eligibility: e.target.checked })} className="mt-1.5 size-4 shrink-0 accent-[var(--gold)]" /><span>{membershipEligibilityConfirmation}</span></label>
        <label className="flex gap-3 leading-6"><input type="checkbox" checked={agreements.authorization} onChange={e => setAgreements({ ...agreements, authorization: e.target.checked })} /><span>{chargeAuthorization} The exact authorized amount is <strong>{money(snapshot.total)}</strong>.</span></label>
        <label className="flex gap-3"><input type="checkbox" checked={agreements.terms} onChange={e => setAgreements({ ...agreements, terms: e.target.checked })} /><span>I accept the <a href="/terms-and-conditions" className="text-gold underline">Membership Terms & Conditions</a>.</span></label>
        <label className="flex gap-3"><input type="checkbox" checked={agreements.privacy} onChange={e => setAgreements({ ...agreements, privacy: e.target.checked })} /><span>I accept the <a href="/privacy-policy" className="text-gold underline">Privacy Policy</a>.</span></label>
      </section>
      {message && <div role="alert" className="space-y-3 rounded-sm border border-gold/40 p-5 text-sm"><p>{message}</p><button onClick={() => window.location.reload()} className="text-gold underline">Reload final review</button></div>}
    </div>
    <aside className="h-fit space-y-5 rounded-sm border border-gold/50 bg-card/50 p-6 lg:sticky lg:top-28"><p className="text-eyebrow text-gold">Your membership application</p><h2 className="font-display text-3xl">{snapshot.plan.name}</h2><PackageSummary snapshot={snapshot} /><a href={`/plans/${snapshot.plan.slug || plan.slug}`} className="inline-block text-sm text-gold underline">Edit months and package</a><div className="space-y-3 border-t border-border pt-5"><p className="flex justify-between gap-3 text-sm"><span>Membership fee</span><span>{money(snapshot.membershipFee)}</span></p><p className="flex justify-between gap-3 text-sm"><span>Package subtotal</span><span>{money(snapshot.packageSubtotal)}</span></p><p className="pt-2 text-sm text-muted-foreground">Final application total</p><p className="mt-2 text-3xl text-gold">{money(snapshot.total)}</p></div><p className="text-sm leading-6 text-muted-foreground">No membership charge on submission. Our team reviews your request before collecting the approved invoice. Membership starts only after successful payment.</p><button disabled={!review?.complete || !card || !prepared?.applicationId || !Object.values(agreements).every(Boolean) || busy} onClick={submit} className="w-full rounded-full bg-gold px-5 py-4 text-eyebrow text-gold-foreground disabled:opacity-40">{busy ? "Please wait…" : "SUBMIT MEMBERSHIP REQUEST"}</button></aside>
  </div>
  <MembershipDialog open={showMissing} onClose={() => setShowMissing(false)} title="Complete your account"><div className="mt-6 space-y-6"><p className="text-sm leading-7 text-muted-foreground">Before submitting your membership application, please complete the required information in your Customer Dashboard. Your plan, selected months and cart are saved.</p><ul className="space-y-3">{review?.requirements.map(item => <li key={item.label} className="flex items-center gap-3 rounded-sm border border-border/60 p-4 text-sm">{item.complete ? <Check size={18} className="shrink-0 text-gold" /> : <CircleAlert size={18} className="shrink-0 text-muted-foreground" />}<span className="flex-1">{item.label}</span>{!item.complete && <a href={dashboard(item.section)} className="inline-flex items-center gap-1 text-gold underline">Complete <ArrowUpRight size={14} /></a>}</li>)}</ul><a href={dashboard(review?.requirements.find(item => !item.complete)?.section ?? "personal")} className="block rounded-full bg-gold px-6 py-4 text-center text-eyebrow text-gold-foreground">COMPLETE MY ACCOUNT</a></div></MembershipDialog>
  </div>;
}
