"use client";

// OwnState — Market ticker (Brick 07)
// Continuous marquee of indicative city ₹/sq ft rates. Pauses on hover.

import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

// Indicative market rates (₹ per sq ft) for the cities OwnState is live in.
const RATES: { city: string; rate: number; trend: number }[] = [
  { city: "Mumbai", rate: 31500, trend: 2.4 },
  { city: "Delhi", rate: 18200, trend: 1.8 },
  { city: "Bengaluru", rate: 12400, trend: 3.1 },
  { city: "Pune", rate: 9800, trend: 2.0 },
  { city: "Hyderabad", rate: 8600, trend: 3.6 },
  { city: "Chennai", rate: 8100, trend: 1.2 },
  { city: "Noida", rate: 9200, trend: 2.9 },
  { city: "Goa", rate: 14200, trend: 4.3 },
  { city: "Jaipur", rate: 6400, trend: 1.5 },
  { city: "Chandigarh", rate: 11000, trend: 1.9 },
  { city: "Lucknow", rate: 5600, trend: 2.2 },
];

export function MarketTicker() {
  const items = [...RATES, ...RATES]; // duplicate for a seamless loop

  return (
    <div className="group relative flex overflow-hidden border-y bg-brand-dark py-3 text-brand-light">
      <motion.div
        className="flex shrink-0 items-center gap-8 pr-8 group-hover:[animation-play-state:paused]"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 40, ease: "linear", repeat: Infinity }}
      >
        {items.map((r, i) => (
          <span
            key={`${r.city}-${i}`}
            className="flex items-center gap-2 whitespace-nowrap text-sm"
          >
            <span className="font-medium text-white">{r.city}</span>
            <span className="text-brand-pale">
              ₹{r.rate.toLocaleString("en-IN")}/sq ft
            </span>
            <span className="inline-flex items-center gap-0.5 text-brand-accent">
              <TrendingUp className="size-3.5" />
              {r.trend}%
            </span>
            <span className="text-white/20">•</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}
