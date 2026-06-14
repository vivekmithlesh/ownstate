// OwnState — Similar + nearby properties (streamed server component)
//
// Rendered inside a <Suspense> on the detail page so the main content paints
// immediately and these (heavier, below-the-fold) geo/type queries stream in
// behind a skeleton. Kept out of the page body so they never block the initial
// response — and so they can't soft-200 the notFound() existence check.

import { getProperties, getPropertiesNearby } from "@/lib/actions/properties";
import { PropertyCard } from "@/components/PropertyCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { PropertyType } from "@/types/database";

export async function RelatedProperties({
  propertyId,
  type,
  lat,
  lng,
  savedIds,
}: {
  propertyId: string;
  type: PropertyType;
  lat: number | null;
  lng: number | null;
  savedIds: string[];
}) {
  const [similarRaw, nearbyRaw] = await Promise.all([
    getProperties({ type, limit: 7 }),
    lat != null && lng != null
      ? getPropertiesNearby(lat, lng, 75, 7)
      : Promise.resolve([]),
  ]);

  const savedSet = new Set(savedIds);
  const similar = similarRaw.filter((p) => p.id !== propertyId).slice(0, 3);
  const nearby = nearbyRaw.filter((p) => p.id !== propertyId).slice(0, 4);

  return (
    <>
      {similar.length > 0 && (
        <section className="mt-14">
          <h2 className="text-2xl font-semibold tracking-tight">
            Similar properties
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
                initialSaved={savedSet.has(p.id)}
              />
            ))}
          </div>
        </section>
      )}

      {nearby.length > 0 && (
        <section className="mt-14">
          <h2 className="text-2xl font-semibold tracking-tight">
            Nearby properties
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {nearby.map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
                initialSaved={savedSet.has(p.id)}
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

/** Skeleton shown while RelatedProperties streams in. */
export function RelatedPropertiesSkeleton() {
  return (
    <section className="mt-14" aria-hidden="true">
      <Skeleton className="h-8 w-56" />
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-72 rounded-2xl" />
        ))}
      </div>
    </section>
  );
}
