// OwnState — Dashboard · My listings (Brick 11)

import Link from "next/link";
import { Plus } from "lucide-react";

import { getMyProperties } from "@/lib/actions/properties";
import { Button } from "@/components/ui/button";
import { ListingsTable } from "@/components/dashboard/ListingsTable";

export const metadata = { title: "My listings" };

export default async function MyPropertiesPage() {
  const properties = await getMyProperties();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My listings</h1>
          <p className="text-muted-foreground">
            {properties.length} {properties.length === 1 ? "property" : "properties"}
          </p>
        </div>
        <Button size="lg" render={<Link href="/list-property" />}>
          <Plus /> List property
        </Button>
      </div>

      {properties.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center">
          <p className="font-medium">You haven&apos;t listed anything yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            List your first property to reach buyers and renters.
          </p>
          <Button className="mt-4" render={<Link href="/list-property" />}>
            <Plus /> List a property
          </Button>
        </div>
      ) : (
        <ListingsTable properties={properties} />
      )}
    </div>
  );
}
