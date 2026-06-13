// OwnState — data-layer filter & input shapes (Brick 05)
//
// Plain module (no "use server") so types and small pure helpers can be shared
// between server actions and client components / React Query hooks.

import type {
  ListingType,
  Property,
  PropertyStatus,
  PropertyType,
} from "@/types/database";

/** Filters accepted by getProperties / useProperties. */
export interface PropertyFilters {
  /** Defaults to "active". */
  status?: PropertyStatus;
  type?: PropertyType;
  listingType?: ListingType;
  city?: string;
  /** Minimum number of bedrooms. */
  bedrooms?: number;
  /** Prices are in paise. */
  minPrice?: number;
  maxPrice?: number;
  verified?: boolean;
  /** Free-text match against title / locality / city. */
  search?: string;
  limit?: number;
  sort?: "newest" | "price_asc" | "price_desc";
}

/** A map viewport (WGS84 degrees). */
export interface MapBounds {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
}

/** Fields accepted when creating a listing. */
export interface CreatePropertyInput {
  title: string;
  description?: string | null;
  type: PropertyType;
  listing_type: ListingType;
  price: number; // paise
  lat?: number | null;
  lng?: number | null;
  area_sqft?: number | null;
  area_unit?: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  furnishing?: Property["furnishing"];
  address?: string | null;
  locality?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string;
  pincode?: string | null;
  amenities?: string[];
  rera_number?: string | null;
  cover_image?: string | null;
  images?: string[];
  /** Private verification documents (storage paths in the `documents` bucket). */
  documentUrls?: string[];
}

/** Fields accepted when updating a listing (all optional). */
export type UpdatePropertyInput = Partial<CreatePropertyInput>;

/**
 * A row from the `properties_with_coords` view: every Property column except
 * `location`, plus separate `lat` / `lng` numbers.
 */
export type PropertyCoordRow = Omit<Property, "location"> & {
  lat: number | null;
  lng: number | null;
};

/** Fold the view's lat/lng columns back into a `location: {lat,lng}` Property. */
export function rowToProperty(row: PropertyCoordRow): Property {
  const { lat, lng, ...rest } = row;
  return {
    ...rest,
    location: lat != null && lng != null ? { lat, lng } : null,
  };
}
