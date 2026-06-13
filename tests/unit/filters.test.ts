import { describe, it, expect } from "vitest";
import { rowToProperty, type PropertyCoordRow } from "@/lib/filters";

const base = {
  id: "p1",
  owner_id: "o1",
  title: "Test",
  description: null,
  type: "land",
  listing_type: "sell",
  status: "active",
  price: 100,
  area_sqft: null,
  area_unit: "sqft",
  bedrooms: null,
  bathrooms: null,
  furnishing: null,
  address: null,
  locality: null,
  city: null,
  state: null,
  country: "India",
  pincode: null,
  amenities: [],
  rera_number: null,
  verified: false,
  cover_image: null,
  images: [],
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
} as unknown as Omit<PropertyCoordRow, "lat" | "lng">;

describe("rowToProperty", () => {
  it("folds lat/lng into a location object", () => {
    const p = rowToProperty({ ...base, lat: 19.06, lng: 72.83 } as PropertyCoordRow);
    expect(p.location).toEqual({ lat: 19.06, lng: 72.83 });
  });

  it("yields a null location when coordinates are missing", () => {
    expect(rowToProperty({ ...base, lat: null, lng: null } as PropertyCoordRow).location).toBeNull();
    expect(rowToProperty({ ...base, lat: 19.06, lng: null } as PropertyCoordRow).location).toBeNull();
  });

  it("does not leak the raw lat/lng fields onto the Property", () => {
    const p = rowToProperty({ ...base, lat: 1, lng: 2 } as PropertyCoordRow);
    expect("lat" in p).toBe(false);
    expect("lng" in p).toBe(false);
  });
});
