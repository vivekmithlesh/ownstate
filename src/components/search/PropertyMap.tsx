"use client";

// OwnState — PropertyMap (Brick 08)
//
// react-leaflet + free OpenStreetMap tiles. Renders price markers for real
// properties, emits the viewport on pan/zoom (moveend) for bounds search, and
// shows a popup mini-card per marker. Hovering a list card highlights its
// marker via `hoveredId`.

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

import type { Property } from "@/types/database";
import type { MapBounds } from "@/lib/filters";
import { formatPrice } from "@/lib/utils";

const INDIA_CENTER: [number, number] = [22.5, 79];

/** Short price for the marker pill (₹7.2Cr, ₹55k/mo). */
function markerLabel(p: Property): string {
  const r = Math.round(p.price / 100);
  const rent = p.listing_type === "rent" || p.listing_type === "lease";
  const trim = (n: number) => Number(n.toFixed(1)).toString();
  if (rent) {
    if (r >= 1_00_000) return `₹${trim(r / 1_00_000)}L`;
    if (r >= 1_000) return `₹${Math.round(r / 1_000)}k`;
    return `₹${r}`;
  }
  if (r >= 1_00_00_000) return `₹${trim(r / 1_00_00_000)}Cr`;
  if (r >= 1_00_000) return `₹${trim(r / 1_00_000)}L`;
  return `₹${r}`;
}

function priceIcon(p: Property, active: boolean): L.DivIcon {
  return L.divIcon({
    className: "ownstate-price-marker",
    html: `<span class="${
      active ? "is-active" : ""
    }">${markerLabel(p)}</span>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

/** Emits viewport bounds on pan/zoom. */
function BoundsWatcher({
  onBoundsChange,
}: {
  onBoundsChange?: (b: MapBounds) => void;
}) {
  const map = useMapEvents({
    moveend() {
      if (!onBoundsChange) return;
      const b = map.getBounds();
      onBoundsChange({
        minLat: b.getSouth(),
        minLng: b.getWest(),
        maxLat: b.getNorth(),
        maxLng: b.getEast(),
      });
    },
  });
  return null;
}

/** Fit to the markers once, the first time properties arrive. */
function FitOnce({ properties }: { properties: Property[] }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    const pts = properties
      .filter((p) => p.location)
      .map((p) => [p.location!.lat, p.location!.lng] as [number, number]);
    if (pts.length === 0) return;
    done.current = true;
    if (pts.length === 1) {
      map.setView(pts[0], 12);
    } else {
      map.fitBounds(L.latLngBounds(pts), { padding: [48, 48] });
    }
  }, [properties, map]);
  return null;
}

export default function PropertyMap({
  properties,
  hoveredId,
  onBoundsChange,
  className,
}: {
  properties: Property[];
  hoveredId?: string | null;
  onBoundsChange?: (b: MapBounds) => void;
  className?: string;
}) {
  const withLocation = useMemo(
    () => properties.filter((p) => p.location),
    [properties]
  );

  return (
    <MapContainer
      center={INDIA_CENTER}
      zoom={5}
      scrollWheelZoom
      className={className}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <BoundsWatcher onBoundsChange={onBoundsChange} />
      <FitOnce properties={withLocation} />

      {withLocation.map((p) => (
        <Marker
          key={p.id}
          position={[p.location!.lat, p.location!.lng]}
          icon={priceIcon(p, hoveredId === p.id)}
          zIndexOffset={hoveredId === p.id ? 1000 : 0}
        >
          <Popup>
            <Link href={`/property/${p.id}`} className="block w-44">
              {p.cover_image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.cover_image}
                  alt={p.title}
                  className="mb-1.5 h-24 w-full rounded-md object-cover"
                />
              )}
              <span className="block text-sm font-semibold text-[#0f6e56]">
                {formatPrice(p.price, p.listing_type)}
              </span>
              <span className="block truncate text-xs font-medium text-neutral-800">
                {p.title}
              </span>
              <span className="block truncate text-[11px] text-neutral-500">
                {[p.locality, p.city].filter(Boolean).join(", ")}
              </span>
            </Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
