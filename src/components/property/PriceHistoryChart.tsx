"use client";

// OwnState — Estimated price history (Brick 09)
// We don't store historical prices yet, so this charts a deterministic estimated
// trend that lands on the real current price. Clearly labelled "estimated".

import { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export function PriceHistoryChart({ priceRupees }: { priceRupees: number }) {
  const data = useMemo(() => {
    const now = new Date().getFullYear();
    // Assume ~7% average annual appreciation, ending at today's price.
    const years = 6;
    const points: { year: string; value: number }[] = [];
    for (let i = years; i >= 0; i--) {
      const value = priceRupees / 1.07 ** i;
      points.push({ year: String(now - i), value: Math.round(value) });
    }
    return points;
  }, [priceRupees]);

  const fmt = (v: number) =>
    v >= 1e7
      ? `₹${(v / 1e7).toFixed(1)}Cr`
      : v >= 1e5
        ? `₹${(v / 1e5).toFixed(1)}L`
        : `₹${v}`;

  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Price trend</h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          Estimated
        </span>
      </div>
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1D9E75" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#1D9E75" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="year"
              tickLine={false}
              axisLine={false}
              fontSize={12}
            />
            <YAxis
              tickFormatter={fmt}
              tickLine={false}
              axisLine={false}
              width={56}
              fontSize={12}
            />
            <Tooltip
              formatter={(value) => [fmt(Number(value)), "Est. value"]}
              labelStyle={{ color: "#0d2b1e" }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#0f6e56"
              strokeWidth={2}
              fill="url(#priceFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
