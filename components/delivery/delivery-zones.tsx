"use client";

import { useState } from "react";
import { ChevronDown, MapPin } from "lucide-react";
import { deliveryZones } from "@/lib/delivery";

export function DeliveryZones() {
  const [openZone, setOpenZone] = useState<string | null>(null);

  return <div className="grid gap-4 lg:grid-cols-3">{deliveryZones.map((zone) => {
    const isOpen = openZone === zone.id;
    return <article key={zone.id} className="rounded-sm border border-border/60 bg-card/30 p-7 sm:p-8">
      <button type="button" aria-expanded={isOpen} onClick={() => setOpenZone(isOpen ? null : zone.id)} className="w-full text-left">
        <span className="flex items-start justify-between gap-4"><MapPin className="size-6 shrink-0 text-gold" /><ChevronDown className={`size-5 shrink-0 text-gold transition-transform ${isOpen ? "rotate-180" : ""}`} /></span>
        <span className="mt-8 block font-display text-3xl font-light italic">{zone.title}</span>
        <span className="mt-4 block text-base text-foreground/75">{zone.summary}</span>
        <span className="mt-8 block border-t border-border/50 pt-5 text-sm text-gold">{zone.additionalCharge}</span>
      </button>
      {isOpen && <div className="mt-6 border-t border-border/50 pt-6 text-sm leading-relaxed"><p className="text-foreground/80">{zone.coverage}</p><dl className="mt-5 space-y-4"><div><dt className="text-xs text-muted-foreground">Estimated delivery range</dt><dd className="mt-1 text-foreground/80">{zone.deliveryRange}</dd></div><div><dt className="text-xs text-muted-foreground">Conditions</dt><dd className="mt-1 text-foreground/80">{zone.conditions.join(" · ")}</dd></div></dl></div>}
    </article>;
  })}</div>;
}