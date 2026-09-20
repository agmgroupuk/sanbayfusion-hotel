"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Translates its children vertically as the element passes through the viewport.
 * `speed` > 0 drifts slower than scroll (recedes); negative leads the scroll.
 */
export function Parallax({
  children,
  className,
  speed = 0.3,
}: {
  children: React.ReactNode;
  className?: string;
  speed?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const distance = speed * 140;
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);

  return (
    <div ref={ref} className={cn(className)}>
      <motion.div style={reduce ? undefined : { y }} className="relative h-full w-full">
        {children}
      </motion.div>
    </div>
  );
}
