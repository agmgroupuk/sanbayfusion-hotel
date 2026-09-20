"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Slow, continuous zoom-and-pan over a still image — the atmospheric "breathing"
 * beat. Wrap a full-bleed <Image fill /> (or any media) as the child.
 */
export function KenBurns({
  children,
  className,
  duration = 22,
  from = { scale: 1.06, x: "-1.5%", y: "-1%" },
  to = { scale: 1.18, x: "1.5%", y: "1.5%" },
}: {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  from?: { scale: number; x: string; y: string };
  to?: { scale: number; x: string; y: string };
}) {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <div className={cn("relative overflow-hidden", className)}>{children}</div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <motion.div
        className="absolute inset-0 will-change-transform"
        initial={{ scale: from.scale, x: from.x, y: from.y }}
        animate={{ scale: to.scale, x: to.x, y: to.y }}
        transition={{
          duration,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "reverse",
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
