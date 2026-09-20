import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Truck, Utensils } from "lucide-react";
import { PageHeader } from "@/components/site/page-header";
import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Delivery Areas",
  description: "Check Sanbay Fusion delivery areas, windows, and business delivery options in Thailand.",
  alternates: { canonical: "/delivery-areas" },
};

const areas = [
  ["Central delivery zone", "Bangkok core and nearby neighbourhoods", "Included with eligible memberships"],
  ["Extended delivery zone", "Greater Bangkok and selected nearby districts", "Small delivery supplement may apply"],
  ["Business delivery", "Offices, hospitality, events, and team programmes", "Planned by volume and schedule"],
] as const;

export default function DeliveryAreasPage() {
  return <div className="pb-28"><PageHeader eyebrow="Delivery areas" title="Good food, sent with intention" lead="We are building the delivery network around reliable routes, careful packing, and food that arrives ready for the moment it was planned for." /><div className="mx-auto max-w-7xl px-5 sm:px-8"><div className="grid gap-6 lg:grid-cols-3">{areas.map(([title, detail, price], index) => <Reveal key={title} variant="up" delay={index * 0.06}><article className="h-full rounded-sm border border-border/60 bg-card/30 p-8"><MapPin className="size-6 text-gold" /><h2 className="mt-8 font-display text-3xl font-light italic">{title}</h2><p className="mt-4 text-base text-foreground/75">{detail}</p><p className="mt-8 border-t border-border/50 pt-5 text-sm text-gold">{price}</p></article></Reveal>)}</div><Reveal variant="up" className="mt-20 grid gap-8 border-y border-border/60 py-10 md:grid-cols-3"><div><Truck className="size-5 text-gold" /><h2 className="mt-4 font-display text-2xl font-light italic">Scheduled windows</h2><p className="mt-3 text-sm leading-relaxed text-foreground/70">Members choose from the available delivery dates and windows shown for their address.</p></div><div><Utensils className="size-5 text-gold" /><h2 className="mt-4 font-display text-2xl font-light italic">Careful packaging</h2><p className="mt-3 text-sm leading-relaxed text-foreground/70">Food, drinks, and add-ons are packed according to the package type and delivery conditions.</p></div><div><MapPin className="size-5 text-gold" /><h2 className="mt-4 font-display text-2xl font-light italic">Check your address</h2><p className="mt-3 text-sm leading-relaxed text-foreground/70">Tell us your district before payment so we can confirm route availability and any supplement.</p></div></Reveal><div className="mt-16 text-center"><Link href="/join" className="inline-flex rounded-full bg-gold px-7 py-3 text-eyebrow text-gold-foreground">Check My Area</Link></div></div></div>;
}