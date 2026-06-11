"use client";

// OwnState — mobile sticky action bar for the property page (Brick 09)
// Shows the price and jumps to the contact panel. Hidden on lg+.

import type { ListingType } from "@/types/database";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function MobileBar({
  price,
  listingType,
}: {
  price: number;
  listingType: ListingType;
}) {
  function goToContact() {
    document
      .getElementById("contact")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 p-3 backdrop-blur lg:hidden">
      <div className="container-page flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-brand-teal">
            {formatPrice(price, listingType)}
          </div>
          <div className="text-xs text-muted-foreground">Tap to enquire</div>
        </div>
        <Button size="lg" onClick={goToContact}>
          Enquire now
        </Button>
      </div>
    </div>
  );
}
