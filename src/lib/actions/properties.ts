"use server";

// OwnState — Property server actions (Brick 05)
//
// Reads go through the `properties_with_coords` view (lat/lng as plain numbers)
// and the PostGIS RPCs in supabase/functions.sql. Writes use insert_property /
// set_property_location and revalidate the affected routes.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import {
  rowToProperty,
  type CreatePropertyInput,
  type MapBounds,
  type PropertyCoordRow,
  type PropertyFilters,
  type UpdatePropertyInput,
} from "@/lib/filters";
import type { Profile, Property, PropertyWithOwner } from "@/types/database";

const VIEW = "properties_with_coords";

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/** List properties matching `filters` (defaults to active listings). */
export async function getProperties(
  filters: PropertyFilters = {}
): Promise<Property[]> {
  const supabase = await createClient();
  let query = supabase.from(VIEW).select("*");

  query = query.eq("status", filters.status ?? "active");
  if (filters.type) query = query.eq("type", filters.type);
  if (filters.listingType) query = query.eq("listing_type", filters.listingType);
  if (filters.city) query = query.ilike("city", filters.city);
  if (filters.verified != null) query = query.eq("verified", filters.verified);
  if (filters.bedrooms != null) query = query.gte("bedrooms", filters.bedrooms);
  if (filters.minPrice != null) query = query.gte("price", filters.minPrice);
  if (filters.maxPrice != null) query = query.lte("price", filters.maxPrice);
  if (filters.search) {
    const q = `%${filters.search}%`;
    query = query.or(`title.ilike.${q},locality.ilike.${q},city.ilike.${q}`);
  }

  switch (filters.sort) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  if (filters.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(`getProperties: ${error.message}`);
  return (data as PropertyCoordRow[]).map(rowToProperty);
}

/** Every property owned by the current user (any status), newest first. */
export async function getMyProperties(): Promise<Property[]> {
  const user = await getUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from(VIEW)
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`getMyProperties: ${error.message}`);
  return (data as PropertyCoordRow[]).map(rowToProperty);
}

/** Active properties whose point falls inside the given map viewport. */
export async function getPropertiesInBounds(
  bounds: MapBounds,
  limit = 300
): Promise<Property[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("properties_in_bounds", {
    min_lat: bounds.minLat,
    min_lng: bounds.minLng,
    max_lat: bounds.maxLat,
    max_lng: bounds.maxLng,
    p_limit: limit,
  });
  if (error) throw new Error(`getPropertiesInBounds: ${error.message}`);
  return (data as PropertyCoordRow[]).map(rowToProperty);
}

/** Active properties within `radiusKm` of a point, nearest first. */
export async function getPropertiesNearby(
  lat: number,
  lng: number,
  radiusKm = 5,
  limit = 50
): Promise<Property[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("properties_nearby", {
    p_lat: lat,
    p_lng: lng,
    radius_km: radiusKm,
    p_limit: limit,
  });
  if (error) throw new Error(`getPropertiesNearby: ${error.message}`);
  return (data as PropertyCoordRow[]).map(rowToProperty);
}

/** A single property joined with its owner's profile (for the detail page). */
export async function getPropertyById(
  id: string
): Promise<PropertyWithOwner | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from(VIEW)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getPropertyById: ${error.message}`);
  if (!data) return null;

  const property = rowToProperty(data as PropertyCoordRow);

  const { data: owner } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", property.owner_id)
    .maybeSingle();

  return { ...property, owner: (owner as Profile) ?? ({} as Profile) };
}

/** Map of property type → active count (for "Browse by type"). */
export async function getPropertyCountsByType(): Promise<
  Record<string, number>
> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("property_counts_by_type");
  if (error) throw new Error(`getPropertyCountsByType: ${error.message}`);

  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as { type: string; count: number }[]) {
    counts[row.type] = Number(row.count);
  }
  return counts;
}

// ---------------------------------------------------------------------------
// Writes (owner-only; require an authenticated user)
// ---------------------------------------------------------------------------

/** Create a listing owned by the current user. Starts as `pending_review`. */
export async function createProperty(
  input: CreatePropertyInput
): Promise<{ id: string }> {
  const user = await getUser();
  if (!user) throw new Error("You must be signed in to list a property.");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("insert_property", {
    p_owner_id: user.id,
    p_title: input.title,
    p_type: input.type,
    p_listing_type: input.listing_type,
    p_price: input.price,
    p_lat: input.lat ?? null,
    p_lng: input.lng ?? null,
    p_description: input.description ?? null,
    p_status: "pending_review",
    p_area_sqft: input.area_sqft ?? null,
    p_area_unit: input.area_unit ?? "sqft",
    p_bedrooms: input.bedrooms ?? null,
    p_bathrooms: input.bathrooms ?? null,
    p_furnishing: input.furnishing ?? null,
    p_address: input.address ?? null,
    p_locality: input.locality ?? null,
    p_city: input.city ?? null,
    p_state: input.state ?? null,
    p_country: input.country ?? "India",
    p_pincode: input.pincode ?? null,
    p_amenities: input.amenities ?? [],
    p_rera_number: input.rera_number ?? null,
    p_verified: false,
    p_cover_image: input.cover_image ?? null,
    p_images: input.images ?? [],
  });
  if (error) throw new Error(`createProperty: ${error.message}`);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/my-properties");
  revalidatePath("/search");
  return { id: data as string };
}

/** Update a listing the current user owns (RLS enforces ownership). */
export async function updateProperty(
  id: string,
  input: UpdatePropertyInput
): Promise<void> {
  const user = await getUser();
  if (!user) throw new Error("You must be signed in.");

  const { lat, lng, ...rest } = input;
  const supabase = await createClient();

  // Scalar columns (only those actually provided).
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const [key, value] of Object.entries(rest)) {
    if (value !== undefined) patch[key] = value;
  }
  if (Object.keys(patch).length > 1) {
    const { error } = await supabase
      .from("properties")
      .update(patch)
      .eq("id", id);
    if (error) throw new Error(`updateProperty: ${error.message}`);
  }

  // Geography point (separate RPC because it isn't a plain column).
  if (lat !== undefined || lng !== undefined) {
    const { error } = await supabase.rpc("set_property_location", {
      p_property_id: id,
      p_lat: lat ?? null,
      p_lng: lng ?? null,
    });
    if (error) throw new Error(`updateProperty(location): ${error.message}`);
  }

  revalidatePath(`/property/${id}`);
  revalidatePath("/dashboard/my-properties");
  revalidatePath("/search");
}

/** Delete a listing the current user owns (RLS enforces ownership). */
export async function deleteProperty(id: string): Promise<void> {
  const user = await getUser();
  if (!user) throw new Error("You must be signed in.");

  const supabase = await createClient();
  const { error } = await supabase.from("properties").delete().eq("id", id);
  if (error) throw new Error(`deleteProperty: ${error.message}`);

  revalidatePath("/dashboard/my-properties");
  revalidatePath("/search");
}
