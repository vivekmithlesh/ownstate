"use client";

// OwnState — PropertyCard (Brick 06)
//
// Reusable card for a real Property. Links to /property/[id], shows price /
// specs / badges, and has a working Save heart wired to the toggleSaved action.

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, BedDouble, Bath, Maximize, BadgeCheck } from "lucide-react";
import { toast } from "sonner";

import type { ListingType, Property } from "@/types/database";
import { cn, formatArea, formatPrice, getPropertyIcon } from "@/lib/utils";
import { toggleSaved } from "@/lib/actions/saved";
import { Badge } from "@/components/ui/badge";

const LISTING_LABEL: Record<ListingType, string> = {
  sell: "For Sale",
  rent: "For Rent",
  lease: "For Lease",
};

const HAS_ROOMS = new Set<Property["type"]>([
  "flat",
  "house",
  "villa",
  "penthouse",
  "mansion",
  "chateau",
]);

export function PropertyCard({
  property,
  initialSaved = false,
  className,
}: {
  property: Property;
  initialSaved?: boolean;
  className?: string;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();
  const TypeIcon = getPropertyIcon(property.type);

  const area = formatArea(property.area_sqft, property.area_unit);
  const showRooms = HAS_ROOMS.has(property.type);

  function onToggleSave(e: React.MouseEvent) {
    e.preventDefault(); // don't follow the card link
    e.stopPropagation();
    const next = !saved;
    setSaved(next); // optimistic
    startTransition(async () => {
      try {
        const result = await toggleSaved(property.id);
        setSaved(result);
        toast.success(result ? "Saved" : "Removed from saved");
      } catch (err) {
        setSaved(!next); // revert
        toast.error(
          err instanceof Error ? err.message : "Couldn't update saved"
        );
      }
    });
  }

  return (
    <Link
      href={`/property/${property.id}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {property.cover_image ? (
          <Image
            src={property.cover_image}
            alt={property.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground">
            <TypeIcon className="size-10" />
          </div>
        )}

        {/* Top badges */}
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <Badge className="bg-brand-teal text-white shadow-sm">
            {LISTING_LABEL[property.listing_type]}
          </Badge>
          {property.verified && (
            <Badge className="bg-white/90 text-brand-dark shadow-sm">
              <BadgeCheck className="text-brand-teal" />
              Verified
            </Badge>
          )}
        </div>

        {/* Save heart */}
        <button
          type="button"
          onClick={onToggleSave}
          disabled={pending}
          aria-pressed={saved}
          aria-label={saved ? "Remove from saved" : "Save property"}
          className="absolute right-3 bottom-3 grid size-9 place-items-center rounded-full bg-white/90 text-brand-dark shadow-sm transition-colors hover:bg-white disabled:opacity-70"
        >
          <Heart
            className={cn(
              "size-4.5 transition-all",
              saved && "fill-rose-500 text-rose-500"
            )}
          />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <TypeIcon className="size-3.5" />
          <span className="capitalize">{property.type}</span>
          {property.locality && (
            <>
              <span aria-hidden>·</span>
              <span className="truncate">
                {property.locality}
                {property.city ? `, ${property.city}` : ""}
              </span>
            </>
          )}
        </div>

        <h3 className="line-clamp-1 text-base font-semibold tracking-tight">
          {property.title}
        </h3>

        <div className="text-lg font-semibold text-brand-teal">
          {formatPrice(property.price, property.listing_type)}
        </div>

        {/* Specs */}
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-sm text-muted-foreground">
          {showRooms && property.bedrooms != null && (
            <span className="inline-flex items-center gap-1.5">
              <BedDouble className="size-4" /> {property.bedrooms} Beds
            </span>
          )}
          {showRooms && property.bathrooms != null && (
            <span className="inline-flex items-center gap-1.5">
              <Bath className="size-4" /> {property.bathrooms} Baths
            </span>
          )}
          {area && (
            <span className="inline-flex items-center gap-1.5">
              <Maximize className="size-4" /> {area}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default PropertyCard;
