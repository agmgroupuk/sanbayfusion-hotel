import type { Metadata } from "next";
import { PageHeader } from "@/components/site/page-header";
import { PlanCard } from "@/components/membership/plan-card";
import { alcoholSalesEnabled, membershipPlans, membershipValueProps } from "@/lib/membership-plans";
import { packageCategoryLabels } from "@/lib/membership-plans";
import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Membership Plans",
  description: "Choose a recurring Sanbay Fusion food delivery membership in Thailand.",
  alternates: { canonical: "/plans" },
};

export default function PlansPage() {
  return (
    <div className="pb-28">
          <PageHeader eyebrow="Membership plans" title="One year of better food" lead="Choose a fixed annual membership, receive scheduled deliveries throughout your 12-month validity period, and let Sanbay Fusion take care of the next meal." />
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
        {(["food-only", "food-drinks", "family", "executive", "corporate"] as const).map((category) => {
          const plans = membershipPlans.filter((plan) => plan.category === category);
          return <section key={category} className="mt-20"><p className="text-eyebrow text-gold">{packageCategoryLabels[category]}</p><h2 className="mt-4 font-display text-3xl font-light italic">{category === "food-only" ? "Budget to luxury food programmes" : category === "food-drinks" ? "Food plus drinks where permitted" : category === "family" ? "Shared meals for the household" : category === "executive" ? "Premium and priority delivery" : "Custom business programmes"}</h2><div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">{plans.map((plan, index) => <Reveal key={plan.slug} variant="up" delay={(index % 3) * 0.05}><PlanCard plan={plan} /></Reveal>)}</div></section>;
        })}
        <p className="mx-auto mt-10 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground">Annual membership fees and initial prices in Thai baht. Every membership is valid for 12 months from activation. The customer chooses a fixed package, not individual products. Alcohol packages are currently {alcoholSalesEnabled ? "enabled subject to verification" : "disabled pending compliance verification"}.</p>
      </div>
    </div>
  );
}