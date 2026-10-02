import Image from "next/image";
import { MaskWipe } from "@/components/motion/mask-wipe";
import { Reveal } from "@/components/motion/reveal";

/** Beat 4 — The Dish. Centered tight close-up, dramatic clip-path wipe. Dramatic. */
export function DishSection() {
  return (
    <section className="bg-background py-24 sm:py-36">
      <div className="mx-auto max-w-4xl px-5 text-center sm:px-8">
        <Reveal variant="fade" className="text-eyebrow text-gold">
          From the kitchen
        </Reveal>

        <MaskWipe
          direction="up"
          className="mx-auto mt-8 aspect-square w-full max-w-xl rounded-sm"
        >
          <Image
            src="/images/scallop.jpg"
            alt="A seared scallop presented on a plate"
            fill
            sizes="(min-width: 768px) 36rem, 100vw"
            className="object-cover"
          />
        </MaskWipe>

        <Reveal variant="up" delay={0.1}>
          <h2 className="mt-10 font-display text-h2 font-light italic">
            Food worth planning for
          </h2>
          <p className="lead mx-auto mt-4 max-w-xl">
            Explore the current catalogue and choose eligible food around
            your preferences. Ingredients and availability are confirmed with the team.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
