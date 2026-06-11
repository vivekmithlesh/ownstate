"use server";

// OwnState — Saved / favourited listings (Brick 05)

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { rowToProperty, type PropertyCoordRow } from "@/lib/filters";
import type { Property } from "@/types/database";

/**
 * Toggle a property in the current user's saved list.
 * Returns the new state (`true` = now saved).
 */
export async function toggleSaved(propertyId: string): Promise<boolean> {
  const user = await getUser();
  if (!user) throw new Error("Sign in to save properties.");

  const supabase = await createClient();

  const { data: existing, error: selErr } = await supabase
    .from("saved_properties")
    .select("id")
    .eq("user_id", user.id)
    .eq("property_id", propertyId)
    .maybeSingle();
  if (selErr) throw new Error(`toggleSaved: ${selErr.message}`);

  if (existing) {
    const { error } = await supabase
      .from("saved_properties")
      .delete()
      .eq("id", existing.id);
    if (error) throw new Error(`toggleSaved(remove): ${error.message}`);
    revalidatePath("/dashboard/saved");
    return false;
  }

  const { error } = await supabase
    .from("saved_properties")
    .insert({ user_id: user.id, property_id: propertyId });
  if (error) throw new Error(`toggleSaved(add): ${error.message}`);
  revalidatePath("/dashboard/saved");
  return true;
}

/** IDs of the current user's saved properties (for hydrating Save hearts). */
export async function getSavedIds(): Promise<string[]> {
  const user = await getUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("saved_properties")
    .select("property_id")
    .eq("user_id", user.id);
  if (error) throw new Error(`getSavedIds: ${error.message}`);
  return (data ?? []).map((r) => r.property_id as string);
}

/** The current user's saved properties, newest-saved first. */
export async function getSavedProperties(): Promise<Property[]> {
  const user = await getUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data: saved, error } = await supabase
    .from("saved_properties")
    .select("property_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`getSavedProperties: ${error.message}`);

  const ids = (saved ?? []).map((r) => r.property_id as string);
  if (ids.length === 0) return [];

  const { data: rows, error: propErr } = await supabase
    .from("properties_with_coords")
    .select("*")
    .in("id", ids);
  if (propErr) throw new Error(`getSavedProperties: ${propErr.message}`);

  // Preserve the saved-at order.
  const byId = new Map(
    (rows as PropertyCoordRow[]).map((r) => [r.id, rowToProperty(r)])
  );
  return ids.map((id) => byId.get(id)).filter((p): p is Property => Boolean(p));
}
