// OwnState — small client-safe geometry helpers (Brick 12).

import type { PolygonCoords } from "@/types/database";

/**
 * Area-weighted centroid of a polygon's outer ring.
 * `boundary` is GeoJSON-style rings of [lng, lat] pairs (PostGIS order).
 * Returns { lat, lng } suitable for a Google Maps destination, or null.
 */
export function polygonCentroid(
  boundary: PolygonCoords | undefined | null
): { lat: number; lng: number } | null {
  const ring = boundary?.[0];
  if (!ring || ring.length === 0) return null;

  const n = ring.length;
  let twiceArea = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < n; i++) {
    const [x0, y0] = ring[i];
    const [x1, y1] = ring[(i + 1) % n];
    const cross = x0 * y1 - x1 * y0;
    twiceArea += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
  }

  // Degenerate (zero-area) ring: fall back to the average of its vertices.
  if (Math.abs(twiceArea) < 1e-12) {
    const sum = ring.reduce(
      (acc, [x, y]) => [acc[0] + x, acc[1] + y],
      [0, 0]
    );
    return { lng: sum[0] / n, lat: sum[1] / n };
  }

  const factor = 1 / (3 * twiceArea);
  return { lng: cx * factor, lat: cy * factor };
}
