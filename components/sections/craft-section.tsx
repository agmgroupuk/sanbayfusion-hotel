import Image from "next/image";
import { KenBurns } from "@/components/motion/ken-burns";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";

/** Beat 3 — Craft. Split layout, slow Ken Burns pan, line-by-line copy. Atmospheric. */
export function CraftSection() {
  return (
    <section className="bg-background py-24 sm:py-36">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
        <KenBurns className="aspect-[4/5] w-full rounded-sm">
          <Image
            src="/images/chef-preparing-the-plates.jpg"
            alt="The chef plating a dish with precise, deliberate hands"
            fill
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="object-cover"
          />
        </KenBurns>

        <div className="lg:pl-4">
          <Reveal variant="fade" className="text-eyebrow text-gold">
            The Craft
          </Reveal>
          <RevealGroup className="mt-5" stagger={0.14}>
            <RevealItem variant="blur">
              <h2 className="font-display text-h2 font-light leading-[1.05]">
                Precision is a form of generosity.
              </h2>
            </RevealItem>
            <RevealItem variant="up">
              <p className="lead measure mt-6">
                Good food begins with understanding your preferences, planning
                the details and giving the kitchen time to prepare.
              </p>
            </RevealItem>
            <RevealItem variant="up">
              <p className="measure mt-4 text-foreground/85">
                Tell us about dietary needs before ordering. The team will review
                availability and confirm whether your requirements can be accommodated.
              </p>
            </RevealItem>
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}
