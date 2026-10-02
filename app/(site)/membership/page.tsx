import type { Metadata } from "next";
import { getCurrentAccount } from "@/lib/auth";
import { accountHasOngoingMembership } from "@/lib/membership-access";
export const dynamic = "force-dynamic";
import Link from "next/link";
import { Crown, Sparkles, Users, ShieldCheck } from "lucide-react";
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
    title: "Selected service months",
    description: "Choose 1 to 12 eligible service months; they do not have to be consecutive.",
    icon: Crown,
  },
  {
    title: "Your package choice",
    description: "Select membership only or add monthly prepaid food and beverage quantities.",
    icon: Users,
  },
  {
    title: "Included Standard Meal",
    description: "One Standard Meal allowance in each selected service month, with eligible food and any excess shown at checkout.",
    icon: Sparkles,
  },
  {
    title: "A clear agreement",
    description: "Your paid package quantities and prices are saved for your membership term.",
    icon: ShieldCheck,
  },
];

export default async function MembershipPage() {
  const activeMembership = await accountHasOngoingMembership(await getCurrentAccount());
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
          <p className="text-eyebrow text-gold">Choose your service months</p>
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {membershipPlans.map((plan) => <PlanCard key={plan.slug} plan={plan} activeMembership={activeMembership} />)}
          </div>
        </Reveal>

        <Reveal variant="fade" className="mt-20 text-center">
          <p className="lead mx-auto max-w-2xl text-foreground/80">
            Manage selected months, Standard Meal schedules, eligible orders and payment status from Account Center. Approval and verified payment are required before benefits become available.
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
