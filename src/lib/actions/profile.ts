"use server";

// OwnState — Profile server actions (Brick 05)

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser, getMyProfile } from "@/lib/auth";
import type { Profile, UserRole } from "@/types/database";

export { getMyProfile };

export interface UpdateProfileInput {
  full_name?: string | null;
  phone?: string | null;
  role?: UserRole;
  avatar_url?: string | null;
}

/** Update the current user's profile (RLS limits this to their own row). */
export async function updateProfile(
  input: UpdateProfileInput
): Promise<Profile> {
  const user = await getUser();
  if (!user) throw new Error("You must be signed in.");

  const patch: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) patch[key] = value;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", user.id)
    .select("*")
    .single();
  if (error) throw new Error(`updateProfile: ${error.message}`);

  revalidatePath("/dashboard");
  return data as Profile;
}
