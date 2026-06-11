"use client";

// Client-only wrapper so Server Components can embed the Leaflet PropertyMap.

import dynamic from "next/dynamic";
import type { Property } from "@/types/database";

const PropertyMap = dynamic(() => import("@/components/search/PropertyMap"), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-muted" />,
});

export function PropertyMapClient({
  properties,
  className,
}: {
  properties: Property[];
  className?: string;
}) {
  return <PropertyMap properties={properties} className={className} />;
}
