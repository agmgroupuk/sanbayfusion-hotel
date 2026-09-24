"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, Loader2, Send, Users } from "lucide-react";
import { sendContactMessageAction } from "@/app/(site)/contact/actions";
import { catalogueCategories } from "@/lib/catalogue";
import { site } from "@/lib/site";

const eventTypes = ["Birthday party", "Private home party", "Anniversary celebration", "Family gathering", "Corporate party", "Festival celebration", "Holiday party", "Engagement party", "Private dinner", "Special event", "Custom event"];
const foodServices = ["Thai food", "International food", "Appetizers & finger food", "BBQ / grill", "Buffet", "Premium/VIP menu", "Desserts", "Snacks", "Custom catering"];
const beverageServices = ["Soft drinks", "Water", "Mixers", "Non-alcoholic beverages"];
const entertainmentServices = ["DJ", "Music", "Sound system", "Speakers", "Microphones", "Party music setup", "Custom entertainment requirements"];
const serviceLevels = ["Essential gathering", "Signature celebration", "Premium event", "VIP hosted experience"];
const alcoholCategories = catalogueCategories.filter((category) => category.group === "alcohol");

type EventFormState = {
  eventType: string;
  guests: number;
  date: string;
  startTime: string;
  duration: string;
  location: string;
  serviceLevel: string;
  food: string[];
  beverages: string[];
  entertainment: string[];
  alcohol: Record<string, string>;
  specialRequests: string;
  name: string;
  email: string;
  phone: string;
};

const initialState: EventFormState = { eventType: eventTypes[0], guests: 50, date: "", startTime: "18:00", duration: "4 hours", location: "", serviceLevel: serviceLevels[1], food: [foodServices[0], foodServices[4]], beverages: [beverageServices[0], beverageServices[1]], entertainment: [], alcohol: {}, specialRequests: "", name: "", email: "", phone: "" };
const inputClass = "mt-2 h-11 w-full rounded-sm border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40";

