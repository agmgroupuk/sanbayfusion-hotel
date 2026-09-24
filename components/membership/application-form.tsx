"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { submitMembershipApplication } from "@/app/membership/actions";
import { catalogueCategories } from "@/lib/catalogue";
import { beverageAddOns, membershipPlans, type MembershipPlan } from "@/lib/membership-plans";
import { membershipConfigurationStorageKey } from "@/components/membership/membership-detail";
import type { MembershipApplicationInput, MembershipConfiguration } from "@/lib/membership-request";

const contactOptions = ["phone", "email", "line", "whatsapp"] as const;

type ApplicationFormState = {
  fullName: string;
  phone: string;
  email: string;
  lineId: string;
  whatsappNumber: string;
  addressLine1: string;
  addressLine2: string;
  subdistrict: string;
  district: string;
  province: string;
  postalCode: string;
  country: "Thailand";
  deliveryInstructions: string;
  contactPreferences: Array<(typeof contactOptions)[number]>;
  notes: string;
  allergies: string;
  confirmsInformation: boolean;
  reviewedMembership: boolean;
  understandsRequest: boolean;
  understandsInvoiceWindow: boolean;
  understandsNonRefundable: boolean;
  understandsPackageLock: boolean;
  understandsDeliveryNotice: boolean;
  agreesTerms: boolean;
  acknowledgesPrivacy: boolean;
  agreesContact: boolean;
  confirmsAlcoholLaw: boolean;
};

