"use client";

// Client-only loader for LocationMap (leaflet touches `window` at import time),
// so the Server Component property page can render it safely.

import dynamic from "next/dynamic";

const LocationMap = dynamic(() => import("./LocationMap"), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-muted" />,
});

export function LocationMapClient(props: {
  lat: number;
  lng: number;
  zoom?: number;
  className?: string;
}) {
  return <LocationMap {...props} />;
}
