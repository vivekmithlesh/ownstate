// OwnState — Property detail (Brick 09)
// Server Component. Real property + owner, gallery, specs, amenities, location
// map, estimated price trend, EMI, enquiry/deal panel, similar + nearby.

import { cache, Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BedDouble,
  Bath,
  Maximize,
  Sofa,
  MapPin,
  ChevronRight,
  CheckCircle2,
  Building2,
} from "lucide-react";

import { getPropertyById } from "@/lib/actions/properties";
import { getSavedIds } from "@/lib/actions/saved";
import { getUser, getMyProfile } from "@/lib/auth";
import { formatArea, formatPrice, getPropertyIcon } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PropertyGallery } from "@/components/property/PropertyGallery";
import { SaveShareButtons } from "@/components/property/SaveShareButtons";
import { EmiCalculator } from "@/components/property/EmiCalculator";
import { PriceHistoryChart } from "@/components/property/PriceHistoryChart";
import { ContactPanel } from "@/components/property/ContactPanel";
import {
  RelatedProperties,
  RelatedPropertiesSkeleton,
} from "@/components/property/RelatedProperties";
import { MobileBar } from "@/components/property/MobileBar";
import { LocationMapClient } from "@/components/property/LocationMapClient";
import { DirectionsButton } from "@/components/fencing/DirectionsButton";
import type { ListingType } from "@/types/database";

const LISTING_LABEL: Record<ListingType, string> = {
  sell: "For Sale",
  rent: "For Rent",
  lease: "For Lease",
};

// Deduped per-request fetch shared by generateMetadata and the page, so a found
// property is queried once. generateMetadata resolves BEFORE the response
// streams, so calling notFound() there yields a real HTTP 404 (not a soft-200
// from the loading.tsx shell flushing first).
const getProperty = cache(getPropertyById);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();

  const where = [property.locality, property.city].filter(Boolean).join(", ");
  return {
    title: property.title,
    description:
      property.description?.slice(0, 160) ??
      `${property.title} in ${where} on OwnState.`,
    openGraph: {
      title: property.title,
      description: where,
      images: property.cover_image ? [property.cover_image] : undefined,
    },
  };
}

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [property, savedIds, user] = await Promise.all([
    getProperty(id),
    getSavedIds(),
    getUser(),
  ]);

  if (!property) notFound();

  const profile = user ? await getMyProfile() : null;
  const savedSet = new Set(savedIds);

  const TypeIcon = getPropertyIcon(property.type);
  const where = [property.locality, property.city, property.state]
    .filter(Boolean)
    .join(", ");
  const area = formatArea(property.area_sqft, property.area_unit);

  const specs = [
    property.bedrooms != null && {
      icon: BedDouble,
      label: "Bedrooms",
      value: property.bedrooms,
    },
    property.bathrooms != null && {
      icon: Bath,
      label: "Bathrooms",
      value: property.bathrooms,
    },
    area && { icon: Maximize, label: "Area", value: area },
    property.furnishing && {
      icon: Sofa,
      label: "Furnishing",
      value: property.furnishing,
    },
    { icon: Building2, label: "Type", value: property.type },
  ].filter(Boolean) as {
    icon: typeof BedDouble;
    label: string;
    value: string | number;
  }[];

  return (
    <div className="pb-24 lg:pb-0">
      <div className="container-page py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <ChevronRight className="size-4" />
          <Link href="/search" className="hover:text-foreground">
            Search
          </Link>
          <ChevronRight className="size-4" />
          <span className="truncate text-foreground">{property.title}</span>
        </nav>

        {/* Header */}
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-brand-teal text-white">
                {LISTING_LABEL[property.listing_type]}
              </Badge>
              <Badge variant="outline" className="capitalize">
                <TypeIcon /> {property.type}
              </Badge>
              {property.verified && (
                <Badge className="bg-brand-light text-brand-teal">
                  Verified
                </Badge>
              )}
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              {property.title}
            </h1>
            {where && (
              <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="size-4" /> {where}
              </p>
            )}
          </div>
          <div className="hidden sm:block">
            <SaveShareButtons
              propertyId={property.id}
              title={property.title}
              initialSaved={savedSet.has(property.id)}
            />
          </div>
        </div>

        {/* Gallery */}
        <div className="mt-5">
          <PropertyGallery
            images={
              property.cover_image
                ? [property.cover_image, ...property.images].filter(
                    (v, i, a) => a.indexOf(v) === i
                  )
                : property.images
            }
            title={property.title}
          />
        </div>

        {/* Main grid */}
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Left: details */}
          <div className="space-y-8 lg:col-span-2">
            {/* Specs */}
            <section className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {specs.map((s) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.label}
                    className="rounded-xl border bg-card p-4"
                  >
                    <Icon className="size-5 text-brand-teal" />
                    <div className="mt-2 text-lg font-semibold capitalize">
                      {s.value}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {s.label}
                    </div>
                  </div>
                );
              })}
            </section>

            {/* Description */}
            {property.description && (
              <section>
                <h2 className="text-xl font-semibold">About this property</h2>
                <p className="mt-3 whitespace-pre-line leading-relaxed text-foreground/90">
                  {property.description}
                </p>
              </section>
            )}

            {/* Amenities */}
            {property.amenities.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold">Amenities</h2>
                <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {property.amenities.map((a) => (
                    <li
                      key={a}
                      className="flex items-center gap-2 text-sm text-foreground/90"
                    >
                      <CheckCircle2 className="size-4 shrink-0 text-brand-teal" />
                      {a}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Location */}
            {property.location && (
              <section>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">Location</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{where}</p>
                  </div>
                  <DirectionsButton
                    destLat={property.location.lat}
                    destLng={property.location.lng}
                    label="Get directions"
                  />
                </div>
                <div className="mt-3 h-72 overflow-hidden rounded-2xl border">
                  <LocationMapClient
                    lat={property.location.lat}
                    lng={property.location.lng}
                    className="h-full w-full"
                  />
                </div>
              </section>
            )}

            {/* Price trend */}
            <section>
              <PriceHistoryChart priceRupees={property.price / 100} />
            </section>
          </div>

          {/* Right: sticky contact + EMI */}
          <div className="space-y-6 lg:col-span-1">
            <div className="lg:sticky lg:top-28 lg:space-y-6">
              <ContactPanel
                property={property}
                isAuthed={Boolean(user)}
                defaultName={profile?.full_name ?? ""}
                defaultPhone={profile?.phone ?? ""}
              />
              <EmiCalculator priceRupees={property.price / 100} />
            </div>
          </div>
        </div>

        {/* Similar + nearby: streamed behind a skeleton so they don't block
            the main content (and can't soft-200 the notFound() check above). */}
        <Suspense fallback={<RelatedPropertiesSkeleton />}>
          <RelatedProperties
            propertyId={property.id}
            type={property.type}
            lat={property.location?.lat ?? null}
            lng={property.location?.lng ?? null}
            savedIds={savedIds}
          />
        </Suspense>
      </div>

      <MobileBar price={property.price} listingType={property.listing_type} />
    </div>
  );
}
