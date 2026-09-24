"use client";

import { useState } from "react";
import { MapPin, Search } from "lucide-react";
import { checkDeliveryAvailability, type DeliveryAvailability, type DeliveryPlace } from "@/lib/delivery";

export function DeliveryCheck() {
  const [address, setAddress] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<DeliveryPlace | null>(null);
  const [result, setResult] = useState<DeliveryAvailability | null>(null);

  function findAddress(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(selectedPlace ? checkDeliveryAvailability(selectedPlace) : { status: "needs_review", title: "Select an address from the map", detail: "Enter an address and choose a Google Maps result so we can check the exact location instead of guessing from typed text." });
  }

  function handleAddressChange(value: string) {
    setAddress(value);
    setSelectedPlace(null);
    setResult(null);
  }

  return <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
    <section className="rounded-sm border border-border/60 bg-card/30 p-6 sm:p-8"><div className="flex items-center gap-3"><MapPin className="size-5 text-gold" /><p className="text-eyebrow text-gold">Address search</p></div><h2 className="mt-5 font-display text-3xl font-light italic">Find your delivery location</h2><p className="mt-4 text-sm leading-relaxed text-foreground/70">Search for the exact address you want us to serve. The address field is structured for Google Maps autocomplete and place coordinates when the Maps key is connected.</p><form onSubmit={findAddress} className="mt-7"><label className="text-sm"><span className="text-xs text-muted-foreground">Delivery address</span><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={address} onChange={(event) => handleAddressChange(event.target.value)} placeholder="Search your address" className="mt-2 h-12 w-full rounded-sm border border-input bg-background pl-10 pr-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40" /></div></label><p className="mt-3 text-xs leading-relaxed text-muted-foreground">Google address autocomplete will be connected here. Typed text alone is never used to infer a delivery zone.</p><button type="submit" className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-eyebrow text-gold-foreground"><Search className="size-4" />Check Delivery Availability</button></form>{result && <div className={`mt-8 rounded-sm border p-5 ${result.status === "available" ? "border-gold/60 bg-gold/10" : "border-border/60 bg-background/40"}`}><p className="text-eyebrow text-gold">{result.title}</p><p className="mt-3 text-sm leading-relaxed text-foreground/75">{result.detail}</p>{result.zone && <p className="mt-4 text-sm text-gold">Route: {result.zone}</p>}</div>}</section>
    <aside className="h-fit rounded-sm border border-gold/40 bg-gold/5 p-6 sm:p-8"><p className="text-eyebrow text-gold">City delivery only</p><h2 className="mt-5 font-display text-2xl font-light italic">Built for urban routes</h2><p className="mt-4 text-sm leading-relaxed text-foreground/75">The first release is designed for city and metropolitan delivery. Villages, rural areas, and distant towns are not included until route boundaries are formally configured.</p><p className="mt-5 text-sm leading-relaxed text-muted-foreground">Final coverage, radius, supplements, and delivery windows will be confirmed before membership activation.</p></aside>
  </div>;
}