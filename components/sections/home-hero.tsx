"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { KineticText } from "@/components/motion/kinetic-text";
import { Magnetic } from "@/components/motion/magnetic";

const POSTER = "/images/fancy-salmon-dish-with-wine-glasses-in-background.jpg";
const EASE = [0.16, 1, 0.3, 1] as const;

export function HomeHero() {
  const reduce = useReducedMotion();

  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  // Content drifts up and fades; media drifts down — classic depth parallax.
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -140]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const mediaY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const mediaScale = useTransform(scrollYProgress, [0, 1], [1, 1.18]);

  return (
    <section ref={ref} className="relative min-h-[100svh] w-full overflow-hidden">
      <motion.div
        style={reduce ? undefined : { y: mediaY, scale: mediaScale }}
        className="absolute inset-0 will-change-transform"
      >
        {reduce ? (
          <Image src={POSTER} alt="" fill priority sizes="100vw" className="object-cover" />
        ) : (
          <video
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover object-[center_58%] sm:object-center"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={POSTER}
          >
            <source src="/videos/client-eating-at-restaurant.mp4" type="video/mp4" />
          </video>
        )}
      </motion.div>

      <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/75 to-background/35" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/75 via-transparent to-background/45" />

      <motion.div
        style={reduce ? undefined : { y: contentY, opacity: contentOpacity }}
        className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-center px-5 pb-14 pt-24 sm:px-8 sm:pb-12 sm:pt-32"
      >
        <motion.p
          initial={{ y: 12 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.2 }}
          className="text-eyebrow text-gold"
        >
          Private hospitality in Thailand
        </motion.p>

        <KineticText
          as="h1"
          text={"Visit.\nYour Meals.\nPlanned Ahead."}
          delay={0.35}
          stagger={0.12}
          className="mt-5 max-w-5xl font-display text-[clamp(3rem,5.5vw,6rem)] font-light leading-[0.96] tracking-[-0.045em] sm:mt-6 sm:text-[clamp(3.5rem,6.2vw,6rem)]"
        />

        <motion.p
          initial={{ y: 16 }}
          animate={{ y: 0 }}
          transition={{ duration: 1, ease: EASE, delay: 0.9 }}
          className="measure mt-5 max-w-[62ch] text-base leading-relaxed text-foreground/90 sm:mt-6 sm:text-lg sm:leading-relaxed"
        >
          Membership dining designed for eligible international visitors staying temporarily in Thailand. Plan selected service months and meals before travelling or during your stay.
        </motion.p>

        <motion.div
          initial={{ y: 16 }}
          animate={{ y: 0 }}
          transition={{ duration: 1, ease: EASE, delay: 1.05 }}
          className="mt-5 max-w-[62ch] border-l border-gold/60 pl-4 text-sm leading-relaxed text-foreground/75 sm:mt-6 sm:pl-5"
        >
          Available to eligible international visitors who normally reside outside Thailand. Membership applications are reviewed before activation.
        </motion.div>

        <motion.div
          initial={{ y: 16 }}
          animate={{ y: 0 }}
          transition={{ duration: 1, ease: EASE, delay: 1.15 }}
          className="mt-7 flex flex-col items-stretch gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4"
        >
          <Magnetic strength={0.3}>
            <Link
              href="/join"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-7 py-3 text-center text-eyebrow text-gold-foreground transition-colors hover:bg-gold/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-8"
            >
              Become a Member
            </Link>
          </Magnetic>
          <Magnetic strength={0.3}>
            <Link
              href="/catalogue"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-gold/45 bg-background/20 px-7 py-3 text-center text-eyebrow text-foreground transition-colors hover:border-gold hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-8"
            >
              Explore Menu & Catalogue
            </Link>
          </Magnetic>
        </motion.div>
      </motion.div>

      {!reduce && (
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 1 }}
          className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 sm:block"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="text-eyebrow text-foreground/70"
          >
            Scroll
          </motion.div>
        </motion.div>
      )}
    </section>
  );
}
