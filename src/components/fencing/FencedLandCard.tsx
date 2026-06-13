"use client";

// OwnState — interactive "My fenced lands" card (Brick 12).
// • Card body links to the land's details page (/dashboard/fencing/[id]).
// • Expand icon opens a full-screen dialog with a large interactive map.
// • "Get directions" routes from the visitor's live GPS to the land centroid.

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Expand,
  MapPin,
  Ruler,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FencingMapClient } from "@/components/fencing/FencingMapClient";
import { DirectionsButton } from "@/components/fencing/DirectionsButton";
import { polygonCentroid } from "@/lib/geo";
import type { FencedLand } from "@/lib/actions/fencing";

export function FencedLandCard({ land }: { land: FencedLand }) {
  const [expanded, setExpanded] = useState(false);

  const place = [land.village, land.tehsil, land.district, land.state]
    .filter(Boolean)
    .join(", ");
  const created = new Date(land.created_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const center = polygonCentroid(land.boundary);
  const href = `/dashboard/fencing/${land.id}`;

  return (
    <article className="overflow-hidden rounded-2xl border bg-card">
      {/* Mini-map with an Expand button overlay. */}
      <div className="relative h-48 w-full border-b">
        <FencingMapClient
          mode="view"
          value={land.boundary}
          className="h-full w-full"
        />
        {/* Hidden while the dialog is open: the portaled dialog covers the page,
            but this button shares the page's stacking context and can bleed over
            the expanded map. Not rendering it while expanded removes the overlap
            (the dialog has its own close button). */}
        {!expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            aria-label="Expand map"
            className="absolute right-2 top-2 z-10 inline-flex size-9 items-center justify-center rounded-lg bg-background/90 shadow-md ring-1 ring-border backdrop-blur hover:bg-background"
          >
            <Expand className="size-4" />
          </button>
        )}
      </div>

      <div className="space-y-3 p-4">
        {/* Title links to the details page. */}
        <div className="flex items-start justify-between gap-2">
          <Link
            href={href}
            className="font-medium leading-tight outline-none hover:text-brand-teal focus-visible:text-brand-teal focus-visible:underline"
          >
            {land.land_name}
          </Link>
          {land.verified ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-light px-2 py-0.5 text-xs font-medium text-brand-teal">
              <ShieldCheck className="size-3.5" /> Verified
            </span>
          ) : (
            <span className="inline-flex shrink-0 items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              Pending
            </span>
          )}
        </div>

        <dl className="space-y-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Ruler className="size-4 shrink-0 text-brand-teal" />
            <span>
              <strong className="text-foreground">
                {land.area_acres != null ? land.area_acres.toFixed(2) : "—"}
              </strong>{" "}
              acres
              {land.ownership_type ? ` · ${land.ownership_type}` : ""}
            </span>
          </div>
          {place && (
            <div className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0" />
              <span className="truncate">{place}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 shrink-0" />
            <span>Fenced {created}</span>
          </div>
        </dl>

        {(land.khasra_number ||
          land.khata_number ||
          land.document_urls.length > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {land.khasra_number && (
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                Khasra {land.khasra_number}
              </span>
            )}
            {land.khata_number && (
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                Khata {land.khata_number}
              </span>
            )}
            {land.document_urls.length > 0 && (
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {land.document_urls.length}{" "}
                {land.document_urls.length === 1 ? "document" : "documents"}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button size="sm" render={<Link href={href} />}>
            View details <ArrowRight />
          </Button>
          {center && (
            <DirectionsButton destLat={center.lat} destLng={center.lng} />
          )}
        </div>
      </div>

      {/* Full-screen map dialog. */}
      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="grid h-[85vh] max-w-[calc(100%-1.5rem)] grid-rows-[auto_1fr] gap-3 p-4 sm:max-w-3xl lg:max-w-5xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="size-4 text-brand-teal" />
              {land.land_name}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-hidden rounded-xl border">
            {expanded && (
              <FencingMapClient
                mode="view"
                value={land.boundary}
                className="h-full w-full"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </article>
  );
}
