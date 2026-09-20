"use client";

import { useRef, useSyncExternalStore } from "react";
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
import { site } from "@/lib/site";

const POSTER = "/images/fancy-salmon-dish-with-wine-glasses-in-background.jpg";
const EASE = [0.16, 1, 0.3, 1] as const;

/** Narrowing for the non-standard, partially-supported Network Information API. */
type NetworkInformation = {
  saveData?: boolean;
  effectiveType?: string;
};

const DESKTOP_QUERY = "(min-width: 768px)";

/**
 * True only when the hero video is worth its ~7 MB: a roomy screen on a
 * connection that isn't metered or slow. Reads browser state via
 * useSyncExternalStore so SSR renders the poster (server snapshot = false) and
 * the value re-evaluates when the viewport crosses the breakpoint.
 */
function useHeavyMediaAllowed(enabled: boolean): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (!enabled || typeof window === "undefined") return () => {};
      const mq = window.matchMedia(DESKTOP_QUERY);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => {
      if (!enabled) return false;
      const connection = (
        navigator as Navigator & { connection?: NetworkInformation }
      ).connection;
      const saveData = connection?.saveData === true;
      const slow =
        connection?.effectiveType === "2g" ||
        connection?.effectiveType === "slow-2g";
      return window.matchMedia(DESKTOP_QUERY).matches && !saveData && !slow;
    },
    () => false,
  );
}

export function HomeHero() {
  const reduce = useReducedMotion();
  // Default to the poster (what SSR renders) and upgrade to video only on
  // capable clients, so mobile / metered loads never pay for the download.
  const showVideo = useHeavyMediaAllowed(!reduce);

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
    <section ref={ref} className="relative h-[100svh] min-h-[640px] w-full overflow-hidden">
      <motion.div
        style={reduce ? undefined : { y: mediaY, scale: mediaScale }}
        className="absolute inset-0 will-change-transform"
      >
        {!showVideo ? (
          <Image src={POSTER} alt="" fill priority sizes="100vw" className="object-cover" />
        ) : (
          <video
            className="absolute inset-0 h-full w-full object-cover"
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

      <div className="absolute inset-0 overlay-cinematic" />

      <motion.div
        style={reduce ? undefined : { y: contentY, opacity: contentOpacity }}
        className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-5 pb-24 sm:px-8 sm:pb-32"
      >
        <motion.p
          initial={{ y: 12 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.2 }}
          className="text-eyebrow text-gold"
        >
          Michelin-Starred · Paris
        </motion.p>

        <KineticText
          as="h1"
          text={site.name}
          delay={0.35}
          stagger={0.12}
          className="text-display mt-5 font-display font-light"
        />

        <motion.p
          initial={{ y: 16 }}
          animate={{ y: 0 }}
          transition={{ duration: 1, ease: EASE, delay: 0.9 }}
          className="lead measure mt-7 text-foreground/90"
        >
          {site.tagline} — a theatrical tasting menu built on fire, precision,
          and the finest seasonal produce.
        </motion.p>

        <motion.div
          initial={{ y: 16 }}
          animate={{ y: 0 }}
          transition={{ duration: 1, ease: EASE, delay: 1.05 }}
          className="mt-10 flex flex-wrap items-center gap-4"
        >
          <Magnetic strength={0.3}>
            <Link
              href="/reservations"
              className="inline-flex items-center justify-center rounded-full bg-gold px-8 py-3.5 text-eyebrow text-gold-foreground"
            >
              Reserve a Table
            </Link>
          </Magnetic>
          <Magnetic strength={0.3}>
            <Link
              href="/menu"
              className="inline-flex items-center justify-center rounded-full border border-foreground/40 px-8 py-3.5 text-eyebrow text-foreground transition-colors hover:border-foreground/80"
            >
              View the Menu
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
