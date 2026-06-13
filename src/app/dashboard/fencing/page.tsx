// OwnState — Dashboard · Digital Land Fencing (Brick 12)
// Draw a boundary on satellite imagery, save it to PostGIS, and see every
// fenced land redrawn from its stored GeoJSON. Real data only.

import { ShieldCheck, Sprout } from "lucide-react";

import { requireUser } from "@/lib/auth";
import { getMyBoundaries } from "@/lib/actions/fencing";
import { FencingForm } from "@/components/fencing/FencingForm";
import { FencedLandCard } from "@/components/fencing/FencedLandCard";

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
