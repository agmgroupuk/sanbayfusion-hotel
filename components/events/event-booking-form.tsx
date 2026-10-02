"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, ChevronDown, Loader2 } from "lucide-react";
import { requestEventProposal } from "@/app/(site)/events/actions";
import { alcoholEventNotice, alcoholRequirements, beverageOptions, contactMethods, diningOptions, emptyEventBrief, entertainmentOptions, eventBriefSchema, eventDurations, eventLocations, eventStepTitles, eventToday, eventTypes, type EventDraft } from "@/lib/events";
import { site } from "@/lib/site";

const inputClass = "mt-2 min-h-12 w-full min-w-0 rounded-sm border border-border bg-background px-3 py-3 text-base text-foreground outline-none transition-colors focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold/25";
const stepDescriptions = ["Start with the occasion you have in mind. All dates and times refer to Thailand.", "Tell us where you would like to gather. A venue or area is enough to begin the conversation.", "Choose your dining direction. Our team will shape the details with you; there is no fixed menu package to purchase here.", "Consider the drinks your guests will enjoy. Any alcoholic beverage requirements are discussed separately.", "From background music to a complete setup, tell us what the occasion needs.", "Every occasion has its own details. Share travel dates, timing, access, themes or anything else we should consider.", "Review Your Event Brief, then tell us how to reach you with questions and your tailored proposal."];

