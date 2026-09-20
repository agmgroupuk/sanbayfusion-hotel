"use client";

import { motion, type Variants } from "motion/react";
import { cn } from "@/lib/utils";

type RevealVariant = "up" | "fade" | "blur" | "scale" | "rise";

const EASE = [0.16, 1, 0.3, 1] as const; // expo-out: confident, cinematic

const variantMap: Record<RevealVariant, Variants> = {
  up: {
    hidden: { opacity: 0, y: 28 },
    show: { opacity: 1, y: 0 },
  },
  rise: {
    hidden: { opacity: 0, y: 64 },
    show: { opacity: 1, y: 0 },
  },
  fade: {
    hidden: { opacity: 0 },
    show: { opacity: 1 },
  },
  blur: {
    hidden: { opacity: 0, filter: "blur(14px)", y: 18 },
    show: { opacity: 1, filter: "blur(0px)", y: 0 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.94 },
    show: { opacity: 1, scale: 1 },
  },
};

export function Reveal({
  children,
  className,
  variant = "up",
  delay = 0,
  duration = 0.9,
  once = true,
  amount = 0.4,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: RevealVariant;
  delay?: number;
  duration?: number;
  once?: boolean;
  amount?: number;
  as?: keyof typeof motion;
}) {
  const Comp = motion[as] as typeof motion.div;
  return (
    <Comp
      className={cn(className)}
      variants={variantMap[variant]}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
      transition={{ duration, ease: EASE, delay }}
    >
      {children}
    </Comp>
  );
}

/** Staggers direct children into view — pass <Reveal.Item> or any element. */
export function RevealGroup({
  children,
  className,
  stagger = 0.12,
  delayChildren = 0,
  once = true,
  amount = 0.3,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  delayChildren?: number;
  once?: boolean;
  amount?: number;
}) {
  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className,
  variant = "up",
  duration = 0.8,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: RevealVariant;
  duration?: number;
  as?: keyof typeof motion;
}) {
  const Comp = motion[as] as typeof motion.div;
  return (
    <Comp
      className={cn(className)}
      variants={variantMap[variant]}
      transition={{ duration, ease: EASE }}
    >
      {children}
    </Comp>
  );
}
