"use client";

// OwnState — Earth hero, page integration (Brick 14)
// Owns the tall scroll container, the sticky canvas, and the timed text beats.
// Falls back to a static hero when prefers-reduced-motion is set. The R3F canvas
// is dynamically imported (ssr:false) so three never touches the server.

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { ArrowRight, ChevronDown, Globe2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { HeroSearch } from "@/components/home/HeroSearch";
import { useScrollProgress } from "./useScrollProgress";

const EarthHero = dynamic(() => import("./EarthHero"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#05060a]" />,
});

const DEAL_PILLS = ["Buy", "Sell", "Rent", "Lease"];

function Beat({
  progress,
  range,
  hold = false,
  className,
  children,
}: {
  progress: MotionValue<number>;
  range: [number, number];
  hold?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const [s, e] = range;
  const opacity = useTransform(
    progress,
    hold ? [s, s + 0.04, 1, 1] : [s, s + 0.04, e - 0.04, e],
    [0, 1, 1, hold ? 1 : 0]
  );
  const y = useTransform(progress, [s, e], [24, -24]);
  return (
    <motion.div
      style={{ opacity, y }}
      className={cn(
        "pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

export function EarthHeroSection() {
  const targetRef = useRef<HTMLDivElement>(null);
  const progress = useScrollProgress(targetRef);

  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [active, setActive] = useState(true);

  useEffect(() => {
    setMounted(true);
    setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // Pause the render loop when the hero is off-screen.
  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { rootMargin: "0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // ---- reduced motion: static hero, all text shown -------------------------
  if (mounted && reduced) {
    return (
      <section className="bg-space-radial text-brand-light">
        <div className="container-page flex min-h-[88vh] flex-col items-center justify-center py-24 text-center">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-brand-pale">
            <Globe2 className="size-3.5 text-brand-accent" />
            Buy, sell, rent &amp; fence any property on the planet
          </span>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Own Anything. Anywhere.{" "}
            <span className="text-gradient-brand">On Earth.</span>
          </h1>
          <p className="mt-5 max-w-xl text-brand-pale sm:text-lg">
            From a village plot to a mansion or a private island — fence your
            land digitally and close the deal online.
          </p>
          <div className="mt-9 flex w-full justify-center">
            <HeroSearch />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={targetRef}
      className="relative h-[250vh] bg-[#05060a] lg:h-[350vh]"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* 3D canvas */}
        <div className="absolute inset-0">
          {mounted && (
            <EarthHero
              progress={progress}
              reducedMotion={false}
              isMobile={isMobile}
              active={active}
            />
          )}
        </div>

        {/* legibility vignette */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(5,6,10,0.7)_100%)]" />

        {/* ---- text beats ---- */}
        <Beat progress={progress} range={[0, 0.12]}>
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-brand-pale backdrop-blur">
            <Globe2 className="size-3.5 text-brand-accent" /> OwnState
          </span>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Own Anything. Anywhere.{" "}
            <span className="text-gradient-brand">On Earth.</span>
          </h1>
        </Beat>

        <Beat progress={progress} range={[0.12, 0.28]}>
          <p className="max-w-2xl text-2xl font-medium text-brand-pale sm:text-3xl">
            Buy, sell, rent &amp; fence any property on the planet.
          </p>
        </Beat>

        <Beat progress={progress} range={[0.3, 0.46]}>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {DEAL_PILLS.map((p) => (
              <span
                key={p}
                className="rounded-full border border-white/20 bg-white/10 px-6 py-2.5 text-lg font-medium text-white backdrop-blur"
              >
                {p}
              </span>
            ))}
          </div>
        </Beat>

        <Beat progress={progress} range={[0.5, 0.64]}>
          <p className="text-sm uppercase tracking-[0.3em] text-brand-accent">
            Live market rates
          </p>
          <p className="mt-3 max-w-xl text-xl text-brand-pale">
            Transparent prices, verified listings, real geography.
          </p>
        </Beat>

        <Beat progress={progress} range={[0.66, 0.82]}>
          <p className="max-w-2xl text-2xl font-medium text-white sm:text-3xl">
            Fence your land digitally.
          </p>
          <p className="mt-3 max-w-md text-brand-pale">
            Trace the boundary on satellite imagery — saved precisely with PostGIS.
          </p>
        </Beat>

        <Beat progress={progress} range={[0.9, 1]} hold className="justify-end pb-[18vh] lg:justify-center lg:pb-0">
          <div className="pointer-events-auto flex w-full flex-col items-center gap-5">
            <h2 className="text-2xl font-semibold text-white sm:text-3xl">
              Start exploring
            </h2>
            <HeroSearch />
            <Button
              size="lg"
              render={<Link href="/search" />}
              className="bg-brand-teal text-white hover:bg-brand"
            >
              Browse all properties <ArrowRight />
            </Button>
          </div>
        </Beat>

        {/* scroll cue */}
        <motion.div
          style={{ opacity: useTransform(progress, [0, 0.08], [1, 0]) }}
          className="pointer-events-none absolute inset-x-0 bottom-6 flex flex-col items-center gap-1 text-brand-pale"
        >
          <span className="text-xs">Scroll to explore</span>
          <ChevronDown className="size-4 animate-bounce" />
        </motion.div>
      </div>
    </section>
  );
}