export function ApplicationForm() {
  const [configuration, setConfiguration] = useState<MembershipConfiguration | null>(null);
  const [plan, setPlan] = useState<MembershipPlan | null>(null);
  const [error, setError] = useState("");
  const [submittedNumber, setSubmittedNumber] = useState("");
  const [submitting, startSubmitting] = useTransition();
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", lineId: "", whatsappNumber: "", addressLine1: "", addressLine2: "", subdistrict: "", district: "", province: "", postalCode: "", country: "Thailand" as const, deliveryInstructions: "", contactPreferences: ["phone"] as Array<(typeof contactOptions)[number]>, notes: "", allergies: "", confirmsInformation: false, reviewedMembership: false, understandsRequest: false, understandsInvoiceWindow: false, understandsNonRefundable: false, understandsPackageLock: false, understandsDeliveryNotice: false, agreesTerms: false, acknowledgesPrivacy: false, agreesContact: false, confirmsAlcoholLaw: false });

  useEffect(() => {
    const stored = window.sessionStorage.getItem(membershipConfigurationStorageKey);
    if (!stored) return;
    try {
      const next = JSON.parse(stored) as MembershipConfiguration;
      setConfiguration(next);
      setPlan(membershipPlans.find((item) => item.slug === next.planSlug) ?? null);
    } catch {
      window.sessionStorage.removeItem(membershipConfigurationStorageKey);
    }
  }, []);

  const addOnTotal = useMemo(() => {
    if (!configuration) return 0;
    const legacyAddOnTotal = configuration.selectedAddOns.reduce((sum, selected) => sum + (beverageAddOns.find((addOn) => addOn.category === selected.category)?.price ?? 0) * selected.quantity, 0);
    const selectedProductTotal = configuration.selectedProducts.reduce((sum, selected) => {
      const category = catalogueCategories.find((item) => item.name === selected.category);
      const price = category?.products.find((item) => item.name === selected.name)?.price ?? 0;
      return sum + price * selected.quantity;
    }, 0);
    return legacyAddOnTotal + selectedProductTotal;
  }, [configuration]);

  function update(field: string, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleContact(value: (typeof contactOptions)[number]) {
    setForm((current) => ({ ...current, contactPreferences: current.contactPreferences.includes(value) ? current.contactPreferences.filter((item) => item !== value) : [...current.contactPreferences, value] }));
  }

  function submit() {
    if (!configuration) return;
    setError("");
    startSubmitting(async () => {
      const payload: MembershipApplicationInput = { configuration, ...form, country: "Thailand" as const };
      const result = await submitMembershipApplication(payload);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      window.sessionStorage.setItem("sbf-membership-success", JSON.stringify({ requestNumber: result.requestNumber, planName: plan?.name, plan, configuration }));
      window.sessionStorage.removeItem(membershipConfigurationStorageKey);
      setSubmittedNumber(result.requestNumber);
      window.location.href = `/membership/thank-you?request=${encodeURIComponent(result.requestNumber)}&plan=${encodeURIComponent(plan?.slug ?? "")}`;
    });
  }

  if (!configuration || !plan) return <div className="rounded-sm border border-border/60 bg-card/30 p-8 text-center"><p className="text-sm text-foreground/75">Your membership selection is not available in this session.</p><a href="/plans" className="mt-6 inline-flex rounded-full bg-gold px-7 py-3 text-eyebrow text-gold-foreground">View Membership Plans</a></div>;
  if (submittedNumber) return null;

  const inputClass = "mt-2 h-11 w-full rounded-sm border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40";
  const textareaClass = "mt-2 min-h-28 w-full rounded-sm border border-input bg-background px-3 py-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40";
  const selectedPlanTotal = plan.price + addOnTotal;

  return <form onSubmit={(event) => { event.preventDefault(); submit(); }} className="space-y-14">
    <section><p className="text-eyebrow text-gold">Your selected membership</p><div className="mt-6 rounded-sm border border-gold/40 bg-gold/5 p-6 sm:p-8"><div className="flex flex-wrap items-start justify-between gap-5"><div><h2 className="font-display text-3xl font-light italic">{plan.name}</h2><p className="mt-3 text-sm text-muted-foreground">12-month membership · {configuration.deliveryArea}</p></div><p className="text-2xl text-gold">฿{plan.price.toLocaleString("en-US")}</p></div><dl className="mt-7 grid gap-4 border-t border-border/50 pt-6 text-sm sm:grid-cols-2"><div><dt className="text-muted-foreground">Delivery</dt><dd className="mt-1">{plan.deliveryDays} days/month · {plan.deliveryDaysPerYear} days/year</dd></div><div><dt className="text-muted-foreground">Preferred delivery</dt><dd className="mt-1">{configuration.preferredDay} · {configuration.preferredTime}</dd></div><div><dt className="text-muted-foreground">Food preferences</dt><dd className="mt-1">{configuration.foodPreferences.join(", ") || "No preference selected"}</dd></div><div><dt className="text-muted-foreground">Beverage options</dt><dd className="mt-1">{configuration.alcoholEnabled ? "Enabled" : "Off"}</dd></div></dl>{configuration.selectedProducts.length > 0 && <div className="mt-6 border-t border-border/50 pt-6 text-sm"><p className="text-muted-foreground">Selected catalogue products</p>{configuration.selectedProducts.map((item) => { const category = catalogueCategories.find((entry) => entry.name === item.category); const price = category?.products.find((product) => product.name === item.name)?.price ?? 0; return <p key={`${item.category}-${item.name}`} className="mt-2 flex justify-between gap-4"><span>{item.name} × {item.quantity}</span><span>฿{(price * item.quantity).toLocaleString("en-US")}</span></p>; })}</div>}{configuration.selectedAddOns.length > 0 && <div className="mt-6 border-t border-border/50 pt-6 text-sm"><p className="text-muted-foreground">Selected add-ons</p>{configuration.selectedAddOns.map((item) => <p key={item.category} className="mt-2 flex justify-between"><span>{item.name} × {item.quantity}</span><span>Included in estimate</span></p>)}</div>}<div className="mt-6 flex items-center justify-between border-t border-border/50 pt-6 text-lg"><span>Estimated membership total</span><strong className="text-gold">฿{selectedPlanTotal.toLocaleString("en-US")}</strong></div><a href={`/plans/${plan.slug}`} className="mt-6 inline-flex rounded-full border border-foreground/30 px-6 py-3 text-eyebrow">Edit Membership</a></div></section>

    <section><p className="text-eyebrow text-gold">Your information</p><div className="mt-6 grid gap-6"><label className="text-sm">Full Name *<input required value={form.fullName} onChange={(event) => update("fullName", event.target.value)} className={inputClass} /></label></div></section>

    <section><p className="text-eyebrow text-gold">Delivery address</p><div className="mt-6 grid gap-6 sm:grid-cols-2"><label className="text-sm sm:col-span-2">Address Line 1 *<input required placeholder="House / Building / Condo" value={form.addressLine1} onChange={(event) => update("addressLine1", event.target.value)} className={inputClass} /></label><label className="text-sm sm:col-span-2">Address Line 2<input placeholder="Room / Unit / Floor" value={form.addressLine2} onChange={(event) => update("addressLine2", event.target.value)} className={inputClass} /></label><label className="text-sm">Subdistrict<input value={form.subdistrict} onChange={(event) => update("subdistrict", event.target.value)} className={inputClass} /></label><label className="text-sm">District<input value={form.district} onChange={(event) => update("district", event.target.value)} className={inputClass} /></label><label className="text-sm">Province *<input required value={form.province} onChange={(event) => update("province", event.target.value)} className={inputClass} /></label><label className="text-sm">Postal Code *<input required value={form.postalCode} onChange={(event) => update("postalCode", event.target.value)} className={inputClass} /></label><label className="text-sm">Country<input readOnly value={form.country} className={inputClass} /></label><label className="text-sm sm:col-span-2">Delivery Instructions<textarea placeholder="Gate number, building entrance, security instructions, landmark, etc." value={form.deliveryInstructions} onChange={(event) => update("deliveryInstructions", event.target.value)} className={textareaClass} /></label></div></section>

    <section><p className="text-eyebrow text-gold">Contact details</p><p className="mt-4 text-sm text-muted-foreground">Select every method you would like us to use. The matching contact field opens underneath each selected method.</p><div className="mt-6 grid gap-3 sm:grid-cols-2">{contactOptions.map((option) => { const selected = form.contactPreferences.includes(option); const labels = { phone: "Phone", email: "Email", line: "LINE", whatsapp: "WhatsApp" } as const; return <div key={option} className={`rounded-sm border p-4 transition-colors ${selected ? "border-gold/60 bg-gold/5" : "border-border/60"}`}><label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={selected} onChange={() => toggleContact(option)} className="size-4 accent-[var(--gold)]" />{labels[option]}</label>{selected && option === "email" && <label className="mt-4 block text-sm">Email Address *<input required type="email" autoComplete="email" value={form.email} onChange={(event) => update("email", event.target.value)} className={inputClass} /></label>}{selected && option === "phone" && <label className="mt-4 block text-sm">Phone Number *<input required type="tel" inputMode="tel" autoComplete="tel" pattern="\\+?[0-9][0-9\\s().-]{5,38}" placeholder="+66 81 234 5678" value={form.phone} onChange={(event) => update("phone", event.target.value)} className={inputClass} /></label>}{selected && option === "line" && <label className="mt-4 block text-sm">LINE ID *<input required autoComplete="off" value={form.lineId} onChange={(event) => update("lineId", event.target.value)} className={inputClass} /></label>}{selected && option === "whatsapp" && <label className="mt-4 block text-sm">WhatsApp Number *<input required type="tel" inputMode="tel" autoComplete="tel" pattern="\\+?[0-9][0-9\\s().-]{5,38}" placeholder="+66 81 234 5678" value={form.whatsappNumber} onChange={(event) => update("whatsappNumber", event.target.value)} className={inputClass} /></label>}</div>; })}</div></section>

    <section><p className="text-eyebrow text-gold">Anything we should know?</p><textarea placeholder="Food preferences, delivery requirements, allergy information, preferred contact time or other membership requests." value={form.notes} onChange={(event) => update("notes", event.target.value)} className={textareaClass} /><div className="mt-7 rounded-sm border border-gold/40 bg-gold/5 p-5 text-sm leading-relaxed"><strong>Food Allergy Notice</strong><p className="mt-2 text-foreground/75">Specific dietary requirements must be confirmed by the Sanbay Fusion team before membership approval.</p><label className="mt-5 block">Allergies / Dietary Restrictions<textarea value={form.allergies} onChange={(event) => update("allergies", event.target.value)} className={textareaClass} /></label></div></section>

    <section><p className="text-eyebrow text-gold">Request summary</p><div className="mt-6 rounded-sm border border-border/60 bg-card/30 p-6 text-sm sm:p-8"><div className="space-y-3"><p className="flex justify-between"><span className="text-muted-foreground">Membership</span><span>{plan.name}</span></p><p className="flex justify-between"><span className="text-muted-foreground">Membership term</span><span>12 months</span></p><p className="flex justify-between"><span className="text-muted-foreground">Membership fee</span><span>฿{plan.price.toLocaleString("en-US")}</span></p><p className="flex justify-between"><span className="text-muted-foreground">Beverage add-ons</span><span>฿{addOnTotal.toLocaleString("en-US")}</span></p><p className="flex justify-between border-t border-border/50 pt-4 text-lg"><strong>Estimated total</strong><strong className="text-gold">฿{selectedPlanTotal.toLocaleString("en-US")}</strong></p></div></div></section>

    <section className="space-y-4 text-sm"><div className="rounded-sm border border-gold/40 bg-gold/5 p-5 leading-relaxed"><p className="text-eyebrow text-gold">Important membership rules</p><p className="mt-3">12-month membership · 3-day invoice payment window · membership fee non-refundable except where required by law · minimum 3-day delivery notice · finalized package locked after activation · suitable substitutions may be offered if products become unavailable.</p></div><label className="flex gap-3"><input type="checkbox" checked={form.confirmsInformation} onChange={(event) => update("confirmsInformation", event.target.checked)} className="mt-1 size-4 accent-[var(--gold)]" />I confirm that the information provided is correct.</label><label className="flex gap-3"><input type="checkbox" checked={form.reviewedMembership} onChange={(event) => update("reviewedMembership", event.target.checked)} className="mt-1 size-4 accent-[var(--gold)]" />I have reviewed my selected membership and configuration.</label><label className="flex gap-3"><input type="checkbox" checked={form.understandsRequest} onChange={(event) => update("understandsRequest", event.target.checked)} className="mt-1 size-4 accent-[var(--gold)]" />I understand that this request does not activate membership or take payment.</label><label className="flex gap-3"><input type="checkbox" checked={form.understandsInvoiceWindow} onChange={(event) => update("understandsInvoiceWindow", event.target.checked)} className="mt-1 size-4 accent-[var(--gold)]" />I understand an approved request may receive an invoice payable within 3 days.</label><label className="flex gap-3"><input type="checkbox" checked={form.understandsNonRefundable} onChange={(event) => update("understandsNonRefundable", event.target.checked)} className="mt-1 size-4 accent-[var(--gold)]" />I understand membership fees are non-refundable after payment and activation except where required by law.</label><label className="flex gap-3"><input type="checkbox" checked={form.understandsPackageLock} onChange={(event) => update("understandsPackageLock", event.target.checked)} className="mt-1 size-4 accent-[var(--gold)]" />I understand the finalized package cannot normally be changed during its active term.</label><label className="flex gap-3"><input type="checkbox" checked={form.understandsDeliveryNotice} onChange={(event) => update("understandsDeliveryNotice", event.target.checked)} className="mt-1 size-4 accent-[var(--gold)]" />I understand eligible deliveries normally require at least 3 days' advance notice.</label><label className="flex gap-3"><input type="checkbox" checked={form.agreesTerms} onChange={(event) => update("agreesTerms", event.target.checked)} className="mt-1 size-4 accent-[var(--gold)]" />I agree to the <a href="/terms-and-conditions" className="text-gold underline underline-offset-4">Membership Terms & Conditions</a>.</label><label className="flex gap-3"><input type="checkbox" checked={form.acknowledgesPrivacy} onChange={(event) => update("acknowledgesPrivacy", event.target.checked)} className="mt-1 size-4 accent-[var(--gold)]" />I acknowledge that I have read the <a href="/privacy-policy" className="text-gold underline underline-offset-4">Privacy Policy</a>.</label><label className="flex gap-3"><input type="checkbox" checked={form.agreesContact} onChange={(event) => update("agreesContact", event.target.checked)} className="mt-1 size-4 accent-[var(--gold)]" />I agree to be contacted by the Sanbay Fusion team regarding this request.</label>{configuration.alcoholEnabled && <label className="flex gap-3"><input type="checkbox" checked={form.confirmsAlcoholLaw} onChange={(event) => update("confirmsAlcoholLaw", event.target.checked)} className="mt-1 size-4 accent-[var(--gold)]" />I understand alcohol options are age-restricted and subject to applicable Thai requirements.</label>}{error && <p className="rounded-sm border border-destructive/40 bg-destructive/10 p-4 text-destructive">{error}</p>}<button type="submit" disabled={submitting || !form.confirmsInformation || !form.reviewedMembership || !form.understandsRequest || !form.understandsInvoiceWindow || !form.understandsNonRefundable || !form.understandsPackageLock || !form.understandsDeliveryNotice || !form.agreesTerms || !form.acknowledgesPrivacy || !form.agreesContact || (configuration.alcoholEnabled && !form.confirmsAlcoholLaw)} className="inline-flex w-full items-center justify-center rounded-full bg-gold px-7 py-4 text-eyebrow text-gold-foreground disabled:cursor-not-allowed disabled:opacity-50">{submitting ? "Submitting Request..." : "Submit Membership Request"}</button></section>
  </form>;
}

