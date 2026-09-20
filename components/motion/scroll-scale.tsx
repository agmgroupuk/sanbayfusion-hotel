"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Sharp scale-on-scroll: media zooms as it crosses the viewport. Use for the
 * high-energy "dramatic" beats. `range` is [enter, exit] scale.
 */
export function ScrollScale({
  children,
  className,
  range = [1.25, 1],
}: {
  children: React.ReactNode;
  className?: string;
  range?: [number, number];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 0.5], range);

  return (
    <div ref={ref} className={cn("overflow-hidden", className)}>
      <motion.div
        style={reduce ? undefined : { scale }}
        className="relative h-full w-full will-change-transform"
      >
        {children}
      </motion.div>
    </div>
  );
}