export function EventBookingForm() {
  const [form, setForm] = useState<EventFormState>(initialState);
  const [submitting, startSubmit] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const alcoholSelections = Object.entries(form.alcohol).filter(([, product]) => product);
  const alcoholTotal = useMemo(() => alcoholSelections.reduce((total, [categoryName, productName]) => total + (catalogueCategories.find((category) => category.name === categoryName)?.products.find((product) => product.name === productName)?.price ?? 0), 0), [alcoholSelections]);

  function update<K extends keyof EventFormState>(field: K, value: EventFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggle(field: "food" | "beverages" | "entertainment", value: string) {
    setForm((current) => ({ ...current, [field]: current[field].includes(value) ? current[field].filter((item) => item !== value) : [...current[field], value] }));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    startSubmit(async () => {
      const alcoholSummary = alcoholSelections.map(([category, product]) => `${category}: ${product}`).join("; ") || "None selected";
      const message = [
        "PRIVATE EVENT ENQUIRY",
        `Event: ${form.eventType}`,
        `Guests: ${form.guests}`,
        `Date/time: ${form.date} at ${form.startTime} for ${form.duration}`,
        `Location: ${form.location}`,
        `Service level: ${form.serviceLevel}`,
        `Food & catering: ${form.food.join(", ") || "To be discussed"}`,
        `Beverages: ${form.beverages.join(", ") || "To be discussed"}`,
        `Alcohol: ${alcoholSummary}`,
        `Entertainment: ${form.entertainment.join(", ") || "To be discussed"}`,
        `Special requests: ${form.specialRequests || "None"}`,
      ].join("\n");
      const result = await sendContactMessageAction({ name: form.name, email: form.email, phone: form.phone, message });
      if (!result.ok) { setError(result.error); return; }
      setSubmitted(true);
    });
  }

  if (submitted) return <div className="rounded-sm border border-gold/50 bg-gold/5 p-8 text-center sm:p-12"><div className="mx-auto flex size-12 items-center justify-center rounded-full border border-gold/50 text-gold"><Check className="size-5" /></div><h2 className="mt-6 font-display text-3xl font-light italic">Event enquiry received</h2><p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-foreground/75">Thank you, {form.name}. Our events team will review your requirements and contact you at {form.email} to shape the menu, service plan, staffing, and final quotation.</p></div>;

  return <form onSubmit={submit} className="space-y-12">
    <section><div className="flex items-center gap-3"><Users className="size-5 text-gold" /><p className="text-eyebrow text-gold">Event brief</p></div><div className="mt-6 grid gap-6 sm:grid-cols-2"><label className="text-sm">Event type<select required value={form.eventType} onChange={(event) => update("eventType", event.target.value)} className={inputClass}>{eventTypes.map((item) => <option key={item}>{item}</option>)}</select></label><label className="text-sm">Service level<select required value={form.serviceLevel} onChange={(event) => update("serviceLevel", event.target.value)} className={inputClass}>{serviceLevels.map((item) => <option key={item}>{item}</option>)}</select></label><label className="text-sm">Expected guests<input required type="number" min={10} max={500} value={form.guests} onChange={(event) => update("guests", Number(event.target.value))} className={inputClass} /><span className="mt-2 block text-xs text-muted-foreground">Designed primarily for private events of 50–100 guests.</span></label><label className="text-sm">Event location<input required value={form.location} onChange={(event) => update("location", event.target.value)} placeholder="Home, villa, office, venue or district" className={inputClass} /></label><label className="text-sm">Event date<input required type="date" value={form.date} onChange={(event) => update("date", event.target.value)} className={inputClass} /></label><label className="text-sm">Preferred start time<input required type="time" value={form.startTime} onChange={(event) => update("startTime", event.target.value)} className={inputClass} /></label><label className="text-sm sm:col-span-2">Approximate duration<select value={form.duration} onChange={(event) => update("duration", event.target.value)} className={inputClass}>{["3 hours", "4 hours", "5 hours", "6+ hours", "To be discussed"].map((item) => <option key={item}>{item}</option>)}</select></label></div></section>

    <ServiceGroup title="Food & catering" options={foodServices} selected={form.food} onToggle={(item) => toggle("food", item)} />
    <ServiceGroup title="Beverages" options={beverageServices} selected={form.beverages} onToggle={(item) => toggle("beverages", item)} />

    <section><p className="text-eyebrow text-gold">Alcoholic beverages</p><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Select catalogue products for planning. Final availability, legal controls, quantities, and pricing are confirmed by the events team.</p><div className="mt-6 grid gap-4 sm:grid-cols-2">{alcoholCategories.map((category) => <label key={category.name} className="text-sm"><span className="text-foreground/85">{category.name}</span><select value={form.alcohol[category.name] ?? ""} onChange={(event) => setForm((current) => ({ ...current, alcohol: { ...current.alcohol, [category.name]: event.target.value } }))} className={inputClass}><option value="">Discuss options</option>{category.products.map((product) => <option key={product.name} value={product.name}>{product.name} · ฿{product.price.toLocaleString("en-US")}</option>)}</select></label>)}</div>{alcoholTotal > 0 && <p className="mt-4 text-sm text-gold">Catalogue-priced alcohol selections currently total ฿{alcoholTotal.toLocaleString("en-US")} before quantities, service, delivery, taxes, and final confirmation.</p>}</section>
    <ServiceGroup title="Entertainment & production" options={entertainmentServices} selected={form.entertainment} onToggle={(item) => toggle("entertainment", item)} />

    <section><p className="text-eyebrow text-gold">Additional requirements</p><textarea value={form.specialRequests} onChange={(event) => update("specialRequests", event.target.value)} rows={5} maxLength={1000} placeholder="Theme, dietary needs, access details, setup requirements, timings, flowers, photography or anything else we should plan for." className="mt-4 w-full rounded-sm border border-input bg-background px-3 py-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40" /></section>

    <section><p className="text-eyebrow text-gold">Your contact details</p><div className="mt-6 grid gap-6 sm:grid-cols-2"><label className="text-sm">Full name<input required value={form.name} onChange={(event) => update("name", event.target.value)} autoComplete="name" className={inputClass} /></label><label className="text-sm">Email<input required type="email" value={form.email} onChange={(event) => update("email", event.target.value)} autoComplete="email" className={inputClass} /></label><label className="text-sm sm:col-span-2">Phone<input required value={form.phone} onChange={(event) => update("phone", event.target.value)} autoComplete="tel" className={inputClass} /></label></div></section>

    <section className="rounded-sm border border-gold/50 bg-gold/5 p-6 sm:p-8"><p className="text-eyebrow text-gold">Event booking summary</p><div className="mt-6 grid gap-4 text-sm sm:grid-cols-2"><SummaryItem label="Event" value={`${form.eventType} · ${form.guests} guests`} /><SummaryItem label="Date & time" value={form.date ? `${form.date} · ${form.startTime} · ${form.duration}` : "Choose a date and time"} /><SummaryItem label="Location" value={form.location || "Add an event location"} /><SummaryItem label="Service level" value={form.serviceLevel} /><SummaryItem label="Food & catering" value={form.food.join(", ") || "To be discussed"} /><SummaryItem label="Beverages" value={form.beverages.join(", ") || "To be discussed"} /><SummaryItem label="Alcohol" value={alcoholSelections.map(([, product]) => product).join(", ") || "To be discussed"} /><SummaryItem label="Entertainment" value={form.entertainment.join(", ") || "To be discussed"} /></div><p className="mt-6 border-t border-gold/20 pt-5 text-xs leading-relaxed text-muted-foreground">This is an enquiry, not an automatic booking or final quotation. Food, staffing, entertainment, alcohol, delivery, venue access, taxes, and service charges will be confirmed by the events team.</p></section>
    {error && <p className="text-sm text-destructive">{error}</p>}<button type="submit" disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gold px-6 py-4 text-eyebrow text-gold-foreground disabled:opacity-60">{submitting ? <><Loader2 className="size-4 animate-spin" />Sending enquiry...</> : <><Send className="size-4" />Request Event Proposal</>}</button><p className="text-center text-xs text-muted-foreground">Prefer to speak directly? Call {site.phone} or email {site.email}.</p>
  </form>;
}

function ServiceGroup({ title, options, selected, onToggle }: { title: string; options: string[]; selected: string[]; onToggle: (option: string) => void }) {
  return <section><p className="text-eyebrow text-gold">{title}</p><div className="mt-5 grid gap-3 sm:grid-cols-2">{options.map((option) => { const checked = selected.includes(option); return <label key={option} className={`flex cursor-pointer items-center gap-3 rounded-sm border px-4 py-3 text-sm transition-colors ${checked ? "border-gold/70 bg-gold/10" : "border-border/60"}`}><input type="checkbox" checked={checked} onChange={() => onToggle(option)} className="size-4 accent-[var(--gold)]" />{option}</label>; })}</div></section>;
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return <div className="border-t border-gold/20 pt-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-foreground/85">{value}</p></div>;
}