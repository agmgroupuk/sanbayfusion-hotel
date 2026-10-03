import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { site } from "@/lib/site";
import { HeroVisual } from "@/components/home/HeroVisual";

const actionClass =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden border-b border-border/60">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_72%_35%,oklch(0.34_0.04_78_/_0.2),transparent_48%),linear-gradient(135deg,transparent_45%,oklch(1_0_0_/_0.025))]"
      />
      <div className="mx-auto grid min-h-[calc(100svh-4rem)] w-full max-w-7xl items-center gap-8 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-4 lg:px-12">
        <div className="relative z-10 max-w-2xl">
          <p className="text-eyebrow text-gold">{site.name} · Digital technology</p>
          <h1 className="mt-6 font-display text-h1 font-light">
            AI, software, and digital experiences.
          </h1>
          <p className="lead mt-7 max-w-xl text-foreground/75">
            We create AI-powered products, software applications, digital tools,
            and experiments for a connected digital world.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/apps"
              className={`${actionClass} bg-gold text-gold-foreground shadow-lg shadow-gold/10 hover:-translate-y-0.5 hover:bg-gold/90`}
            >
              Explore the platform
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link
              href="/agents"
              className={`${actionClass} border border-gold/35 text-gold hover:border-gold/70 hover:bg-gold/5`}
            >
              Meet the agents
            </Link>
          </div>
        </div>
        <HeroVisual />
      </div>
    </section>
  );
}
