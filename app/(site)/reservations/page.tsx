import type { Metadata } from "next";
import Image from "next/image";
import { BookingForm } from "@/components/reservations/booking-form";
import { Reveal } from "@/components/motion/reveal";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Reservations",
  description:
    "Reserve your table at Sanbay Fusion Bar & Restaurant — forty seats, one seating, a single tasting menu served across the evening.",
  alternates: {
    canonical: "/reservations",
  },
};

export default function ReservationsPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 pt-28 pb-28 sm:px-8 sm:pt-36">
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        {/* Aside — atmosphere + practical details */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <Reveal variant="fade" className="text-eyebrow text-gold">
            Reservations
          </Reveal>
          <Reveal variant="up" delay={0.05}>
            <h1 className="mt-5 font-display text-h1 font-light">Reserve a table</h1>
          </Reveal>
          <Reveal variant="up" delay={0.1}>
            <p className="lead measure mt-5">
              Forty seats, one seating. We serve a single tasting menu across the
              evening — reserve below and we&apos;ll confirm by email or phone.
            </p>
          </Reveal>

          <Reveal variant="scale" delay={0.1} className="mt-10 hidden overflow-hidden rounded-sm lg:block">
            <div className="relative aspect-[5/4] w-full">
              <Image
                src="/images/nicely-plated-food-served-at-decorated-table.jpg"
                alt="A table set for the evening at Sanbay Fusion Bar & Restaurant"
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover"
              />
            </div>
          </Reveal>

          <Reveal variant="fade" delay={0.15} className="mt-8">
            <h2 className="text-eyebrow text-muted-foreground">Hours</h2>
            <ul className="mt-4 divide-y divide-border/50 text-sm">
              {site.hours.map((h) => (
                <li key={h.days} className="flex items-baseline justify-between py-2.5">
                  <span className="text-foreground/85">{h.days}</span>
                  <span className="text-muted-foreground">{h.time}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-muted-foreground">
              Parties larger than 8?{" "}
              <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="text-gold hover:text-gold/80">
                Call us directly
              </a>
              .
            </p>
          </Reveal>
        </aside>

        {/* The booking form */}
        <div className="rounded-sm border border-border/60 bg-card/30 p-6 sm:p-10">
          <BookingForm />
        </div>
      </div>
    </div>
  );
}
