import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";

/** Editorial introduction to the dishes members can explore and arrange. */
export function DishSection() {
  return (
    <section className="relative overflow-hidden border-t border-gold/10 bg-background py-20 sm:py-24 lg:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:gap-20">
        <Reveal variant="up" className="group relative aspect-[4/3] min-h-64 overflow-hidden sm:aspect-[5/4]">
          <Image
            src="/images/scallop.jpg"
            alt="A seared scallop presented on a plate"
            fill
            sizes="(min-width: 1024px) 54vw, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent" />
          <span className="absolute bottom-4 left-4 border-l border-gold/80 pl-3 text-eyebrow text-foreground/90">
            From our kitchen
          </span>
        </Reveal>

        <div className="lg:py-8">
          <Reveal variant="fade" className="text-eyebrow text-gold">
            From the Kitchen
          </Reveal>
          <Reveal variant="up" delay={0.05}>
            <h2 className="mt-5 max-w-[12ch] font-display text-[clamp(2.7rem,4.8vw,4.6rem)] font-light leading-[1.02] tracking-[-0.04em]">
              Dining prepared around your stay.
            </h2>
          </Reveal>
          <Reveal variant="up" delay={0.1}>
            <p className="lead measure mt-6 max-w-xl">
              Explore available dishes and arrange eligible meals around your selected service dates. Our team confirms menu and availability details with you.
            </p>
          </Reveal>
          <Reveal variant="up" delay={0.15}>
            <Link
              href="/catalogue"
              className="mt-8 inline-flex min-h-12 items-center gap-3 border-b border-gold/55 pb-2 text-eyebrow text-gold transition-colors hover:border-gold hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-4 focus-visible:ring-offset-background"
            >
              Explore the Menu
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
