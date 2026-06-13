"use client";

// OwnState — Location picker for the listing wizard (Brick 10)
// Draggable Leaflet marker + map click + browser GPS, with free Nominatim
// reverse-geocoding to auto-fill the address fields. SSR-safe (loaded via
// next/dynamic ssr:false from the wizard).

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Crosshair, Loader2 } from "lucide-react";

const pin = L.divIcon({
  className: "ownstate-location-pin",
  html: `<span></span>`,
  iconSize: [0, 0],
  iconAnchor: [0, 0],
});

export interface ResolvedAddress {
  address: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface LatLngValue {
  lat: number;
  lng: number;
}

const INDIA: [number, number] = [22.5, 79];

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function Recenter({ value }: { value: LatLngValue | null }) {
  const map = useMap();
  const last = useRef<string>("");
  // Recenter as a side effect — never read/write refs or call map APIs during
  // render (that's the react-hooks/refs rule and can desync the map).
  useEffect(() => {
    if (!value) return;
    const key = `${value.lat},${value.lng}`;
    if (key !== last.current) {
      last.current = key;
      map.setView([value.lat, value.lng], Math.max(map.getZoom(), 14));
    }
  }, [value, map]);
  return null;
}

async function reverseGeocode(
  lat: number,
  lng: number
): Promise<ResolvedAddress | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&zoom=18&lat=${lat}&lon=${lng}`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const a = data.address ?? {};
    return {
      address: data.display_name ?? "",
      locality: a.suburb || a.neighbourhood || a.road || a.village || "",
      city: a.city || a.town || a.municipality || a.county || a.village || "",
      state: a.state || "",
      pincode: a.postcode || "",
      country: a.country || "India",
    };
  } catch {
    return null;
  }
}

export default function LocationPicker({
  value,
  onChange,
  onResolved,
}: {
  value: LatLngValue | null;
  onChange: (lat: number, lng: number) => void;
  onResolved: (parts: ResolvedAddress) => void;
}) {
  const mapRef = useRef<L.Map | null>(null);
  const [resolving, setResolving] = useState(false);

  async function pick(lat: number, lng: number) {
    onChange(lat, lng);
    setResolving(true);
    const parts = await reverseGeocode(lat, lng);
    setResolving(false);
    if (parts) onResolved(parts);
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setResolving(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        mapRef.current?.setView([latitude, longitude], 15);
        pick(latitude, longitude);
      },
      () => setResolving(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="relative">
      <div className="h-72 overflow-hidden rounded-xl border sm:h-80">
        <MapContainer
          center={value ? [value.lat, value.lng] : INDIA}
          zoom={value ? 14 : 5}
          scrollWheelZoom
          ref={mapRef}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={pick} />
          <Recenter value={value} />
          {value && (
            <Marker
              position={[value.lat, value.lng]}
              icon={pin}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const ll = e.target.getLatLng();
                  pick(ll.lat, ll.lng);
                },
              }}
            />
          )}
        </MapContainer>
      </div>

      <button
        type="button"
        onClick={useMyLocation}
        className="absolute right-3 top-3 z-[1000] inline-flex items-center gap-1.5 rounded-lg bg-background px-3 py-1.5 text-sm font-medium shadow-md ring-1 ring-border hover:bg-muted"
      >
        {resolving ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Crosshair className="size-4" />
        )}
        Use my location
      </button>

      <p className="mt-2 text-xs text-muted-foreground">
        Tap the map or drag the pin to set the exact location.
      </p>
    </div>
  );
}
