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
            The Room
          </Reveal>
          <Reveal variant="up" delay={0.05}>
            <h2 className="mt-5 font-display text-h2 font-light leading-[1.05]">
              Candlelight, low murmurs, and time that slows down.
            </h2>
          </Reveal>
          <Reveal variant="up" delay={0.1}>
            <p className="lead measure mt-6">
              Forty seats. One seating. The room is dressed in shadow and warm
              brass, designed so the food — and the company — take centre stage.
            </p>
          </Reveal>
          <Reveal variant="up" delay={0.15}>
            <p className="measure mt-4 text-foreground/85">
              An optional wine pairing traces the menu course by course, drawn
              from a cellar of small, characterful growers.
            </p>
          </Reveal>
        </div>

        <div className="order-1 lg:order-2">
          <Parallax speed={0.35} className="group aspect-[4/5] w-full overflow-hidden rounded-sm">
            <div className="relative h-[118%] w-full">
              <Image
                src="/images/fancy-salmon-dish-with-wine-glasses-in-background.jpg"
                alt="A plated dish with wine glasses glowing in the candlelit dining room"
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
