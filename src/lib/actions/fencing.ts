"use server";

// OwnState — Digital Land Fencing actions (Brick 12)
//
// createBoundary stores a drawn polygon (GeoJSON) via the insert_boundary RPC
// (PostGIS area in acres). getMyBoundaries reads them back as parsed polygons
// from the land_boundaries_geojson view.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { boundaryInputSchema, parseOrThrow } from "@/lib/validation";
import type { PolygonCoords } from "@/types/database";

export interface CreateBoundaryInput {
  landName: string;
  /** GeoJSON Polygon geometry as a string. */
  geojson: string;
  khasraNumber?: string | null;
  khataNumber?: string | null;
  village?: string | null;
  tehsil?: string | null;
  district?: string | null;
  state?: string | null;
  ownershipType?: string | null;
  notes?: string | null;
  documentUrls?: string[];
}

/** A fenced land with its polygon parsed back into [lng,lat] rings. */
export interface FencedLand {
  id: string;
  land_name: string;
  khasra_number: string | null;
  khata_number: string | null;
  village: string | null;
  tehsil: string | null;
  district: string | null;
  state: string | null;
  area_acres: number | null;
  ownership_type: string | null;
  notes: string | null;
  document_urls: string[];
  verified: boolean;
  created_at: string;
  boundary: PolygonCoords;
}

export async function createBoundary(
  input: CreateBoundaryInput
): Promise<{ id: string }> {
  const user = await getUser();
  if (!user) throw new Error("Please sign in to fence your land.");

  const v = parseOrThrow(boundaryInputSchema, input);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("insert_boundary", {
    p_owner_id: user.id,
    p_land_name: v.landName,
    p_geojson: v.geojson,
    p_khasra_number: v.khasraNumber ?? null,
    p_khata_number: v.khataNumber ?? null,
    p_village: v.village ?? null,
    p_tehsil: v.tehsil ?? null,
    p_district: v.district ?? null,
    p_state: v.state ?? null,
    p_ownership_type: v.ownershipType ?? null,
    p_notes: v.notes ?? null,
    p_document_urls: v.documentUrls ?? [],
  });
  if (error) throw new Error(`createBoundary: ${error.message}`);

  revalidatePath("/dashboard/fencing");
  return { id: data as string };
}

/** Map a land_boundaries_geojson row into a FencedLand with a parsed polygon. */
function rowToFencedLand(row: Record<string, unknown>): FencedLand {
  let boundary: PolygonCoords = [];
  try {
    const parsed = JSON.parse(row.geojson as string);
    boundary = (parsed?.coordinates ?? []) as PolygonCoords;
  } catch {
    boundary = [];
  }
  return {
    id: row.id as string,
    land_name: row.land_name as string,
    khasra_number: (row.khasra_number as string | null) ?? null,
    khata_number: (row.khata_number as string | null) ?? null,
    village: (row.village as string | null) ?? null,
    tehsil: (row.tehsil as string | null) ?? null,
    district: (row.district as string | null) ?? null,
    state: (row.state as string | null) ?? null,
    area_acres: (row.area_acres as number | null) ?? null,
    ownership_type: (row.ownership_type as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    document_urls: (row.document_urls as string[] | null) ?? [],
    verified: Boolean(row.verified),
    created_at: row.created_at as string,
    boundary,
  };
}

/** A single fenced land owned by the current user (for its details page). */
export async function getBoundaryById(id: string): Promise<FencedLand | null> {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("land_boundaries_geojson")
    .select("*")
    .eq("owner_id", user.id)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getBoundaryById: ${error.message}`);
  if (!data) return null;

  return rowToFencedLand(data);
}

export async function getMyBoundaries(): Promise<FencedLand[]> {
  const user = await getUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("land_boundaries_geojson")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`getMyBoundaries: ${error.message}`);

  return (data ?? []).map(rowToFencedLand);
}
