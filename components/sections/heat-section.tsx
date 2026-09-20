import Image from "next/image";
import { ScrollScale } from "@/components/motion/scroll-scale";
import { KineticText } from "@/components/motion/kinetic-text";
import { Reveal } from "@/components/motion/reveal";

/** Beat 2 — Heat. Full-bleed, sharp scale-on-scroll. Dramatic. */
export function HeatSection() {
  return (
    <section className="relative h-[100svh] min-h-[560px] w-full">
      <ScrollScale className="absolute inset-0 h-full w-full" range={[1.28, 1]}>
        <Image
          src="/images/fire-from-wok.jpg"
          alt="Flames leaping from a wok in the Sanbay Fusion kitchen"
          fill
          sizes="100vw"
          className="object-cover"
        />
      </ScrollScale>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/92 via-background/45 to-background/55" />

      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-center px-5 sm:px-8">
        <Reveal variant="fade" className="text-eyebrow text-gold">
          The Kitchen
        </Reveal>
        <KineticText
          as="h2"
          text={"Born\nof Fire"}
          className="text-display mt-4 max-w-[14ch] font-display font-light"
        />
        <Reveal variant="up" delay={0.15} className="measure mt-6">
          <p className="lead text-foreground/85">
            Every service begins with flame. Live fire is the heartbeat of our
            kitchen — searing, smoking, and coaxing character from each ingredient
            at the precise moment it is ready.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
