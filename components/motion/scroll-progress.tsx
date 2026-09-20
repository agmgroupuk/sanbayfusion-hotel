"use client";

import { motion, useScroll, useSpring, useReducedMotion } from "motion/react";

/** A thin gold progress line at the very top, tracking scroll through the page. */
export function ScrollProgress() {
  const reduce = useReducedMotion();
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
