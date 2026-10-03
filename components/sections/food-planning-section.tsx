import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";

const planningSteps = [
  {
    number: "01",
    title: "Plan ahead",
    description: "Choose the service months that fit your stay.",
  },
  {
    number: "02",
    title: "Select meals",
    description: "Explore available dishes and arrange eligible meals.",
  },
  {
    number: "03",
    title: "Choose a date",
    description: "Schedule an eligible service date in advance.",
  },
  {
    number: "04",
    title: "Enjoy your stay",
    description: "Receive your arranged order during your visit.",
  },
];

export function FoodPlanningSection() {
  return (
    <section className="border-y border-border/60 bg-card/25 py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <Reveal variant="fade" className="text-eyebrow text-gold">
              Food Worth Planning
            </Reveal>
            <Reveal variant="up" delay={0.05}>
              <h2 className="mt-5 max-w-[13ch] font-display text-[clamp(2.7rem,4.8vw,4.6rem)] font-light leading-[1.02] tracking-[-0.04em]">
                Arrive with the details already arranged.
              </h2>
            </Reveal>
            <Reveal variant="up" delay={0.1}>
              <p className="lead measure mt-6 max-w-xl">
                Plan selected meals around your stay, choose an eligible service date in advance, and manage your membership dining through your Sanbay Fusion account.
              </p>
            </Reveal>
            <Reveal variant="up" delay={0.15}>
              <Link
                href="/how-it-works"
                className="mt-7 inline-flex min-h-12 items-center gap-3 rounded-full border border-gold/55 px-6 py-3 text-eyebrow text-gold transition-colors hover:bg-gold hover:text-gold-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                How It Works
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Reveal>
          </div>

          <Reveal variant="up" className="group relative aspect-[5/4] overflow-hidden sm:aspect-[16/10] lg:aspect-[5/4]">
            <Image
              src="/images/chef-preparing-the-plates.jpg"
              alt="A chef carefully preparing plated dishes"
              fill
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/75 via-background/5 to-transparent" />
            <p className="absolute bottom-4 left-4 text-eyebrow text-foreground/90">
              Considered, from kitchen to table
            </p>
          </Reveal>
        </div>

        <ol className="mt-12 grid gap-y-7 border-t border-gold/25 pt-7 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
          {planningSteps.map((step, index) => (
            <li
              key={step.number}
              className={`pr-4 ${index > 0 ? "lg:border-l lg:border-border/60 lg:pl-6" : ""}`}
            >
              <Reveal variant="up" delay={0.04 * index}>
                <span className="text-eyebrow text-gold/80">{step.number}</span>
                <h3 className="mt-3 font-display text-2xl font-light text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-foreground/70">
                  {step.description}
                </p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
