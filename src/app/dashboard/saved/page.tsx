// OwnState — Dashboard · Saved (Brick 11)

import Link from "next/link";
import { Search } from "lucide-react";

import { getSavedProperties } from "@/lib/actions/saved";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/PropertyCard";

export const metadata = { title: "Saved" };

export default async function SavedPage() {
  const saved = await getSavedProperties();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Saved properties</h1>
        <p className="text-muted-foreground">
          {saved.length} {saved.length === 1 ? "property" : "properties"} saved
        </p>
      </div>

      {saved.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center">
          <p className="font-medium">Nothing saved yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap the heart on any listing to save it here.
          </p>
          <Button className="mt-4" render={<Link href="/search" />}>
            <Search /> Browse properties
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {saved.map((p) => (
            <PropertyCard key={p.id} property={p} initialSaved />
          ))}
        </div>
      )}
    </div>
  );
}
