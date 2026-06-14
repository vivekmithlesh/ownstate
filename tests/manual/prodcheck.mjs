// Live production probe against the real Supabase project using the ANON key
// (same privileges a logged-out browser has). Run:
//   node --env-file=.env.local tests/manual/prodcheck.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const sb = createClient(url, anon, { auth: { persistSession: false } });

const pass = (m) => console.log("  PASS  " + m);
const fail = (m) => console.log("  FAIL  " + m);
const info = (m) => console.log("  ..    " + m);

let activeId = null;

async function readActive() {
  console.log("\n[1] Read active listings (anon should see them)");
  const { data, error } = await sb
    .from("properties_with_coords")
    .select("id,title,status,verified,owner_id,price,lat,lng")
    .eq("status", "active")
    .limit(5);
  if (error) return fail("read error: " + error.message);
  info(`returned ${data.length} active rows`);
  if (data[0]) {
    activeId = data[0].id;
    info(`sample: "${data[0].title}" verified=${data[0].verified} price=${data[0].price}`);
    info(`coords: lat=${data[0].lat} lng=${data[0].lng}`);
    pass("anon can read active listings");
  } else {
    info("no active rows — DB may be unseeded");
  }
}

async function readInactiveLeak() {
  console.log("\n[2] RLS: anon must NOT see pending_review/inactive listings");
  const { data, error } = await sb
    .from("properties")
    .select("id,status")
    .in("status", ["pending_review", "inactive"])
    .limit(5);
  if (error) return info("query blocked/error: " + error.message);
  if (data.length === 0) pass("no non-active rows leak to anon");
  else fail(`LEAK: anon saw ${data.length} non-active rows`);
}

async function insertAsAnon() {
  console.log("\n[3] RLS: anon must NOT insert a property directly");
  const { error } = await sb.from("properties").insert({
    owner_id: "00000000-0000-0000-0000-000000000000",
    title: "HACK", type: "land", listing_type: "sell", price: 1,
  });
  if (error) pass("blocked: " + error.message);
  else fail("INSERT SUCCEEDED as anon — RLS hole");
}

async function legacyInsertRpc() {
  console.log("\n[4] HARDENING: legacy insert_property must be revoked for anon");
  const { error } = await sb.rpc("insert_property", {
    p_owner_id: "00000000-0000-0000-0000-000000000000",
    p_title: "HACK", p_type: "land", p_listing_type: "sell", p_price: 1,
    p_lat: null, p_lng: null, p_verified: true, p_status: "active",
  });
  if (error) pass("blocked: " + error.message);
  else fail("insert_property CALLABLE by anon — hardening NOT applied!");
}

async function createMyPropertyAnon() {
  console.log("\n[5] HARDENING: create_my_property must reject unauthenticated");
  const { error } = await sb.rpc("create_my_property", {
    p_title: "HACK", p_type: "land", p_listing_type: "sell", p_price: 1,
  });
  if (error) pass("blocked: " + error.message);
  else fail("create_my_property allowed an anon insert!");
}

async function selfVerifyUpdate() {
  console.log("\n[6] RLS: anon must NOT update someone's listing (verify/publish)");
  if (!activeId) return info("skipped (no active id)");
  const { data, error } = await sb
    .from("properties")
    .update({ verified: true, status: "active" })
    .eq("id", activeId)
    .select("id");
  if (error) pass("blocked: " + error.message);
  else if (!data || data.length === 0) pass("no rows updated (RLS blocked silently)");
  else fail(`UPDATED ${data.length} row(s) as anon — RLS hole`);
}

async function dealsReadLeak() {
  console.log("\n[7] RLS: anon must NOT read deals");
  const { data, error } = await sb.from("deals").select("id").limit(5);
  if (error) return pass("blocked: " + error.message);
  if (data.length === 0) pass("no deals leak to anon");
  else fail(`LEAK: anon saw ${data.length} deals`);
}

async function main() {
  console.log("PROD PROBE →", url);
  try {
    await readActive();
    await readInactiveLeak();
    await insertAsAnon();
    await legacyInsertRpc();
    await createMyPropertyAnon();
    await selfVerifyUpdate();
    await dealsReadLeak();
  } catch (e) {
    console.log("\nNETWORK/RUNTIME ERROR:", e.message);
  }
  console.log("\nDone.");
}
main();
