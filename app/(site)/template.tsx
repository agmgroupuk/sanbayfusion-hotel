"use client";
import { useHydratedReducedMotion } from "@/components/motion/use-hydrated-reduced-motion";

import { motion } from "motion/react";

/** Soft per-route entrance — fades and lifts page content on navigation. */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useHydratedReducedMotion();
  if (reduce) return <>{children}</>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
