// OwnState — Home (interim, Brick 06)
//
// A real, data-backed home so the design system is demonstrable now: a dark
// space-hero placeholder + a grid of real featured PropertyCards. Brick 07
// builds the full home (browse-by-type, land-fencing spotlight, stats, etc.)
// and Brick 14 replaces the hero with the cinematic 3D Earth.

import Link from "next/link";
import { Search } from "lucide-react";

import { getProperties } from "@/lib/actions/properties";
import { getSavedIds } from "@/lib/actions/saved";
import { PropertyCard } from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const [featured, savedIds] = await Promise.all([
    getProperties({ limit: 6, verified: true }),
    getSavedIds(),
  ]);
  const saved = new Set(savedIds);

  return (
    <>
      {/* Hero placeholder (cinematic 3D Earth arrives in Brick 14) */}
      <section className="bg-space-radial text-brand-light">
        <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Own Anything. Anywhere. On Earth.
          </h1>
          <p className="mt-5 max-w-xl text-brand-pale sm:text-lg">
            Buy, sell, rent &amp; lease any property on the planet — and protect
            your land forever with Digital Land Fencing.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" render={<Link href="/search" />}>
              <Search /> Start exploring
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<Link href="/list-property" />}
              className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              List your property
            </Button>
          </div>
        </div>
      </section>

      {/* Featured listings */}
      <section className="section">
        <div className="container-page">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Featured properties
              </h2>
              <p className="mt-1 text-muted-foreground">
                Verified listings across India — homes, plots, estates &amp;
                islands.
              </p>
            </div>
            <Button
              variant="ghost"
              render={<Link href="/search" />}
              className="hidden sm:inline-flex"
            >
              View all
            </Button>
          </div>

          {featured.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
              No listings yet. Run the seed (Brick 03) to populate properties.
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  initialSaved={saved.has(property.id)}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
