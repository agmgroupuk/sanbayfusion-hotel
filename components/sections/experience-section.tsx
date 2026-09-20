import Image from "next/image";
import Link from "next/link";
import { ScrollScale } from "@/components/motion/scroll-scale";
import { KineticText } from "@/components/motion/kinetic-text";
import { Reveal } from "@/components/motion/reveal";

/** Beat 6 — The Experience. Full-bleed, confident reveal into reservation CTA. Dramatic. */
export function ExperienceSection() {
  return (
    <section className="relative flex min-h-[100svh] w-full items-center justify-center py-32">
      <ScrollScale className="absolute inset-0 h-full w-full" range={[1.2, 1]}>
        <Image
          src="/images/nicely-plated-food-served-at-decorated-table.jpg"
          alt="A beautifully set table mid-service at Sanbay Fusion Bar & Restaurant"
          fill
          sizes="100vw"
          className="object-cover"
        />
      </ScrollScale>
      <div className="absolute inset-0 bg-background/82" />

      <div className="relative z-10 mx-auto max-w-3xl px-5 text-center sm:px-8">
        <Reveal variant="fade" className="text-eyebrow text-gold">
          The Experience
        </Reveal>
        <KineticText
          as="h2"
          text={"An evening,\nnot a meal"}
          className="text-display mt-5 font-display font-light"
        />
        <Reveal variant="up" delay={0.15}>
          <p className="lead mx-auto mt-6 max-w-xl">
            A single tasting menu, served over a slow and deliberate evening.
            Reserve your table and let us take it from there.
          </p>
        </Reveal>
        <Reveal variant="up" delay={0.25}>
          <Link
            href="/reservations"
            className="mt-9 inline-flex items-center justify-center rounded-full bg-gold px-8 py-3.5 text-eyebrow text-gold-foreground transition-transform hover:-translate-y-0.5"
          >
            Reserve a Table
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