export function EventBookingForm() {
  const [form, setForm] = useState<EventDraft>(emptyEventBrief);
  const [step, setStep] = useState(0);
  const [submitting, startSubmit] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  function update<K extends keyof EventDraft>(field: K, value: EventDraft[K]) { setForm(current => ({ ...current, [field]: value })); setError(""); }
  function toggle(field: "food" | "beverages" | "entertainment", value: string) {
    setForm(current => ({ ...current, [field]: current[field].includes(value as never) ? current[field].filter(item => item !== value) : [...current[field], value] } as EventDraft));
  }
  function navigate(next: number) {
    setStep(next); setError("");
    requestAnimationFrame(() => { headingRef.current?.focus({ preventScroll: true }); headingRef.current?.scrollIntoView({ block: "start", behavior: "instant" }); });
  }
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (submitting) return;
    if (!formRef.current?.reportValidity()) return;
    if (step < 6) { navigate(step + 1); return; }
    const parsed = eventBriefSchema.safeParse({ ...form, guests: Number(form.guests) });
    if (!parsed.success) { setError("Please review your occasion, date, location and contact details using Previous, then try again."); return; }
    setError("");
    startSubmit(async () => {
      try {
        const result = await requestEventProposal(parsed.data);
        if (!result.ok) { setError(result.error); return; }
        setSubmitted(true);
        requestAnimationFrame(() => headingRef.current?.focus());
      } catch { setError("We couldn't send your brief. Your details are still here; please try again or contact our team."); }
    });
  }
  if (submitted) return <section className="border border-gold/40 bg-gold/5 px-6 py-14 text-center sm:px-12" aria-live="polite"><Check className="mx-auto size-8 text-gold" aria-hidden="true" /><p className="mt-6 text-eyebrow text-gold">The conversation begins</p><h3 ref={headingRef} tabIndex={-1} className="mt-4 font-display text-4xl outline-none">Your event brief has been received.</h3><p className="mx-auto mt-6 max-w-xl text-base leading-8 text-foreground/75">Thank you, {form.name}. Our events team will review your requirements and contact you by your preferred method, {form.preferredContact.toLowerCase()}, to clarify the details and prepare the applicable proposal.</p><p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-muted-foreground">Your event is not yet confirmed. Availability, arrangements and pricing remain subject to review. No payment has been taken.</p><a href={`mailto:${site.email}`} className="mt-8 inline-flex min-h-12 items-center text-sm text-gold underline underline-offset-4">Contact the events team</a></section>;

  return <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] xl:gap-12">
    <div className="min-w-0 border border-border/70 bg-card/20 p-5 sm:p-9">
      <div className="flex items-center justify-between gap-4"><p className="text-eyebrow text-gold" aria-live="polite">Step {String(step + 1).padStart(2, "0")} of 07</p><p className="text-xs text-muted-foreground">A brief, not a booking</p></div>
      <ol aria-label="Event brief progress" className="mt-5 grid grid-cols-7 gap-2">{eventStepTitles.map((title, index) => <li key={title} aria-current={step === index ? "step" : undefined}><span className={`block h-1 ${index <= step ? "bg-gold" : "bg-border"}`} /><span className="sr-only">{title}{index < step ? " completed" : ""}</span></li>)}</ol>
      <h3 ref={headingRef} tabIndex={-1} className="mt-9 scroll-mt-28 font-display text-3xl font-light outline-none sm:text-4xl">{eventStepTitles[step]}</h3>
      <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">{stepDescriptions[step]}</p>
      <form ref={formRef} onSubmit={submit} className="mt-8" aria-label="Build your event">
        <fieldset disabled={submitting} className="min-w-0"><legend className="sr-only">{eventStepTitles[step]}</legend>
        {step === 0 && <div className="grid gap-5 sm:grid-cols-2">
          <SelectField label="Event type" value={form.eventType} options={eventTypes} onChange={value => update("eventType", value)} className="sm:col-span-2" />
          <label className="min-w-0 text-sm">Event date *<input required type="date" min={eventToday()} value={form.date} onChange={e => update("date", e.target.value)} className={inputClass} /></label>
          <label className="min-w-0 text-sm">Start time *<input required type="time" value={form.startTime} onChange={e => update("startTime", e.target.value)} className={inputClass} /><span className="mt-2 block text-xs text-muted-foreground">Thailand time (UTC+7)</span></label>
          <SelectField label="Approximate duration" value={form.duration} options={eventDurations} onChange={value => update("duration", value)} />
          <label className="min-w-0 text-sm">Expected number of guests *<input required type="number" min={1} max={500} step={1} inputMode="numeric" value={form.guests} onChange={e => update("guests", e.target.value)} className={inputClass} /></label>
          <p className="text-xs leading-6 text-muted-foreground sm:col-span-2">For more than 500 guests or an uncertain date, <a className="text-gold underline" href="#events-contact">speak with our team</a> to begin planning personally.</p>
        </div>}
        {step === 1 && <div className="space-y-6"><SelectField label="Location type" value={form.locationType} options={eventLocations} onChange={value => update("locationType", value)} /><label className="block text-sm">Venue, residence or area in Thailand *<textarea required minLength={3} maxLength={250} rows={3} value={form.location} onChange={e => update("location", e.target.value)} placeholder="Venue name, city, district or planned accommodation" className={inputClass} /></label><p className="text-xs leading-6 text-muted-foreground">You can share the exact address later. All locations, access arrangements and travel logistics require team review.</p></div>}
        {step === 2 && <div className="space-y-7"><ServiceGroup label="Dining preferences" options={diningOptions} selected={form.food} onToggle={value => toggle("food", value)} /><Notes label="Dietary or special requirements" value={form.dietary} onChange={value => update("dietary", value)} placeholder="Allergies, vegetarian choices, dietary preferences or a custom menu direction" /><p className="text-xs leading-6 text-muted-foreground">Please obtain confirmation from the team before assuming a dietary requirement can be accommodated.</p></div>}
        {step === 3 && <div className="space-y-7"><ServiceGroup label="Non-alcoholic beverages" options={beverageOptions} selected={form.beverages} onToggle={value => toggle("beverages", value)} /><Notes label="Custom beverage requirements" value={form.beverageNotes} onChange={value => update("beverageNotes", value)} placeholder="Preferred styles, serving arrangements or other requirements" /><fieldset className="space-y-3 border-t border-border/60 pt-6"><legend className="pr-3 text-sm">Alcoholic beverage requirements *</legend>{alcoholRequirements.map(option => <label key={option} className={`flex min-h-14 cursor-pointer items-start gap-3 border p-4 text-sm leading-6 ${form.alcoholDiscussion === option ? "border-gold/60 bg-gold/5" : "border-border/60"}`}><input type="radio" required name="alcoholDiscussion" value={option} checked={form.alcoholDiscussion === option} onChange={() => update("alcoholDiscussion", option)} className="mt-1 size-4 shrink-0 accent-[var(--gold)]" /><span>{option}</span></label>)}<p className="pt-2 text-xs leading-6 text-muted-foreground">{alcoholEventNotice} No alcohol products are purchased, priced or invoiced through this form.</p></fieldset></div>}
        {step === 4 && <div className="space-y-7"><ServiceGroup label="Entertainment & production" options={entertainmentOptions} selected={form.entertainment} onToggle={value => toggle("entertainment", value)} /><Notes label="Custom entertainment requirements" value={form.entertainmentNotes} onChange={value => update("entertainmentNotes", value)} placeholder="Music direction, performers, equipment, setup or venue restrictions" /></div>}
        {step === 5 && <div><Notes label="Anything else we should know?" value={form.specialRequests} onChange={value => update("specialRequests", value)} maxLength={2000} rows={9} placeholder="Travel dates and arrival plans, the mood you have in mind, guest needs, access, setup timings, flowers, photography or any special arrangements…" /><p className="mt-3 text-xs leading-6 text-muted-foreground">Optional. Please do not include passport details, card information or sensitive information about your guests.</p></div>}
        {step === 6 && <div className="space-y-6"><div className="grid gap-5 sm:grid-cols-2"><label className="text-sm sm:col-span-2">Full name *<input required minLength={2} maxLength={120} autoComplete="name" value={form.name} onChange={e => update("name", e.target.value)} className={inputClass} /></label><label className="min-w-0 text-sm">Email *<input required type="email" maxLength={200} autoComplete="email" value={form.email} onChange={e => update("email", e.target.value)} className={inputClass} /></label><label className="min-w-0 text-sm">Phone with country code *<input required type="tel" minLength={6} maxLength={40} autoComplete="tel" value={form.phone} onChange={e => update("phone", e.target.value)} className={inputClass} /></label><SelectField label="Preferred contact method" value={form.preferredContact} options={contactMethods} onChange={value => update("preferredContact", value)} className="sm:col-span-2" /></div><p className="text-xs leading-6 text-muted-foreground">For WhatsApp, use the phone number entered above. We use your details to review and respond to this enquiry. Read our <Link href="/privacy-policy" className="text-gold underline underline-offset-4">Privacy Policy</Link>.</p><div className="border-l border-gold/60 bg-gold/5 p-5 text-sm leading-7"><strong className="font-medium">Request a proposal, not an instant booking.</strong><p className="mt-2 text-foreground/75">Submission does not confirm your event, guarantee availability, create a final quotation or charge you. Our team reviews the complete brief before preparing the applicable proposal.</p></div></div>}
        </fieldset>
        {error && <p role="alert" className="mt-6 border border-destructive/40 p-4 text-sm leading-7">{error}</p>}
        <div className="mt-9 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-6">
          {step > 0 ? <button type="button" disabled={submitting} onClick={() => navigate(step - 1)} className="inline-flex min-h-12 items-center gap-2 px-2 text-sm disabled:opacity-50"><ArrowLeft size={16} aria-hidden="true" />Previous</button> : <span className="text-xs text-muted-foreground">* Required fields</span>}
          <button type="submit" disabled={submitting} className="inline-flex min-h-12 max-w-full items-center justify-center gap-3 rounded-full bg-gold px-5 py-4 text-xs font-medium uppercase tracking-[0.12em] text-gold-foreground disabled:opacity-50 sm:px-7">{submitting ? <><Loader2 className="size-4 animate-spin" aria-hidden="true" />Sending your brief…</> : step === 6 ? "Request My Event Proposal" : <>Continue<ArrowRight size={16} aria-hidden="true" /></>}</button>
        </div>
      </form>
    </div>
    <aside aria-label="Your Event Brief" className="order-first min-w-0 border border-gold/35 bg-gold/[0.04] lg:sticky lg:top-28 lg:order-last">
      <details className="group lg:hidden"><summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 p-5 text-sm"><span><span className="block text-eyebrow text-gold">Your Event Brief</span><span className="mt-2 block text-xs text-muted-foreground">{form.eventType || "Your occasion starts here"}{form.guests ? ` · ${form.guests} guests` : ""}</span></span><ChevronDown size={18} className="shrink-0 text-gold transition-transform group-open:rotate-180" aria-hidden="true" /></summary><BriefSummary form={form} /></details>
      <div className="hidden lg:block"><div className="border-b border-gold/20 p-7"><p className="text-eyebrow text-gold">Your Event Brief</p><p className="mt-4 font-display text-2xl">The details, coming together.</p></div><BriefSummary form={form} /></div>
    </aside>
  </div>;
}

