// OwnState — best-effort rate limiting (production security)
//
// IN-MEMORY sliding-window limiter. It throttles bursts that hit the SAME warm
// serverless instance, which stops naive scripts and accidental double-submits.
//
// ⚠️ PRODUCTION NOTE: on Vercel/serverless, memory is per-instance and resets on
// cold start, so this is defense-in-depth, NOT a hard guarantee. For real
// protection at scale, back this with Upstash Redis / Vercel KV (see PRODUCTION.md)
// — the call sites can stay the same; only `hit()` swaps to the shared store.

import { headers } from "next/headers";

type Window = { count: number; resetAt: number };
const buckets = new Map<string, Window>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Record a hit for `key`. Returns ok=false once `limit` is exceeded within
 * `windowMs`. Pure-ish and synchronous; safe to call from server actions/routes.
 */
export function hit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, remaining: limit - 1, resetAt };
  }

  existing.count += 1;
  const ok = existing.count <= limit;
  return { ok, remaining: Math.max(0, limit - existing.count), resetAt: existing.resetAt };
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}

/** Convenience: limit by IP for a named action. Throws a friendly error if over. */
export async function enforceIpLimit(
  action: string,
  limit: number,
  windowMs: number
): Promise<void> {
  const ip = await clientIp();
  const res = hit(`${action}:${ip}`, limit, windowMs);
  if (!res.ok) {
    throw new Error("Too many requests. Please slow down and try again shortly.");
  }
}

// Occasionally evict expired buckets so the map can't grow unbounded.
let lastSweep = Date.now();
export function maybeSweep() {
  const now = Date.now();
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
}
