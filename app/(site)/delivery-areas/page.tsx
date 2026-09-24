import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Truck, Utensils } from "lucide-react";
import { PageHeader } from "@/components/site/page-header";
import { Reveal } from "@/components/motion/reveal";
import { DeliveryZones } from "@/components/delivery/delivery-zones";

export const metadata: Metadata = {
  title: "Delivery Areas",
  description: "Check Sanbay Fusion delivery areas, windows, and business delivery options in Thailand.",
  alternates: { canonical: "/delivery-areas" },
};

export default function DeliveryAreasPage() {
  return <div className="pb-28"><PageHeader eyebrow="Delivery areas" title="Good food, sent with intention" lead="We are building the delivery network around reliable routes, careful packing, and food that arrives ready for the moment it was planned for." /><div className="mx-auto max-w-7xl px-5 sm:px-8"><DeliveryZones /><Reveal variant="up" className="mt-20 grid gap-8 border-y border-border/60 py-10 md:grid-cols-3"><div><Truck className="size-5 text-gold" /><h2 className="mt-4 font-display text-2xl font-light italic">Scheduled windows</h2><p className="mt-3 text-sm leading-relaxed text-foreground/70">Members choose from the available delivery dates and windows shown for their address.</p></div><div><Utensils className="size-5 text-gold" /><h2 className="mt-4 font-display text-2xl font-light italic">Careful packaging</h2><p className="mt-3 text-sm leading-relaxed text-foreground/70">Food, drinks, and add-ons are packed according to the package type and delivery conditions.</p></div><div><MapPin className="size-5 text-gold" /><h2 className="mt-4 font-display text-2xl font-light italic">Check your address</h2><p className="mt-3 text-sm leading-relaxed text-foreground/70">Select your address on the delivery checker before membership activation.</p></div></Reveal><div className="mt-16 text-center"><Link href="/delivery-area" className="inline-flex rounded-full bg-gold px-7 py-3 text-eyebrow text-gold-foreground">Check My Area</Link></div></div></div>;
}