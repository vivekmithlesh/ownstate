"use client";

// OwnState — Search experience (Brick 08)
//
// URL-driven filters + real DB results + live Leaflet map. Panning the map runs
// a debounced bounds search (getPropertiesInBounds); filters re-query / refine.
// Desktop = list 40% + sticky map 60%. Mobile = list with a List/Map toggle.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, Map as MapIcon, List, X } from "lucide-react";

import type { ListingType, Property, PropertyType } from "@/types/database";
import type { MapBounds, PropertyFilters } from "@/lib/filters";
import { useProperties, usePropertiesInBounds, useSavedIds } from "@/lib/queries";
import {
  PROPERTY_TYPES,
  LUXURY_TYPES,
  CITIES,
  BUY_BUDGETS,
  RENT_BUDGETS,
  BEDROOM_OPTIONS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { PropertyCard } from "@/components/PropertyCard";

const PropertyMap = dynamic(() => import("@/components/search/PropertyMap"), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-muted" />,
});

interface UIFilters {
  listingType?: ListingType;
  type?: PropertyType;
  luxury?: boolean;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  search?: string;
}

type Params = Record<string, string | undefined>;

function parseFilters(p: Params): UIFilters {
  const num = (v?: string) => (v != null && v !== "" ? Number(v) : undefined);
  return {
    listingType: (["sell", "rent", "lease"] as const).includes(
      p.listing as ListingType
    )
      ? (p.listing as ListingType)
      : undefined,
    type: p.type as PropertyType | undefined,
    luxury: p.luxury === "1",
    city: p.city || undefined,
    minPrice: num(p.min),
    maxPrice: num(p.max),
    bedrooms: num(p.beds),
    search: p.q || undefined,
  };
}

function toQuery(f: UIFilters): string {
  const q = new URLSearchParams();
  if (f.listingType) q.set("listing", f.listingType);
  if (f.type) q.set("type", f.type);
  if (f.luxury) q.set("luxury", "1");
  if (f.city) q.set("city", f.city);
  if (f.minPrice != null) q.set("min", String(f.minPrice));
  if (f.maxPrice != null) q.set("max", String(f.maxPrice));
  if (f.bedrooms != null) q.set("beds", String(f.bedrooms));
  if (f.search) q.set("q", f.search);
  return q.toString();
}

/** Server filters we can push down to getProperties (luxury handled client-side). */
function toServerFilters(f: UIFilters): PropertyFilters {
  return {
    status: "active",
    listingType: f.listingType,
    type: f.luxury ? undefined : f.type,
    city: f.city,
    minPrice: f.minPrice,
    maxPrice: f.maxPrice,
    bedrooms: f.bedrooms,
    search: f.search,
    limit: 200,
  };
}

function matches(p: Property, f: UIFilters): boolean {
  if (f.listingType && p.listing_type !== f.listingType) return false;
  if (f.luxury && !LUXURY_TYPES.includes(p.type)) return false;
  if (!f.luxury && f.type && p.type !== f.type) return false;
  if (f.city && p.city?.toLowerCase() !== f.city.toLowerCase()) return false;
  if (f.minPrice != null && p.price < f.minPrice) return false;
  if (f.maxPrice != null && p.price > f.maxPrice) return false;
  if (f.bedrooms != null && (p.bedrooms ?? 0) < f.bedrooms) return false;
  if (f.search) {
    const hay = `${p.title} ${p.locality ?? ""} ${p.city ?? ""}`.toLowerCase();
    if (!hay.includes(f.search.toLowerCase())) return false;
  }
  return true;
}