function SelectField({ label, value, options, onChange, className = "" }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void; className?: string }) {
  return <label className={`min-w-0 text-sm ${className}`}>{label} *<select required value={value} onChange={e => onChange(e.target.value)} className={inputClass}><option value="">Please select</option>{options.map(option => <option key={option} value={option}>{option}</option>)}</select></label>;
}
function Notes({ label, value, onChange, placeholder, maxLength = 500, rows = 4 }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; maxLength?: number; rows?: number }) {
  return <label className="block text-sm">{label}<textarea value={value} onChange={e => onChange(e.target.value)} maxLength={maxLength} rows={rows} placeholder={placeholder} className={inputClass} /><span className="mt-2 block text-right text-xs text-muted-foreground">{value.length} / {maxLength}</span></label>;
}
function ServiceGroup({ label, options, selected, onToggle }: { label: string; options: readonly string[]; selected: readonly string[]; onToggle: (value: string) => void }) {
  return <fieldset><legend className="text-sm">{label}</legend><p className="mt-2 text-xs text-muted-foreground">Choose any that interest you, or leave open for discussion.</p><div className="mt-5 grid gap-3 sm:grid-cols-2">{options.map(option => <label key={option} className={`flex min-h-14 cursor-pointer items-start gap-3 border px-4 py-4 text-sm leading-6 transition-colors ${selected.includes(option) ? "border-gold/60 bg-gold/5" : "border-border/60 hover:border-gold/30"}`}><input type="checkbox" checked={selected.includes(option)} onChange={() => onToggle(option)} className="mt-1 size-4 shrink-0 accent-[var(--gold)]" /><span>{option}</span></label>)}</div></fieldset>;
}
function BriefSummary({ form }: { form: EventDraft }) {
  const items = [
    ["Event", form.eventType || "Your occasion"],
    ["Date & time", [form.date, form.startTime && `${form.startTime} Thailand time`, form.duration].filter(Boolean).join(" · ") || "Not yet selected"],
    ["Guest count", form.guests || "Not yet selected"], ["Location", [form.locationType, form.location].filter(Boolean).join(" · ") || "Not yet selected"],
    ["Dining", [form.food.join(", "), form.dietary].filter(Boolean).join(" · ") || "Open for discussion"],
    ["Beverages", [form.beverages.join(", "), form.beverageNotes, form.alcoholDiscussion].filter(Boolean).join(" · ") || "Open for discussion"],
    ["Entertainment", [form.entertainment.join(", "), form.entertainmentNotes].filter(Boolean).join(" · ") || "Open for discussion"],
    ["Additional requirements", form.specialRequests || "No additional details yet"],
  ];
  return <div className="p-5 pt-2 lg:p-7"><dl className="space-y-4">{items.map(([label, value]) => <div key={label} className="border-b border-gold/15 pb-4"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-2 max-h-28 overflow-y-auto whitespace-pre-wrap break-words text-sm leading-6 [overflow-wrap:anywhere]">{value}</dd></div>)}</dl><p className="mt-5 text-xs leading-6 text-muted-foreground">No fixed package price. Your proposal is prepared after a personal review of requirements and availability.</p></div>;
}
