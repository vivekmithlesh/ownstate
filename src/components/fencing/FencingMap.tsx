"use client";

// OwnState — FencingMap (Brick 12)
//
// Two modes:
//  • draw  — Esri satellite tiles + Leaflet-Geoman polygon draw + GPS; emits the
//            drawn polygon as GeoJSON + area (m²) via @turf/area.
//  • view  — read-only: redraws a saved polygon and fits to it.
// SSR-safe (loaded via next/dynamic ssr:false). Geoman controls/listeners are
// cleaned up on unmount.

import { useEffect } from "react";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Polygon,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import { area as turfArea } from "@turf/turf";
import { Crosshair } from "lucide-react";

import type { PolygonCoords } from "@/types/database";

const INDIA: [number, number] = [22.5, 79];
const ESRI_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const ESRI_ATTR = "Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics";

/** [lng,lat] ring → Leaflet [lat,lng] positions. */
function ringToLatLng(ring: [number, number][]): [number, number][] {
  return ring.map(([lng, lat]) => [lat, lng]);
}

/* ----------------------------------------------------------------- draw mode */

function DrawControl({
  onShape,
}: {
  onShape: (geojson: string, areaSqm: number) => void;
}) {
  const map = useMap();

  useEffect(() => {
    map.pm.addControls({
      position: "topleft",
      drawMarker: false,
      drawCircle: false,
      drawCircleMarker: false,
      drawPolyline: false,
      drawRectangle: false,
      drawText: false,
      cutPolygon: false,
      rotateMode: false,
      dragMode: false,
      drawPolygon: true,
      editMode: true,
      removalMode: true,
    });

    function emit(layer: L.Layer) {
      const feature = (layer as L.Polygon).toGeoJSON();
      const geom = feature.geometry;
      if (geom.type !== "Polygon") return;
      onShape(JSON.stringify(geom), turfArea(feature));
    }

    const onCreate = (e: L.LeafletEvent) => {
      const layer = (e as unknown as { layer: L.Layer }).layer;
      // Keep only the most recent polygon.
      map.pm.getGeomanLayers().forEach((l) => {
        if (l !== layer) map.removeLayer(l);
      });
      emit(layer);
      // Recompute on edit/drag of this layer.
      layer.on("pm:edit", () => emit(layer));
      (layer as unknown as { on: (t: string, f: () => void) => void }).on(
        "pm:dragend",
        () => emit(layer)
      );
    };

    map.on("pm:create", onCreate as L.LeafletEventHandlerFn);

    return () => {
      map.off("pm:create", onCreate as L.LeafletEventHandlerFn);
      try {
        map.pm.removeControls();
        map.pm.getGeomanLayers().forEach((l) => map.removeLayer(l));
      } catch {
        /* map already torn down */
      }
    };
  }, [map, onShape]);

  return null;
}

function GpsButton() {
  const map = useMap();
  function locate() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => map.setView([pos.coords.latitude, pos.coords.longitude], 17),
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }
  return (
    <button
      type="button"
      onClick={locate}
      className="absolute right-3 top-3 z-[1000] inline-flex items-center gap-1.5 rounded-lg bg-background px-3 py-1.5 text-sm font-medium shadow-md ring-1 ring-border hover:bg-muted"
    >
      <Crosshair className="size-4" /> My location
    </button>
  );
}

/* ----------------------------------------------------------------- view mode */

function FitPolygon({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      map.fitBounds(L.latLngBounds(positions), { padding: [24, 24] });
    }
  }, [map, positions]);
  return null;
}

/* ------------------------------------------------------------------- export */

export default function FencingMap({
  mode = "draw",
  value,
  onShape,
  className,
}: {
  mode?: "draw" | "view";
  value?: PolygonCoords;
  onShape?: (geojson: string, areaSqm: number) => void;
  className?: string;
}) {
  const ring = value?.[0] ? ringToLatLng(value[0]) : [];
  const center = ring[0] ?? INDIA;

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={ring.length > 0 ? 16 : 5}
        scrollWheelZoom
        className={className}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer attribution={ESRI_ATTR} url={ESRI_URL} maxZoom={19} />

        {mode === "draw" ? (
          <>
            <DrawControl onShape={onShape ?? (() => {})} />
            <GpsButton />
          </>
        ) : (
          ring.length > 0 && (
            <>
              <Polygon
                positions={ring}
                pathOptions={{ color: "#5dcaa5", weight: 2, fillOpacity: 0.25 }}
              />
              <FitPolygon positions={ring} />
            </>
          )
        )}
      </MapContainer>
    </div>
  );
}
