"use client";

// OwnState — scroll progress for the Earth hero (Brick 14)
// framer-motion useScroll over the tall hero container, spring-smoothed so the
// camera and overlays move with weight. Returns a MotionValue 0..1 that R3F
// reads with `.get()` inside useFrame (no React re-renders).

import {
  useScroll,
  useSpring,
  type MotionValue,
  useMotionValueEvent,
} from "framer-motion";
import { useState, type RefObject } from "react";

interface ScrollProgressResult {
  progress: MotionValue<number>;
  isScrolling: boolean;
}

export function useScrollProgress(
  ref: RefObject<HTMLElement | null>
): ScrollProgressResult {
  const [isScrolling, setIsScrolling] = useState(false);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  // Detect when scrolling starts and stops
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest > 0 && latest < 1) {
      setIsScrolling(true);
    }
  });

  useMotionValueEvent(scrollYProgress, "animationComplete", () => {
    setIsScrolling(false);
  });

  const progress = useSpring(scrollYProgress, {
    stiffness: 70,
    damping: 28,
    mass: 0.6,
    restDelta: 0.001,
  });

  return { progress, isScrolling };
}
