"use client";
import { useHydratedReducedMotion } from "@/components/motion/use-hydrated-reduced-motion";

import { ReactLenis } from "lenis/react";


/**
 * Lenis-driven smooth scrolling for the whole document. Disabled entirely when
 * the user prefers reduced motion so native scrolling (and a11y) is preserved.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const reduce = useHydratedReducedMotion();

  if (reduce) return <>{children}</>;

  return (
    <ReactLenis
      root
      options={{ lerp: 0.09, duration: 1.1, smoothWheel: true, wheelMultiplier: 1 }}
    >
      {children}
    </ReactLenis>
  );
}
