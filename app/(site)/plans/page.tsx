import type { Metadata } from "next";
import { PageHeader } from "@/components/site/page-header";
import { PlanCard } from "@/components/membership/plan-card";
import { membershipPlans, membershipValueProps } from "@/lib/membership-plans";
import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Membership Plans",
  description: "Choose a recurring Sanbay Fusion food delivery membership in Thailand.",
  alternates: { canonical: "/plans" },
};

export default function PlansPage() {
  return (
    <div className="pb-28">
      <PageHeader eyebrow="Membership plans" title="Food that keeps its promise" lead="Choose a weekly or monthly rhythm, receive scheduled food packages, and let Sanbay Fusion take care of the next meal." />
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          {membershipValueProps.map(([title, description], index) => (
            <Reveal key={title} variant="up" delay={index * 0.06}>
              <article className="border-t border-gold/60 pt-5">
                <h2 className="font-display text-2xl font-light italic">{title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-foreground/70">{description}</p>
              </article>
            </Reveal>
          ))}
        </div>
        <div className="mt-20 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {membershipPlans.map((plan, index) => <Reveal key={plan.slug} variant="up" delay={(index % 3) * 0.05}><PlanCard plan={plan} /></Reveal>)}
        </div>
        <p className="mx-auto mt-10 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground">Planning prices in Thai baht. Final delivery radius, menu contents, taxes, service fees, and available dates are confirmed before payment.</p>
      </div>
    </div>
  );
}