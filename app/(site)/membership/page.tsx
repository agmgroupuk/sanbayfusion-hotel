import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Crown, Sparkles, Users, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/site/page-header";
import { Reveal } from "@/components/motion/reveal";
import { PlanCard } from "@/components/membership/plan-card";
import { membershipPlans } from "@/lib/membership-plans";

export const metadata: Metadata = {
  title: "Membership",
  description:
    "Choose a Sanbay Fusion food delivery membership with scheduled seasonal meals, drinks, and products in Thailand.",
  alternates: {
    canonical: "/membership",
  },
};

const membershipHighlights = [
  {
    title: "Priority reservations",
    description: "Members receive scheduled food packages on a predictable weekly or monthly rhythm.",
    icon: Crown,
  },
  {
    title: "Members’ tables",
    description: "Choose delivery dates and package sizes that fit your household, team, or routine.",
    icon: Users,
  },
  {
    title: "Private rooms & lounges",
    description: "Seasonal meals, snacks, drinks, pantry products, and add-ons move with the market.",
    icon: Sparkles,
  },
  {
    title: "Discreet, elevated service",
    description: "Pause, adjust, or request support before the next recurring delivery cycle begins.",
    icon: ShieldCheck,
  },
];

export default function MembershipPage() {
  return (
    <div className="pb-28">
      <PageHeader
        eyebrow="Membership"
        title="Food that keeps its promise"
        lead="Sanbay Fusion membership turns seasonal cooking into a dependable delivery rhythm for households, teams, and returning guests."
      />

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {membershipHighlights.map(({ title, description, icon: Icon }, index) => (
            <Reveal key={title} variant="up" delay={0.06 * index}>
              <article className="h-full rounded-sm border border-border/60 bg-card/40 p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/40 bg-gold/5 text-gold">
                  <Icon className="size-5" />
                </div>
                <h2 className="mt-6 font-display text-3xl font-light italic text-foreground">
                  {title}
                </h2>
                <p className="mt-4 text-base leading-relaxed text-foreground/75">
                  {description}
                </p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal variant="up" className="mt-20">
          <p className="text-eyebrow text-gold">Choose your rhythm</p>
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {membershipPlans.map((plan) => <PlanCard key={plan.slug} plan={plan} />)}
          </div>
        </Reveal>

        <Reveal variant="fade" className="mt-20 text-center">
          <p className="lead mx-auto max-w-2xl text-foreground/80">
            Membership is about continuity: better food at home, clear delivery days, and a kitchen you can return to without starting from zero each time.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/join"
              className="inline-flex items-center justify-center rounded-full bg-gold px-7 py-3 text-eyebrow text-gold-foreground transition-transform hover:-translate-y-0.5"
            >
              Become a Member
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center justify-center rounded-full border border-foreground/30 px-7 py-3 text-eyebrow text-foreground transition-colors hover:border-foreground/70"
            >
              How It Works
            </Link>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
