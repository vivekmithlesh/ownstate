"use client";

// OwnState — FencingMap (Brick 12)
//
// Two modes:
//  • draw  — Esri satellite tiles + Leaflet-Geoman polygon draw + GPS; emits the
//            drawn polygon as GeoJSON + area (m²) via @turf/area.
//  • view  — read-only: redraws a saved polygon and fits to it.
// SSR-safe (loaded via next/dynamic ssr:false). Geoman controls/listeners are
// cleaned up on unmount.

import { useEffect, useRef, useState } from "react";
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
import { toast } from "sonner";
import { Crosshair, Loader2 } from "lucide-react";
import { getAccuratePosition } from "@/lib/geolocate";

// Reuse the brand location pin (styled in globals.css) for the GPS marker.
const locationPin = L.divIcon({
  className: "ownstate-location-pin",
  html: `<span></span>`,
  iconSize: [0, 0],
  iconAnchor: [0, 0],
});

import type { PolygonCoords } from "@/types/database";

const INDIA: [number, number] = [22.5, 79];
const ESRI_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const ESRI_ATTR = "Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics";

// Futuristic "energy fence" look: bright neon-green stroke + faint green fill.
// `className: "fence-neon"` attaches the glow filter defined in globals.css.
const NEON = "#39FF14";
const NEON_STYLE: L.PathOptions = {
  color: NEON,
  weight: 4,
  opacity: 1,
  fillColor: NEON,
  fillOpacity: 0.3,
  className: "fence-neon",
};

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

  // Keep the latest onShape in a ref. The parent passes a fresh closure on every
  // render (it calls setState inside onShape), so depending on it directly would
  // re-run this effect — and its cleanup removes every Geoman layer, wiping the
  // polygon the instant it's drawn. The ref lets the setup run ONCE per map.
  const onShapeRef = useRef(onShape);
  useEffect(() => {
    onShapeRef.current = onShape;
  }, [onShape]);

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

    // Neon styling: the finished polygon (pathOptions) and the rubber-band line
    // shown while drawing (templine/hintline) all glow neon-green.
    map.pm.setGlobalOptions({
      pathOptions: NEON_STYLE,
      templineStyle: { color: NEON, weight: 3 },
      hintlineStyle: { color: NEON, weight: 2, dashArray: "6 6" },
    });

    // Pull the exact GeoJSON Polygon off a layer and hand it (+ area in m²) up.
    function emit(layer: L.Layer) {
      const feature = (layer as L.Polygon).toGeoJSON();
      const geom = feature.geometry;
      if (geom.type !== "Polygon") return;
      onShapeRef.current(JSON.stringify(geom), turfArea(feature));
    }

    // draw.create — a new polygon was completed.
    const onCreate = (e: L.LeafletEvent) => {
      const layer = (e as unknown as { layer: L.Layer }).layer;
      // Keep only the most recent polygon; clear any earlier draft.
      map.pm.getGeomanLayers().forEach((l) => {
        if (l !== layer) map.removeLayer(l);
      });
      // Force the neon style onto the committed layer (covers any default).
      (layer as L.Polygon).setStyle?.(NEON_STYLE);
      emit(layer);
      // draw.update — recompute whenever this polygon is edited or dragged.
      layer.on("pm:edit", () => emit(layer));
      (layer as unknown as { on: (t: string, f: () => void) => void }).on(
        "pm:dragend",
        () => emit(layer)
      );
    };

    // draw.update — vertex edits fire at the map level too (belt and braces).
    const onEdit = (e: L.LeafletEvent) => {
      const layer = (e as unknown as { layer?: L.Layer }).layer;
      if (layer) emit(layer);
    };

    // draw.delete — polygon removed via the trash tool: clear the parent state
    // so Step 1's "draw a boundary first" guard re-engages.
    const onRemove = () => {
      if (map.pm.getGeomanLayers().length === 0) onShapeRef.current("", 0);
    };

    map.on("pm:create", onCreate as L.LeafletEventHandlerFn);
    map.on("pm:edit", onEdit as L.LeafletEventHandlerFn);
    map.on("pm:remove", onRemove as L.LeafletEventHandlerFn);

    return () => {
      map.off("pm:create", onCreate as L.LeafletEventHandlerFn);
      map.off("pm:edit", onEdit as L.LeafletEventHandlerFn);
      map.off("pm:remove", onRemove as L.LeafletEventHandlerFn);
      try {
        map.pm.removeControls();
        map.pm.getGeomanLayers().forEach((l) => map.removeLayer(l));
      } catch {
        /* map already torn down */
      }
    };
  }, [map]);

  return null;
}

function GpsButton() {
  const map = useMap();
  const [locating, setLocating] = useState(false);
  // Holds the current location marker + accuracy circle so we can replace/clean.
  const overlayRef = useRef<L.LayerGroup | null>(null);

  // Remove the location overlay when the map unmounts.
  useEffect(() => {
    return () => {
      overlayRef.current?.remove();
      overlayRef.current = null;
    };
  }, []);

  async function locate() {
    setLocating(true);
    try {
      // Wait for an accurate GPS fix, not the first coarse network reading.
      const pos = await getAccuratePosition({ desiredAccuracy: 30 });
      const { latitude, longitude, accuracy } = pos.coords;
      const latlng: [number, number] = [latitude, longitude];

      // Drop a visible pin + an accuracy halo, replacing any previous one.
      overlayRef.current?.remove();
      const circle = L.circle(latlng, {
        radius: Math.max(accuracy, 15),
        color: "#0f6e56",
        weight: 1,
        fillColor: "#0f6e56",
        fillOpacity: 0.12,
      });
      overlayRef.current = L.layerGroup([
        circle,
        L.marker(latlng, { icon: locationPin, keyboard: false }),
      ]).addTo(map);

      // Zoom to fit the accuracy circle (so we adapt to GPS precision).
      map.fitBounds(circle.getBounds(), { maxZoom: 18, padding: [24, 24] });
      toast.success(
        `Centred on your location (±${Math.round(accuracy)} m).`
      );
    } catch (err) {
      const denied =
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as GeolocationPositionError).code === 1;
      toast.error(
        denied
          ? "Location blocked. Allow location access in your browser, then retry."
          : "Couldn't get your location. Try again with a clear sky view."
      );
    } finally {
      setLocating(false);
    }
  }

  return (
    <button
      type="button"
      onClick={locate}
      disabled={locating}
      className="absolute right-3 top-3 z-[1000] inline-flex items-center gap-1.5 rounded-lg bg-background px-3 py-1.5 text-sm font-medium shadow-md ring-1 ring-border hover:bg-muted disabled:opacity-70"
    >
      {locating ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Crosshair className="size-4" />
      )}
      {locating ? "Locating…" : "My location"}
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
              <Polygon positions={ring} pathOptions={NEON_STYLE} />
              <FitPolygon positions={ring} />
            </>
          )
        )}
      </MapContainer>
    </div>
  );
}
