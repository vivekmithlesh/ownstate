"use client";

// OwnState — "Get directions" button (Brick 12).
// Reads the visitor's live GPS, then opens Google Maps with a route from their
// location to the land. If location is denied/unavailable it still opens
// directions to the destination (Google falls back to the device location), so
// the route option is ALWAYS available for every land.

import { useState } from "react";
import { toast } from "sonner";
import { Navigation, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/button";
import { getAccuratePosition } from "@/lib/geolocate";

const MAPS_DIR = "https://www.google.com/maps/dir/?api=1";

export function DirectionsButton({
  destLat,
  destLng,
  label = "Get directions",
  className,
  variant = "outline",
  size = "sm",
}: {
  destLat: number;
  destLng: number;
  label?: string;
  className?: string;
  variant?: VariantProps<typeof buttonVariants>["variant"];
  size?: VariantProps<typeof buttonVariants>["size"];
}) {
  const [locating, setLocating] = useState(false);
  const destination = `${destLat},${destLng}`;

  function openTo(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function getDirections() {
    setLocating(true);
    try {
      // Wait for an accurate GPS fix instead of the first coarse reading.
      const pos = await getAccuratePosition({ desiredAccuracy: 30 });
      const origin = `${pos.coords.latitude},${pos.coords.longitude}`;
      openTo(`${MAPS_DIR}&origin=${origin}&destination=${destination}`);
    } catch (err) {
      const denied =
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as GeolocationPositionError).code === 1;
      toast.error(
        denied
          ? "Location blocked — opening directions to the land instead."
          : "Couldn't read your location — opening the destination."
      );
      // Graceful fallback: directions still open (Google uses device GPS).
      openTo(`${MAPS_DIR}&destination=${destination}`);
    } finally {
      setLocating(false);
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={getDirections}
      disabled={locating}
      className={className}
    >
      {locating ? (
        <Loader2 className="animate-spin" />
      ) : (
        <Navigation />
      )}
      {locating ? "Locating…" : label}
    </Button>
  );
}
