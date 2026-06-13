"use client";

// OwnState — cinematic video hero (Brick 14, video edition)
// SpaceX-style scroll-driven zoom: a pinned full-bleed video background that
// scales 1 -> 1.2 with weighty easeInOutCubic easing as the user scrolls
// through a tall track. A radial + bottom scrim keeps the centred branding
// readable. Self-contained: no props, no R3F.

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, cubicBezier } from "framer-motion";
import { ArrowRight, Globe2 } from "lucide-react";

// easeInOutCubic as a cubic-bezier — the "weighty", deliberate feel.
const easeInOutCubic = cubicBezier(0.65, 0, 0.35, 1);

export default function EarthHero() {
  const targetRef = useRef<HTMLDivElement>(null);

  // Only load the (heavy) hero video when it's actually worth it. We mount it
  // after hydration AND gate it on: a wide enough viewport, no reduced-motion
  // preference, and no Save-Data / 2g connection. On phones, data-saver, or
  // reduced-motion the static dark gradient below stands in — so we never push
  // a multi-megabyte autoplay video over mobile data. (Mounting client-side also
  // avoids a hydration mismatch from video-speed browser extensions.)
  const [showVideo, setShowVideo] = useState(false);
  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const wide = window.matchMedia("(min-width: 768px)").matches;
    const conn = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
      }
    ).connection;
    const cheapData =
      conn?.saveData === true ||
      (conn?.effectiveType ? /2g/.test(conn.effectiveType) : false);
    setShowVideo(wide && !reduce && !cheapData);
  }, []);

  // Track scroll across the tall section: 0 at the top, 1 when it leaves.
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"],
  });

  // Weighty zoom from 1 -> 1.2, eased with cubic in-out.
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.2], {
    ease: easeInOutCubic,
  });
  // Fade the content out near the end so the next section meets it cleanly.
  const contentOpacity = useTransform(scrollYProgress, [0, 0.65, 0.9], [1, 1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 0.9], [0, -60]);

  return (
    <section
      ref={targetRef}
      className="relative h-[220vh] w-full bg-[#05060a]"
      aria-label="OwnState — Own Anything. Anywhere. On Earth."
    >
      {/* Pinned viewport: stays put while the section scrolls past it. */}
      <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden">
        {/* ---- Static cinematic gradient (always painted; LCP-safe fallback) ---- */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 35%, #0b2a3f 0%, #071a2a 45%, #05060a 100%)",
          }}
          aria-hidden="true"
        />

        {/* ---- Fixed video background (scroll-zoom) ---- */}
        {/* Only on capable, non-data-saving devices; preload deferred so it never
            blocks first paint. The gradient above is the fallback otherwise. */}
        {showVideo && (
          <motion.video
            style={{ scale }}
            className="absolute inset-0 h-full w-full object-cover will-change-transform motion-reduce:!scale-100"
            autoPlay
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
          >
            <source src="/earth-hero.mp4" type="video/mp4" />
          </motion.video>
        )}

        {/* ---- Premium radial + bottom scrim for legibility ---- */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 65% 55% at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 45%, transparent 72%), linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 22%, transparent 58%, rgba(0,0,0,0.9) 100%)",
          }}
        />

        {/* ---- Centred branding + CTA (entrance animations) ---- */}
        <motion.div
          style={{ opacity: contentOpacity, y: contentY }}
          className="relative z-10 flex flex-col items-center px-6 text-center"
        >
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: easeInOutCubic }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs text-brand-pale backdrop-blur"
          >
            <Globe2 className="size-3.5 text-brand-accent" />
            Own anything, anywhere on the planet
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1, ease: easeInOutCubic }}
            className="max-w-4xl text-5xl font-semibold tracking-tight text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.6)] sm:text-6xl lg:text-7xl"
          >
            Own Anything. Anywhere.{" "}
            <span className="text-gradient-brand">On Earth.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.25, ease: easeInOutCubic }}
            className="mt-6 max-w-xl text-base text-brand-pale drop-shadow-[0_1px_12px_rgba(0,0,0,0.6)] sm:text-lg"
          >
            From a village plot to a private island — fence your land, secure
            your title, and start your real estate empire with OwnState.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.4, ease: easeInOutCubic }}
            className="mt-10"
          >
            <Link
              href="/search"
              className="group inline-flex min-h-[44px] items-center gap-2 rounded-full bg-brand-teal px-8 py-3.5 text-base font-medium text-white shadow-lg shadow-black/30 outline-none transition-colors hover:bg-brand focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              Start Exploring
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>
        </motion.div>

        {/* ---- Scroll cue ---- */}
        <motion.div
          style={{ opacity: useTransform(scrollYProgress, [0, 0.08], [1, 0]) }}
          className="pointer-events-none absolute inset-x-0 bottom-7 flex flex-col items-center gap-1 text-brand-pale"
        >
          <span className="text-xs tracking-wide">Scroll to explore</span>
          <span className="size-4 animate-bounce">↓</span>
        </motion.div>
      </div>
    </section>
  );
}
