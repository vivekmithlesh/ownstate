"use client";

// Client-only loader for FencingMap (leaflet + geoman touch `window`).

import dynamic from "next/dynamic";
import type { PolygonCoords } from "@/types/database";

const FencingMap = dynamic(() => import("./FencingMap"), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-muted" />,
});

export function FencingMapClient(props: {
  mode?: "draw" | "view";
  value?: PolygonCoords;
  onShape?: (geojson: string, areaSqm: number) => void;
  className?: string;
}) {
  return <FencingMap {...props} />;
}
