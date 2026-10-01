"use client";
import { useHydratedReducedMotion } from "@/components/motion/use-hydrated-reduced-motion";

import { motion, useScroll, useSpring } from "motion/react";

/** A thin gold progress line at the very top, tracking scroll through the page. */
export function ScrollProgress() {
  const reduce = useHydratedReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.3,
  });

  if (reduce) return null;

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-gradient-to-r from-gold/60 via-gold to-gold/60"
    />
  );
}
