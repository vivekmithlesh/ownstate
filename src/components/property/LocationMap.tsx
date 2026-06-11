"use client";

// OwnState — single-location map for the property detail page (Brick 09)
// react-leaflet + OSM, one brand pin at the real coordinates. SSR-safe: the
// page imports this via next/dynamic({ ssr:false }).

import L from "leaflet";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const pin = L.divIcon({
  className: "ownstate-location-pin",
  html: `<span></span>`,
  iconSize: [0, 0],
  iconAnchor: [0, 0],
});

export default function LocationMap({
  lat,
  lng,
  zoom = 14,
  className,
}: {
  lat: number;
  lng: number;
  zoom?: number;
  className?: string;
}) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={zoom}
      scrollWheelZoom={false}
      className={className}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]} icon={pin} />
    </MapContainer>
  );
}
