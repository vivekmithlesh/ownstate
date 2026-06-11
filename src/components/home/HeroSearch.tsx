"use client";

// OwnState — Hero search bar (Brick 07)
// Listing-type tabs + query input → navigates to /search with params.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LISTING_TYPES } from "@/lib/constants";
import type { ListingType } from "@/types/database";

export function HeroSearch() {
  const router = useRouter();
  const [listing, setListing] = useState<ListingType>("sell");
  const [q, setQ] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({ listing });
    if (q.trim()) params.set("q", q.trim());
    router.push(`/search?${params.toString()}`);
  }

  return (
    <div className="w-full max-w-2xl">
      {/* Listing tabs */}
      <div className="mb-3 inline-flex rounded-full bg-white/10 p-1 backdrop-blur">
        {LISTING_TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setListing(t.value)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              listing === t.value
                ? "bg-white text-brand-dark"
                : "text-brand-light/80 hover:text-white"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <form
        onSubmit={submit}
        className="flex items-center gap-2 rounded-2xl bg-white/95 p-2 shadow-xl ring-1 ring-white/20 backdrop-blur"
      >
        <div className="flex flex-1 items-center gap-2 pl-2">
          <MapPin className="size-5 shrink-0 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search city, locality or property…"
            aria-label="Search properties"
            className="h-10 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        <Button type="submit" size="lg" className="h-11 px-5">
          <Search /> Search
        </Button>
      </form>
    </div>
  );
}
