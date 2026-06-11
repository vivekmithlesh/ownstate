import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import {
  Building2,
  Home,
  LandPlot,
  Building,
  Hotel,
  Warehouse,
  Castle,
  TreePalm,
  type LucideIcon,
} from "lucide-react"

import type { ListingType, PropertyType } from "@/types/database"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a price stored in paise (₹1 = 100 paise) as an Indian-style string.
 * Sale prices are abbreviated (₹7.2 Cr, ₹95 L); rent/lease show the monthly
 * amount in full with a /mo suffix.
 */
export function formatPrice(paise: number, listingType?: ListingType): string {
  const rupees = Math.round(paise / 100)

  if (listingType === "rent" || listingType === "lease") {
    return `₹${rupees.toLocaleString("en-IN")}/mo`
  }

  if (rupees >= 1_00_00_000) {
    return `₹${trim(rupees / 1_00_00_000)} Cr`
  }
  if (rupees >= 1_00_000) {
    return `₹${trim(rupees / 1_00_000)} L`
  }
  return `₹${rupees.toLocaleString("en-IN")}`
}

/** Round to at most two decimals and drop trailing zeros (1.20 → "1.2", 7 → "7"). */
function trim(n: number): string {
  return Number(n.toFixed(2)).toLocaleString("en-IN")
}

/**
 * The booking-token amount (in paise) for a deal of a given price.
 * 1% of the agreed price, clamped to ₹1,000–₹5,00,000 and rounded to whole
 * rupees. Deterministic so the deal page and the payment route agree.
 */
export function computeTokenPaise(pricePaise: number): number {
  const onePercent = Math.round(pricePaise * 0.01)
  const clamped = Math.min(Math.max(onePercent, 100_000), 50_000_000)
  return Math.round(clamped / 100) * 100
}

/** Format an area value with its unit (e.g. 1450 → "1,450 sq ft"). */
export function formatArea(
  value: number | null | undefined,
  unit: string = "sqft"
): string | null {
  if (value == null) return null
  const label = unit === "sqft" ? "sq ft" : unit
  return `${value.toLocaleString("en-IN")} ${label}`
}

const PROPERTY_ICONS: Record<PropertyType, LucideIcon> = {
  flat: Building2,
  house: Home,
  land: LandPlot,
  commercial: Building,
  villa: Hotel,
  penthouse: Building2,
  mansion: Castle,
  chateau: Castle,
  island: TreePalm,
}

/** The lucide icon component for a property type. */
export function getPropertyIcon(type: PropertyType): LucideIcon {
  return PROPERTY_ICONS[type] ?? Warehouse
}
