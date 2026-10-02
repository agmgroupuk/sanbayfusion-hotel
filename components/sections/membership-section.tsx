import Link from "next/link";
import { ArrowRight, Crown, Sparkles, Users, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";

const membershipBenefits = [
  {
    title: "Your selected months",
    description: "Choose 1 to 12 eligible service months in one calendar year. Your months can be non-consecutive.",
    icon: Crown,
  },
  {
    title: "Included Standard Meal",
    description: "One eligible food order per selected month, up to your plan allowance. Schedule now or later; pay any excess separately.",
    icon: Users,
  },
  {
    title: "Optional prepaid packages",
    description: "Choose membership only or add eligible monthly product quantities before submitting your application.",
    icon: Sparkles,
  },
  {
    title: "One Account Center",
    description: "Manage your details, addresses, verified cards, applications, meal schedules and orders together.",
    icon: ShieldCheck,
  },
];

export function MembershipSection() {
  return (
    <section className="border-t border-border/60 bg-card/30 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal variant="fade" className="text-eyebrow text-gold">
          Membership
        </Reveal>

        <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <Reveal variant="up" className="max-w-2xl">
              <h2 className="font-display text-h2 font-light leading-none text-foreground">
                Food that arrives on your rhythm.
            </h2>
          </Reveal>

          <Reveal variant="up" delay={0.1}>
            <Link
              href="/plans"
              className="inline-flex items-center gap-2 rounded-full border border-gold/60 px-6 py-3 text-eyebrow text-gold transition-colors hover:bg-gold hover:text-gold-foreground"
            >
              View Membership Plans
              <ArrowRight className="size-4" />
            </Link>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {membershipBenefits.map(({ title, description, icon: Icon }, index) => (
            <Reveal key={title} variant="up" delay={0.06 * index}>
              <article className="group h-full rounded-sm border border-border/60 bg-background/50 p-6 transition-transform duration-300 hover:-translate-y-1 hover:border-gold/40">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/40 bg-gold/5 text-gold">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-6 font-display text-2xl font-light italic text-foreground">
                  {title}
                </h3>
                <p className="mt-4 text-base leading-relaxed text-foreground/75">
                  {description}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
