import Image from "next/image";
import { Parallax } from "@/components/motion/parallax";
import { Reveal } from "@/components/motion/reveal";

/** Beat 5 — Ambiance. Editorial two-column, soft parallax. Atmospheric. */
export function AmbianceSection() {
  return (
    <section className="overflow-hidden bg-background py-24 sm:py-36">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:gap-16">
        <div className="order-2 lg:order-1 lg:pr-8">
          <Reveal variant="fade" className="text-eyebrow text-gold">
            Your occasion
          </Reveal>
          <Reveal variant="up" delay={0.05}>
            <h2 className="mt-5 font-display text-h2 font-light leading-[1.05]">
              Good food, thoughtful planning, and time together.
            </h2>
          </Reveal>
          <Reveal variant="up" delay={0.1}>
            <p className="lead measure mt-6">
              Planning a gathering? Share your preferred date, venue and guest count
              with the team so we can review the possibilities together.
            </p>
          </Reveal>
          <Reveal variant="up" delay={0.15}>
            <p className="measure mt-4 text-foreground/85">
              Private-event requests guide a tailored proposal. Menus, service,
              availability and pricing are confirmed with you before arrangements are agreed.
            </p>
          </Reveal>
        </div>

        <div className="order-1 lg:order-2">
          <Parallax speed={0.35} className="group aspect-[4/5] w-full overflow-hidden rounded-sm">
            <div className="relative h-[118%] w-full">
              <Image
                src="/images/fire-from-wok.jpg"
                alt="Food prepared in the Sanbay Fusion kitchen"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.06]"
              />
            </div>
          </Parallax>
        </div>
      </div>
    </section>
  );
}
