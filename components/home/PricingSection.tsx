import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { pricingContent } from "@/components/home/pricing-content";

export function PricingSection() {
  return (
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
      className="border-y border-border/60 bg-card/20 py-16 sm:py-20"
    >
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
        <p className="text-eyebrow text-gold">Pricing</p>
        <div className="mt-5 grid items-end gap-8 lg:grid-cols-[1fr_0.8fr]">
          <div className="max-w-3xl">
            <h2
              id="pricing-heading"
              className="font-display text-h2 font-light"
            >
              {pricingContent.heading}
            </h2>
            <p className="mt-5 max-w-2xl text-muted-foreground">
              {pricingContent.description}
            </p>
          </div>
          <div className="rounded-2xl border border-gold/25 bg-background/70 p-5 sm:p-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/5 px-3 py-1.5 text-xs text-gold">
              <Sparkles size={14} aria-hidden="true" />
              {pricingContent.status}
            </span>
            <p className="mt-4 text-sm text-muted-foreground">
              Plan names, prices, and access details will be added after they
              are confirmed.
            </p>
            <Link
              href={pricingContent.actionHref}
              className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-gold transition-colors hover:text-gold/75"
            >
              {pricingContent.actionLabel}
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
