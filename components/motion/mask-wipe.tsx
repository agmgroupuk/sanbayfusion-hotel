"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type Direction = "left" | "right" | "up" | "down";

const hidden: Record<Direction, string> = {
  left: "inset(0 100% 0 0)",
  right: "inset(0 0 0 100%)",
  up: "inset(100% 0 0 0)",
  down: "inset(0 0 100% 0)",
};

/**
 * Dramatic clip-path wipe: the media is unveiled as a hard edge sweeps across.
 * Pairs a subtle counter-scale so the image settles rather than snaps.
 */
export function MaskWipe({
  children,
  className,
  direction = "up",
  duration = 1.1,
  delay = 0,
  once = true,
}: {
  children: React.ReactNode;
  className?: string;
  direction?: Direction;
  duration?: number;
  delay?: number;
  once?: boolean;
}) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={cn("overflow-hidden", className)}>{children}</div>;
  }

  return (
    <motion.div
      className={cn("overflow-hidden", className)}
      initial={{ clipPath: hidden[direction] }}
      whileInView={{ clipPath: "inset(0 0 0 0)" }}
      viewport={{ once, amount: 0.45 }}
      transition={{ duration, ease: [0.77, 0, 0.175, 1], delay }}
    >
      <motion.div
        initial={{ scale: 1.16 }}
        whileInView={{ scale: 1 }}
        viewport={{ once, amount: 0.45 }}
        transition={{ duration: duration + 0.3, ease: [0.16, 1, 0.3, 1], delay }}
        className="relative h-full w-full"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
