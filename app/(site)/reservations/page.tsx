import type { Metadata } from "next";
import Image from "next/image";
import { BookingForm } from "@/components/reservations/booking-form";
import { Reveal } from "@/components/motion/reveal";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Schedule a Meeting",
  description: "Schedule a meeting with the Sanbay Fusion team for memberships, events, catering, partnerships, and private gathering enquiries.",
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
            Schedule a meeting
          </Reveal>
          <Reveal variant="up" delay={0.05}>
            <h1 className="mt-5 font-display text-h1 font-light">Meet with the Sanbay Fusion team</h1>
          </Reveal>
          <Reveal variant="up" delay={0.1}>
            <p className="lead measure mt-5">
              Choose a purpose, select an available meeting date and time, and tell us what you would like to discuss. We&apos;ll review your request and contact you directly to confirm the conversation.
            </p>
          </Reveal>

          <Reveal variant="scale" delay={0.1} className="mt-10 hidden overflow-hidden rounded-sm lg:block">
            <div className="relative aspect-[5/4] w-full">
              <Image
                src="/images/nicely-plated-food-served-at-decorated-table.jpg"
                alt="A prepared Sanbay Fusion table and dining setting"
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
              Need help choosing a meeting time?{" "}
              <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="text-gold hover:text-gold/80">
                Contact us directly
              </a>
              .
            </p>
          </Reveal>
        </aside>

        {/* Meeting scheduling form — retains the existing calendar and availability logic. */}
        <div className="rounded-sm border border-border/60 bg-card/30 p-6 sm:p-10">
          <BookingForm />
        </div>
      </div>
    </div>
  );
}
