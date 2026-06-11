// OwnState — sitemap.xml (Brick 15)
// Static marketing routes + every active property detail page, from real data.

import type { MetadataRoute } from "next";
import { getProperties } from "@/lib/actions/properties";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/search`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE}/list-property`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/auth`, changeFrequency: "yearly", priority: 0.3 },
  ];

  let properties: MetadataRoute.Sitemap = [];
  try {
    const rows = await getProperties({ limit: 1000 });
    properties = rows.map((p) => ({
      url: `${BASE}/property/${p.id}`,
      lastModified: p.updated_at,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch {
    // If the DB is unreachable at build time, still emit the static routes.
  }

  return [...staticRoutes, ...properties];
}
