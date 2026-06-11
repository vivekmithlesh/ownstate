// OwnState — Dashboard · Digital Land Fencing (Brick 12)
// Draw a boundary on satellite imagery, save it to PostGIS, and see every
// fenced land redrawn from its stored GeoJSON. Real data only.

import { CalendarDays, MapPin, Ruler, ShieldCheck, Sprout } from "lucide-react";

import { requireUser } from "@/lib/auth";
import { getMyBoundaries, type FencedLand } from "@/lib/actions/fencing";
import { FencingForm } from "@/components/fencing/FencingForm";
import { FencingMapClient } from "@/components/fencing/FencingMapClient";

export const metadata = { title: "Land Fencing" };

export default async function FencingPage() {
  const user = await requireUser("/dashboard/fencing");
  const lands = await getMyBoundaries();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <ShieldCheck className="size-6 text-brand-teal" />
          Digital Land Fencing
        </h1>
        <p className="mt-1 text-muted-foreground">
          Trace your land&apos;s boundary on satellite imagery to fence it
          digitally. Each boundary is stored as a real geo-polygon you can
          attach to a listing or share with buyers.
        </p>
      </header>

      <FencingForm userId={user.id} />

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">
            My fenced lands
          </h2>
          <p className="text-sm text-muted-foreground">
            {lands.length} {lands.length === 1 ? "boundary" : "boundaries"}
          </p>
        </div>

        {lands.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-12 text-center">
            <Sprout className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 font-medium">No fenced lands yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Use the map above to draw and save your first boundary.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {lands.map((land) => (
              <FencedLandCard key={land.id} land={land} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function FencedLandCard({ land }: { land: FencedLand }) {
  const place = [land.village, land.tehsil, land.district, land.state]
    .filter(Boolean)
    .join(", ");
  const created = new Date(land.created_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <article className="overflow-hidden rounded-2xl border bg-card">
      <div className="h-48 w-full border-b">
        <FencingMapClient
          mode="view"
          value={land.boundary}
          className="h-full w-full"
        />
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium leading-tight">{land.land_name}</h3>
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

        {(land.khasra_number || land.khata_number) && (
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
      </div>
    </article>
  );
}
