/**
 * OwnState — Reset Seed Data  •  Brick 03
 * ---------------------------------------------------------------------------
 * Tears down everything the seed created so you can start clean:
 *   • deletes the demo users' listings (ON DELETE CASCADE clears the dependent
 *     deals / enquiries / saved_properties / messages / land_boundaries rows),
 *   • deletes the 3 demo auth users (their profiles row cascades away too).
 *
 * It ONLY touches the seed demo accounts — your own signed-up account and any
 * properties you list yourself are left untouched.
 *
 * Run:   npx tsx scripts/reset.ts
 */

import { config } from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

config({ path: ".env.local" });
config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "\n✗ Missing env. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local\n"
  );
  process.exit(1);
}

const admin: SupabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Must match scripts/seed.ts.
const SEED_EMAILS = [
  "aarav.seller@ownstate.dev",
  "priya.agent@ownstate.dev",
  "rohan.owner@ownstate.dev",
];

async function main() {
  console.log("\n🧹 OwnState reset — removing demo seed data\n");

  const { data: list, error: listErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) throw listErr;

  const demoUsers = list.users.filter(
    (usr) => usr.email && SEED_EMAILS.includes(usr.email.toLowerCase())
  );

  if (demoUsers.length === 0) {
    console.log("Nothing to reset — no demo users found.\n");
    return;
  }

  const ids = demoUsers.map((usr) => usr.id);

  // Delete their properties first (cascades to deals/enquiries/saved/etc.).
  const { error: propErr, count } = await admin
    .from("properties")
    .delete({ count: "exact" })
    .in("owner_id", ids);
  if (propErr) throw propErr;
  console.log(`✓ removed ${count ?? 0} demo properties`);

  // Delete the auth users (profiles row cascades on auth.users delete).
  for (const usr of demoUsers) {
    const { error } = await admin.auth.admin.deleteUser(usr.id);
    if (error) throw error;
    console.log(`✓ removed demo user  ${usr.email}`);
  }

  console.log("\nDone. Run `npx tsx scripts/seed.ts` to re-seed.\n");
}

main().catch((err) => {
  console.error("\n✗ Reset failed:\n", err);
  process.exit(1);
});
