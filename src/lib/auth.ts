// OwnState — auth helpers (Brick 04)
//
// Small server-side helpers used by Server Components, Server Actions and Route
// Handlers to read the current user / profile and to gate protected pages.

import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

/**
 * The currently authenticated user, or `null`.
 *
 * Always uses `getUser()` (which re-validates the token with Supabase) — never
 * trust `getSession()` on the server. Wrapped in React `cache` so multiple calls
 * within one request hit Supabase only once.
 */
export const getUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/**
 * Require a logged-in user. Redirects to /auth (with a return path) if absent.
 * Use at the top of protected Server Components / pages.
 */
export async function requireUser(next = "/dashboard"): Promise<User> {
  const user = await getUser();
  if (!user) redirect(`/auth?next=${encodeURIComponent(next)}`);
  return user;
}

/** The current user's profile row, or `null` if not logged in. */
export const getMyProfile = cache(async (): Promise<Profile | null> => {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (data as Profile | null) ?? null;
});
