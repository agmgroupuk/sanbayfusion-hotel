import Link from "next/link";
import { ArrowRight, MessageSquareText } from "lucide-react";

export function FinalCTASection() {
  return (
    <section
      aria-labelledby="final-cta-heading"
      className="px-5 pb-16 sm:px-8 sm:pb-20 lg:px-12"
    >
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl border border-gold/25 bg-card/70 px-6 py-10 shadow-2xl shadow-black/20 sm:px-10 sm:py-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-32 size-80 rounded-full bg-gold/10 blur-3xl"
        />
        <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="text-eyebrow text-gold">Explore Sanbay Fusion</p>
            <h2
              id="final-cta-heading"
              className="mt-4 font-display text-h2 font-light"
            >
              Find your next place to start.
            </h2>
            <p className="mt-4 max-w-xl text-muted-foreground">
              Explore the apps, try an agent, or open the shared live chat.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/apps"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-gold-foreground transition hover:-translate-y-0.5 hover:bg-gold/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              Explore apps
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
            <Link
              href="/agents/tech-wizard"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-gold/40 px-5 py-2.5 text-sm font-medium text-gold transition hover:bg-gold/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <MessageSquareText size={15} aria-hidden="true" />
              Try live chat
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
