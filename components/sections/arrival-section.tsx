import Image from "next/image";
import Link from "next/link";
import { KenBurns } from "@/components/motion/ken-burns";
import { Reveal } from "@/components/motion/reveal";
import { site } from "@/lib/site";

/** Beat 7 — Arrival. Slow fade close, location + contact CTA. Atmospheric. */
export function ArrivalSection() {
  return (
    <section className="relative w-full">
      <KenBurns
        className="h-[100svh] min-h-[560px] w-full"
        duration={26}
        from={{ scale: 1.04, x: "0%", y: "0%" }}
        to={{ scale: 1.14, x: "0.5%", y: "-1.5%" }}
      >
        <Image
          src="/images/outdoors-of-the-restaurant.jpg"
          alt="The understated exterior of Sanbay Fusion Bar & Restaurant at dusk"
          fill
          sizes="100vw"
          className="object-cover"
        />
      </KenBurns>

      <div className="absolute inset-0 overlay-soft" />

      <div className="absolute inset-0 z-10 mx-auto flex h-full max-w-7xl flex-col items-center justify-center px-5 text-center sm:px-8">
        <Reveal variant="fade" duration={1.4} className="text-eyebrow text-gold">
          Arrival
        </Reveal>
        <Reveal variant="blur" duration={1.4} delay={0.1}>
          <h2 className="mt-5 font-display text-h1 font-light">
            Find us after dark
          </h2>
        </Reveal>
        <Reveal variant="fade" duration={1.4} delay={0.2}>
          <p className="lead mt-5 max-w-md">
            {site.address.line1}, {site.address.line2}.
          </p>
        </Reveal>
        <Reveal variant="up" duration={1.2} delay={0.3}>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/reservations"
              className="inline-flex items-center justify-center rounded-full bg-gold px-7 py-3 text-eyebrow text-gold-foreground transition-transform hover:-translate-y-0.5"
            >
              Reserve a Table
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-full border border-foreground/30 px-7 py-3 text-eyebrow text-foreground transition-colors hover:border-foreground/70"
            >
              Hours & Location
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
