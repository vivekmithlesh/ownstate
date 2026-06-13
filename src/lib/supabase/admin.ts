import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. SERVER-ONLY — the `server-only` import makes the
 * build fail if this is ever pulled into a client bundle, so the service-role key
 * can never reach the browser.
 *
 * It bypasses RLS and the guard triggers (see supabase/security_hardening.sql),
 * so use it ONLY for writes that have already been authorised in trusted code —
 * e.g. marking a deal `token_paid` after a Razorpay signature has been verified.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase admin client is not configured (missing env).");
  }
  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
