"use client";

// OwnState — scroll progress for the Earth hero (Brick 14)
// framer-motion useScroll over the tall hero container, spring-smoothed so the
// camera and overlays move with weight. Returns a MotionValue 0..1 that R3F
// reads with `.get()` inside useFrame (no React re-renders).

import { useScroll, useSpring, type MotionValue } from "framer-motion";
import type { RefObject } from "react";

export function useScrollProgress(
  ref: RefObject<HTMLElement | null>
): MotionValue<number> {
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  return useSpring(scrollYProgress, {
    stiffness: 70,
    damping: 28,
    mass: 0.6,
  });
}
