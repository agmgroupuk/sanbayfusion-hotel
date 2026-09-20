"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Headline that reveals word-by-word from behind a mask. Each word sits in an
 * overflow-hidden box and slides up — a film-title resolve. Splits on spaces;
 * preserves line breaks supplied as "\n".
 */
export function KineticText({
  text,
  className,
  as: Tag = "h2",
  delay = 0,
  stagger = 0.08,
  duration = 0.95,
  once = true,
}: {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  delay?: number;
  stagger?: number;
  duration?: number;
  once?: boolean;
}) {
  const lines = text.split("\n");
  const MotionTag = motion[Tag];

  let wordIndex = 0;

  return (
    <MotionTag
      className={cn(className)}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount: 0.6 }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
      aria-label={text.replace(/\n/g, " ")}
    >
      {lines.map((line, li) => (
        <span key={li} className="block" aria-hidden="true">
          {line.split(" ").map((word) => {
            const k = wordIndex++;
            return (
              <span
                key={k}
                className="inline-block overflow-hidden align-bottom"
                style={{ paddingBottom: "0.12em", marginBottom: "-0.12em" }}
              >
                <motion.span
                  className="inline-block"
                  variants={{
                    hidden: { y: "115%", rotate: 2 },
                    show: { y: "0%", rotate: 0 },
                  }}
                  transition={{ duration, ease: EASE }}
                >
                  {word}
                  {" "}
                </motion.span>
              </span>
            );
          })}
        </span>
      ))}
    </MotionTag>
  );
}