const selectClass =
  "h-9 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function SearchView({
  initialParams,
}: {
  initialParams: Params;
}) {
  const router = useRouter();
  const [filters, setFilters] = useState<UIFilters>(() =>
    parseFilters(initialParams)
  );
  const [mobileView, setMobileView] = useState<"list" | "map">(
    initialParams.view === "map" ? "map" : "list"
  );
  const [searchAsMove, setSearchAsMove] = useState(true);
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState(initialParams.q ?? "");

  // Keep the URL in sync (shallow, no scroll).
  useEffect(() => {
    const qs = toQuery(filters);
    router.replace(qs ? `/search?${qs}` : "/search", { scroll: false });
  }, [filters, router]);

  const serverFilters = useMemo(() => toServerFilters(filters), [filters]);
  const baseQuery = useProperties(serverFilters);
  const boundsActive = searchAsMove && bounds != null;
  const boundsQuery = usePropertiesInBounds(boundsActive ? bounds : null);
  const savedIds = useSavedIds();
  const savedSet = useMemo(
    () => new Set(savedIds.data ?? []),
    [savedIds.data]
  );

  const source =
    boundsActive && boundsQuery.data ? boundsQuery.data : baseQuery.data ?? [];
  const results = useMemo(
    () => source.filter((p) => matches(p, filters)),
    [source, filters]
  );

  const loading =
    baseQuery.isLoading ||
    (boundsActive && boundsQuery.isFetching && !boundsQuery.data);

  // Debounced bounds update from the map.
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onBoundsChange = useCallback((b: MapBounds) => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => setBounds(b), 400);
  }, []);

  const patch = (p: Partial<UIFilters>) =>
    setFilters((prev) => ({ ...prev, ...p }));

  const budgets =
    filters.listingType === "rent" || filters.listingType === "lease"
      ? RENT_BUDGETS
      : BUY_BUDGETS;

  const activeCount =
    (filters.type ? 1 : 0) +
    (filters.luxury ? 1 : 0) +
    (filters.city ? 1 : 0) +
    (filters.minPrice != null ? 1 : 0) +
    (filters.maxPrice != null ? 1 : 0) +
    (filters.bedrooms != null ? 1 : 0);

  function clearAll() {
    setFilters({ listingType: filters.listingType });
    setSearchText("");
  }

  const listingTabs: { label: string; value?: ListingType }[] = [
    { label: "All" },
    { label: "Buy", value: "sell" },
    { label: "Rent", value: "rent" },
    { label: "Lease", value: "lease" },
  ];

  const map = (
    <PropertyMap
      properties={results}
      hoveredId={hoveredId}
      onBoundsChange={onBoundsChange}
      className="h-full w-full"
    />
  );

  return (
    <div className="flex h-[calc(100svh-6rem)] flex-col">
      {/* Filter bar */}
      <div className="border-b bg-background">
        <div className="container-page flex flex-wrap items-center gap-2 py-3">
          {/* Listing segmented */}
          <div className="inline-flex rounded-lg border bg-muted p-1">
            {listingTabs.map((t) => {
              const active =
                (t.value ?? undefined) === (filters.listingType ?? undefined);
              return (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => patch({ listingType: t.value })}
                  className={cn(
                    "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                    active
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              patch({ search: searchText.trim() || undefined });
            }}
            className="flex min-w-44 flex-1"
          >
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="City, locality or title…"
              aria-label="Search"
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </form>

          {/* Type */}
          <select
            aria-label="Property type"
            className={selectClass}
            value={filters.luxury ? "__luxury" : filters.type ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "__luxury") patch({ luxury: true, type: undefined });
              else
                patch({
                  luxury: false,
                  type: (v || undefined) as PropertyType | undefined,
                });
            }}
          >
            <option value="">All types</option>
            <option value="__luxury">Luxury &amp; islands</option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          {/* City */}
          <select
            aria-label="City"
            className={cn(selectClass, "hidden sm:block")}
            value={filters.city ?? ""}
            onChange={(e) => patch({ city: e.target.value || undefined })}
          >
            <option value="">All cities</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* More filters */}
          <Sheet>
            <SheetTrigger render={<Button variant="outline" size="lg" />}>
              <SlidersHorizontal />
              More
              {activeCount > 0 && (
                <span className="ml-1 rounded-full bg-brand-teal px-1.5 text-xs text-white">
                  {activeCount}
                </span>
              )}
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetTitle className="px-5 pt-5">More filters</SheetTitle>
              <div className="space-y-5 overflow-y-auto px-5 pb-5">
                <Labeled label="Min budget">
                  <select
                    className={cn(selectClass, "w-full")}
                    value={filters.minPrice ?? ""}
                    onChange={(e) =>
                      patch({
                        minPrice: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                  >
                    <option value="">No min</option>
                    {budgets.map((b) => (
                      <option key={b.label} value={b.value}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </Labeled>
                <Labeled label="Max budget">
                  <select
                    className={cn(selectClass, "w-full")}
                    value={filters.maxPrice ?? ""}
                    onChange={(e) =>
                      patch({
                        maxPrice: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                  >
                    <option value="">No max</option>
                    {budgets.map((b) => (
                      <option key={b.label} value={b.value}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </Labeled>
                <Labeled label="Bedrooms (min)">
                  <div className="flex flex-wrap gap-2">
                    {BEDROOM_OPTIONS.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() =>
                          patch({
                            bedrooms: filters.bedrooms === n ? undefined : n,
                          })
                        }
                        className={cn(
                          "h-9 min-w-12 rounded-lg border text-sm font-medium",
                          filters.bedrooms === n
                            ? "border-brand-teal bg-brand-teal text-white"
                            : "hover:bg-muted"
                        )}
                      >
                        {n}+
                      </button>
                    ))}
                  </div>
                </Labeled>
                <select
                  aria-label="City"
                  className={cn(selectClass, "w-full sm:hidden")}
                  value={filters.city ?? ""}
                  onChange={(e) => patch({ city: e.target.value || undefined })}
                >
                  <option value="">All cities</option>
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={clearAll}
                >
                  <X /> Clear filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Body */}
      <div className="relative flex min-h-0 flex-1">
        {/* List */}
        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto lg:max-w-[44%] lg:flex-none lg:basis-[44%]",
            mobileView === "map" && "hidden lg:block"
          )}
        >
          <div className="container-page py-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                {loading
                  ? "Searching…"
                  : `${results.length} ${
                      results.length === 1 ? "property" : "properties"
                    }`}
                {boundsActive && !loading && " in this area"}
              </p>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={searchAsMove}
                  onChange={(e) => {
                    setSearchAsMove(e.target.checked);
                    if (!e.target.checked) setBounds(null);
                  }}
                  className="accent-brand-teal"
                />
                Search as I move the map
              </label>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-72 animate-pulse rounded-2xl bg-muted"
                  />
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
                <p className="font-medium text-foreground">No properties found</p>
                <p className="mt-1 text-sm">
                  Try widening your filters or zooming the map out.
                </p>
                <Button variant="outline" className="mt-4" onClick={clearAll}>
                  Clear filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {results.map((p) => (
                  <div
                    key={p.id}
                    onMouseEnter={() => setHoveredId(p.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <PropertyCard
                      property={p}
                      initialSaved={savedSet.has(p.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Map (desktop always; mobile when toggled) */}
        <div
          className={cn(
            "min-h-0 flex-1",
            mobileView === "list" ? "hidden lg:block" : "block"
          )}
        >
          {map}
        </div>

        {/* Mobile list/map toggle */}
        <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center lg:hidden">
          <Button
            size="lg"
            className="pointer-events-auto shadow-lg"
            onClick={() =>
              setMobileView((v) => (v === "list" ? "map" : "list"))
            }
          >
            {mobileView === "list" ? (
              <>
                <MapIcon /> Map
              </>
            ) : (
              <>
                <List /> List
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Labeled({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </div>
  );
}
