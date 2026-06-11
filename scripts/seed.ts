/**
 * OwnState — Seed Real Data  •  Brick 03
 * ---------------------------------------------------------------------------
 * Inserts 3 demo profiles (via the Supabase Auth admin API, so the
 * `handle_new_user` trigger creates their `profiles` rows) and 24 realistic
 * Indian property listings with accurate lat/lng across 10 cities + an Andaman
 * island + two luxury estates.
 *
 * PostGIS `location` points are written through the `insert_property` RPC
 * (see supabase/seed_functions.sql) — run that SQL FIRST.
 *
 * Uses the SERVICE ROLE key — server-only, never ship this to the browser.
 *
 * Run:   npx tsx scripts/seed.ts
 * (Re-runnable: existing demo users are reused, properties are replaced.)
 */

import { config } from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Load .env.local (Next.js convention) then fall back to .env.
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

// ---------------------------------------------------------------------------
// Money helpers — DB stores price as BIGINT paise (₹1 = 100 paise).
// ---------------------------------------------------------------------------
const CR = 10_000_000; // ₹1 crore
const LAKH = 100_000; // ₹1 lakh
const paise = (rupees: number) => Math.round(rupees * 100);

// ---------------------------------------------------------------------------
// Real Unsplash photos (stable photo IDs). `u()` builds a sized, optimised URL.
// ---------------------------------------------------------------------------
const u = (id: string, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

const PHOTOS = {
  flat: ["1545324418-cc1a3fa10c00", "1502672260266-1c1ef2d93688", "1493809842364-78817add7ffb"],
  flatHi: ["1600607687939-ce8a6c25118c", "1560448204-e02f11c3d0e2", "1522708323590-d24dbb6b0267"],
  house: ["1568605114967-8130f3a36994", "1570129477492-45c003edd2be", "1600585154340-be6161a56a0c"],
  villa: ["1613490493576-7fde63acd811", "1605276374104-dee2a0ed3cd6", "1512917774080-9991f1c4c750"],
  mansion: ["1600596542815-ffad4c1539a9", "1600047509807-ba8f99d2cdde", "1505691938895-1758d7feb511"],
  penthouse: ["1502005229762-cf1b2da7c5d6", "1567496898669-ee935f5f647a", "1551361415-69c87624334f"],
  commercial: ["1486406146926-c627a92ad1ab", "1497366216548-37526070297c", "1497366811353-6870744d04b2"],
  land: ["1500382017468-9049fed747ef", "1416879595882-3373a0480b5b", "1574323347407-f5e1ad6d020b"],
  island: ["1559827260-dc66d52bef19", "1523217582562-09d0def993a6", "1505228395891-9a51e7e86bf6"],
  chateau: ["1571896349842-33c89424de2d", "1564013799919-ab600027ffc6", "1600566753086-00f18fb6b3ea"],
} satisfies Record<string, string[]>;

function media(set: keyof typeof PHOTOS) {
  const ids = PHOTOS[set];
  return { cover_image: u(ids[0]), images: ids.map((id) => u(id)) };
}

// ---------------------------------------------------------------------------
// Demo owners. Created via Auth admin API → trigger makes the profiles row.
// ---------------------------------------------------------------------------
const OWNERS = [
  {
    key: "aarav",
    email: "aarav.seller@ownstate.dev",
    full_name: "Aarav Mehta",
    phone: "+919820012345",
    role: "seller" as const,
    avatar_url: u("1500648767791-00dcc994a43e", 256),
  },
  {
    key: "priya",
    email: "priya.agent@ownstate.dev",
    full_name: "Priya Sharma",
    phone: "+919811023456",
    role: "agent" as const,
    avatar_url: u("1494790108377-be9c29b29330", 256),
  },
  {
    key: "rohan",
    email: "rohan.owner@ownstate.dev",
    full_name: "Rohan Verma",
    phone: "+919833034567",
    role: "seller" as const,
    avatar_url: u("1507003211169-0a1dd7228f2d", 256),
  },
];
const SEED_PASSWORD = "OwnState#2026";

// ---------------------------------------------------------------------------
// 24 real properties. owner = OWNERS key. price = rupees (converted below).
// ---------------------------------------------------------------------------
type Seed = {
  owner: string;
  title: string;
  type:
    | "flat" | "house" | "land" | "commercial" | "villa"
    | "penthouse" | "mansion" | "chateau" | "island";
  listing_type: "sell" | "rent" | "lease";
  price: number; // rupees (sale price, or monthly rent for `rent`)
  lat: number;
  lng: number;
  description: string;
  area_sqft?: number;
  area_unit?: string;
  bedrooms?: number;
  bathrooms?: number;
  furnishing?: "unfurnished" | "semi-furnished" | "furnished";
  address?: string;
  locality?: string;
  city?: string;
  state?: string;
  pincode?: string;
  amenities?: string[];
  rera_number?: string;
  verified?: boolean;
  photos: keyof typeof PHOTOS;
};

const PROPERTIES: Seed[] = [
  // ---- Mumbai ----
  {
    owner: "aarav", title: "Sea-Facing 3BHK in Bandra West", type: "flat", listing_type: "sell",
    price: 7.2 * CR, lat: 19.0596, lng: 72.8295, area_sqft: 1450, bedrooms: 3, bathrooms: 3,
    furnishing: "semi-furnished", locality: "Bandra West", city: "Mumbai", state: "Maharashtra",
    pincode: "400050", address: "Carter Road, Bandra West", verified: true, photos: "flatHi",
    rera_number: "P51800000123",
    amenities: ["Sea View", "Gym", "Covered Parking", "24x7 Security", "Power Backup", "Lift"],
    description: "A bright, sea-facing 3BHK on Carter Road with an open kitchen, two balconies overlooking the Arabian Sea, and a premium amenity deck. Walk to Bandstand and the Bandra-Worli Sea Link.",
  },
  {
    owner: "aarav", title: "Sky Penthouse at Worli with Private Terrace", type: "penthouse", listing_type: "sell",
    price: 21 * CR, lat: 19.0176, lng: 72.8156, area_sqft: 3800, bedrooms: 4, bathrooms: 5,
    furnishing: "furnished", locality: "Worli", city: "Mumbai", state: "Maharashtra",
    pincode: "400018", address: "Dr. Annie Besant Road, Worli", verified: true, photos: "penthouse",
    rera_number: "P51800000456",
    amenities: ["Private Terrace", "Infinity Pool", "Concierge", "Smart Home", "Valet Parking", "Sea View"],
    description: "Full-floor penthouse with a 1,200 sq ft private terrace, infinity-edge plunge pool and uninterrupted views of the sea link. Imported finishes throughout, two-car private lobby.",
  },
  // ---- Delhi ----
  {
    owner: "priya", title: "Independent 5BHK House in Greater Kailash", type: "house", listing_type: "sell",
    price: 11.5 * CR, lat: 28.5494, lng: 77.2381, area_sqft: 4200, bedrooms: 5, bathrooms: 5,
    furnishing: "semi-furnished", locality: "Greater Kailash I", city: "New Delhi", state: "Delhi",
    pincode: "110048", address: "GK-I, M Block", verified: true, photos: "house",
    amenities: ["Private Garden", "Servant Quarter", "Stilt Parking", "Modular Kitchen", "Terrace"],
    description: "A south-facing independent house in GK-I with a landscaped front lawn, four parking bays and a top-floor barsati with terrace. Quiet, tree-lined street minutes from the M-Block market.",
  },
  {
    owner: "priya", title: "Grade-A Office Floor in Connaught Place", type: "commercial", listing_type: "lease",
    price: 9 * LAKH, lat: 28.6315, lng: 77.2167, area_sqft: 3200, furnishing: "furnished",
    locality: "Connaught Place", city: "New Delhi", state: "Delhi", pincode: "110001",
    address: "Inner Circle, Connaught Place", verified: true, photos: "commercial",
    amenities: ["Central AC", "Reception", "Server Room", "Metro Connectivity", "Power Backup", "Parking"],
    description: "Plug-and-play office floor on the Inner Circle — 40 workstations, four cabins, a boardroom and pantry. Direct Rajiv Chowk metro access. Monthly lease, two-year lock-in.",
  },
  // ---- Bangalore ----
  {
    owner: "rohan", title: "Modern 2BHK in Koramangala", type: "flat", listing_type: "rent",
    price: 55000, lat: 12.9352, lng: 77.6245, area_sqft: 1180, bedrooms: 2, bathrooms: 2,
    furnishing: "furnished", locality: "Koramangala 5th Block", city: "Bengaluru", state: "Karnataka",
    pincode: "560095", address: "80 Feet Road, Koramangala", verified: true, photos: "flat",
    amenities: ["Gym", "Clubhouse", "Covered Parking", "Power Backup", "Piped Gas", "Lift"],
    description: "Fully furnished 2BHK in the heart of Koramangala, steps from cafes and startups. East-facing, semi-private balcony, gated community with gym and clubhouse. Available immediately.",
  },
  {
    owner: "rohan", title: "4BHK Villa with Garden in Whitefield", type: "villa", listing_type: "sell",
    price: 4.8 * CR, lat: 12.9698, lng: 77.7500, area_sqft: 3100, bedrooms: 4, bathrooms: 4,
    furnishing: "semi-furnished", locality: "Whitefield", city: "Bengaluru", state: "Karnataka",
    pincode: "560066", address: "Whitefield Main Road", verified: true, photos: "villa",
    rera_number: "PRM/KA/RERA/1251/446/PR/000789",
    amenities: ["Private Garden", "Swimming Pool", "Clubhouse", "Gated Community", "Solar Heater", "Parking"],
    description: "Corner villa in a gated enclave near ITPL — double-height living room, private garden, two-car porch and a community pool. Close to international schools and tech parks.",
  },
  // ---- Lucknow ----
  {
    owner: "aarav", title: "Spacious 3BHK House in Gomti Nagar", type: "house", listing_type: "sell",
    price: 1.85 * CR, lat: 26.8536, lng: 81.0010, area_sqft: 2400, bedrooms: 3, bathrooms: 3,
    furnishing: "unfurnished", locality: "Gomti Nagar", city: "Lucknow", state: "Uttar Pradesh",
    pincode: "226010", address: "Vipul Khand, Gomti Nagar", verified: true, photos: "house",
    amenities: ["Car Parking", "Front Lawn", "Borewell", "Wide Road", "Park Facing"],
    description: "Park-facing independent house in Vipul Khand with three bedrooms, a pooja room and a small front lawn. Established neighbourhood with wide roads, near the Lulu Mall and metro.",
  },
  {
    owner: "priya", title: "Cosy 2BHK Flat near Hazratganj", type: "flat", listing_type: "rent",
    price: 24000, lat: 26.8467, lng: 80.9462, area_sqft: 1050, bedrooms: 2, bathrooms: 2,
    furnishing: "semi-furnished", locality: "Hazratganj", city: "Lucknow", state: "Uttar Pradesh",
    pincode: "226001", address: "Ashok Marg, Hazratganj", verified: false, photos: "flat",
    amenities: ["Lift", "Power Backup", "Covered Parking", "Security", "Water Supply"],
    description: "Well-kept 2BHK in central Lucknow within walking distance of Hazratganj market and offices. Semi-furnished with wardrobes and modular kitchen, reserved parking.",
  },
  // ---- Noida ----
  {
    owner: "rohan", title: "Premium 3BHK in Sector 150", type: "flat", listing_type: "sell",
    price: 2.6 * CR, lat: 28.4944, lng: 77.5400, area_sqft: 1875, bedrooms: 3, bathrooms: 3,
    furnishing: "unfurnished", locality: "Sector 150", city: "Noida", state: "Uttar Pradesh",
    pincode: "201310", address: "Sector 150, Noida Expressway", verified: true, photos: "flatHi",
    rera_number: "UPRERAPRJ12345",
    amenities: ["Golf Course View", "Swimming Pool", "Gym", "Clubhouse", "Sports Arena", "EV Charging"],
    description: "Low-density tower in Noida's greenest sector with 80% open area and a sports city next door. Three large bedrooms, a utility balcony and a club with pool, courts and gym.",
  },
  {
    owner: "priya", title: "IT Office Space in Sector 62", type: "commercial", listing_type: "lease",
    price: 3.5 * LAKH, lat: 28.6196, lng: 77.3649, area_sqft: 2800, furnishing: "semi-furnished",
    locality: "Sector 62", city: "Noida", state: "Uttar Pradesh", pincode: "201309",
    address: "Sector 62, Noida", verified: false, photos: "commercial",
    amenities: ["Central AC", "24x7 Access", "Power Backup", "Cafeteria", "Parking", "Metro Nearby"],
    description: "Bare-shell-plus office in a Grade-A IT tower near Electronic City metro. Efficient floor plate, dual power feed and ample basement parking. Ideal for a 60-80 seat team.",
  },
  // ---- Pune ----
  {
    owner: "aarav", title: "Luxury 2BHK in Koregaon Park", type: "flat", listing_type: "rent",
    price: 65000, lat: 18.5362, lng: 73.8939, area_sqft: 1320, bedrooms: 2, bathrooms: 2,
    furnishing: "furnished", locality: "Koregaon Park", city: "Pune", state: "Maharashtra",
    pincode: "411001", address: "North Main Road, Koregaon Park", verified: true, photos: "flat",
    amenities: ["Furnished", "Gym", "Swimming Pool", "Concierge", "Covered Parking", "Pet Friendly"],
    description: "Designer-furnished 2BHK in Pune's most cosmopolitan address, surrounded by cafes and boutiques. Concierge, pool and gym; pet-friendly building. Move-in ready.",
  },
  {
    owner: "rohan", title: "Twin-Villa in Hinjewadi Phase 1", type: "villa", listing_type: "sell",
    price: 3.2 * CR, lat: 18.5915, lng: 73.7389, area_sqft: 2650, bedrooms: 4, bathrooms: 4,
    furnishing: "semi-furnished", locality: "Hinjewadi", city: "Pune", state: "Maharashtra",
    pincode: "411057", address: "Hinjewadi Phase 1", verified: true, photos: "villa",
    rera_number: "P52100012345",
    amenities: ["Private Terrace", "Clubhouse", "Gated Community", "Kids Play Area", "Parking", "Garden"],
    description: "Four-bedroom twin villa minutes from the Rajiv Gandhi IT Park — private terrace, double car park and access to a 25,000 sq ft clubhouse. Great for IT families.",
  },
  // ---- Hyderabad ----
  {
    owner: "priya", title: "High-Rise 3BHK in Gachibowli", type: "flat", listing_type: "sell",
    price: 2.95 * CR, lat: 17.4401, lng: 78.3489, area_sqft: 1980, bedrooms: 3, bathrooms: 3,
    furnishing: "unfurnished", locality: "Gachibowli", city: "Hyderabad", state: "Telangana",
    pincode: "500032", address: "Financial District, Gachibowli", verified: true, photos: "flatHi",
    rera_number: "P02400001234",
    amenities: ["Skydeck", "Gym", "Swimming Pool", "Clubhouse", "EV Charging", "Power Backup"],
    description: "South-west facing 3BHK in a landmark high-rise beside the Financial District. Floor-to-ceiling windows, a sky deck on the 30th floor and quick access to the ORR.",
  },
  {
    owner: "aarav", title: "Designer Mansion in Jubilee Hills", type: "mansion", listing_type: "sell",
    price: 28 * CR, lat: 17.4239, lng: 78.4011, area_sqft: 8500, bedrooms: 6, bathrooms: 7,
    furnishing: "furnished", locality: "Jubilee Hills", city: "Hyderabad", state: "Telangana",
    pincode: "500033", address: "Road No. 45, Jubilee Hills", verified: true, photos: "mansion",
    amenities: ["Home Theatre", "Private Pool", "Elevator", "Landscaped Garden", "Staff Quarters", "8-Car Garage"],
    description: "A statement mansion on a 1,000 sq yd plot in Jubilee Hills — six suites, a home theatre, private pool, internal elevator and an eight-car garage. Fully furnished by a leading studio.",
  },
  // ---- Jaipur ----
  {
    owner: "rohan", title: "Heritage-Style 4BHK in Civil Lines", type: "house", listing_type: "sell",
    price: 3.1 * CR, lat: 26.8930, lng: 75.8050, area_sqft: 3600, bedrooms: 4, bathrooms: 4,
    furnishing: "semi-furnished", locality: "Civil Lines", city: "Jaipur", state: "Rajasthan",
    pincode: "302006", address: "Civil Lines, Jaipur", verified: true, photos: "house",
    amenities: ["Courtyard", "Jharokha Balconies", "Car Parking", "Garden", "Servant Room"],
    description: "Pink-city styled bungalow with carved jharokhas, an inner courtyard and a mature garden, in Jaipur's leafy Civil Lines. Spacious rooms with traditional and modern touches.",
  },
  {
    owner: "rohan", title: "Residential Plot in Vaishali Nagar", type: "land", listing_type: "sell",
    price: 95 * LAKH, lat: 26.9120, lng: 75.7430, area_sqft: 2700, area_unit: "sqft",
    locality: "Vaishali Nagar", city: "Jaipur", state: "Rajasthan", pincode: "302021",
    address: "Vaishali Nagar Extension", verified: false, photos: "land",
    amenities: ["Corner Plot", "Wide Road", "Gated Colony", "Clear Title", "Park Nearby"],
    description: "300 sq yd corner residential plot in an approved gated colony, ready for construction with clear title and all approvals. Wide 40-ft road, park around the corner.",
  },
  // ---- Chandigarh ----
  {
    owner: "priya", title: "Independent Kothi in Sector 9", type: "house", listing_type: "sell",
    price: 6.5 * CR, lat: 30.7460, lng: 76.7884, area_sqft: 5000, bedrooms: 5, bathrooms: 5,
    furnishing: "semi-furnished", locality: "Sector 9", city: "Chandigarh", state: "Chandigarh",
    pincode: "160009", address: "Sector 9-C, Chandigarh", verified: true, photos: "house",
    amenities: ["Front & Rear Lawn", "Double Garage", "Servant Quarter", "Wide Road", "Park Facing"],
    description: "A classic Chandigarh kothi on a one-kanal plot in prestigious Sector 9 — front and rear lawns, double garage and generous, light-filled rooms. Walk to Sukhna and Sector 17.",
  },
  {
    owner: "priya", title: "Retail Showroom in Sector 17", type: "commercial", listing_type: "rent",
    price: 2.2 * LAKH, lat: 30.7410, lng: 76.7822, area_sqft: 1600, furnishing: "unfurnished",
    locality: "Sector 17", city: "Chandigarh", state: "Chandigarh", pincode: "160017",
    address: "Sector 17 Plaza", verified: false, photos: "commercial",
    amenities: ["High Footfall", "Glass Frontage", "Mezzanine", "Power Backup", "Parking Plaza"],
    description: "Ground-floor showroom on the Sector 17 pedestrian plaza — Chandigarh's prime retail strip — with a wide glass frontage and a mezzanine. Heavy footfall, ready for fit-out.",
  },
  // ---- Goa ----
  {
    owner: "aarav", title: "Portuguese Villa with Pool in Anjuna", type: "villa", listing_type: "sell",
    price: 5.9 * CR, lat: 15.5736, lng: 73.7407, area_sqft: 3400, bedrooms: 4, bathrooms: 4,
    furnishing: "furnished", locality: "Anjuna", city: "North Goa", state: "Goa",
    pincode: "403509", address: "Anjuna, North Goa", verified: true, photos: "villa",
    amenities: ["Private Pool", "Sundeck", "Furnished", "Garden", "Backup Power", "Near Beach"],
    description: "Restored Indo-Portuguese villa minutes from Anjuna beach — laterite walls, a private pool and sundeck, four en-suite bedrooms and a shaded verandah. Strong holiday-rental yield.",
  },
  {
    owner: "rohan", title: "3BHK Garden House in Assagao", type: "house", listing_type: "lease",
    price: 1.1 * LAKH, lat: 15.6000, lng: 73.7600, area_sqft: 2200, bedrooms: 3, bathrooms: 3,
    furnishing: "furnished", locality: "Assagao", city: "North Goa", state: "Goa",
    pincode: "403507", address: "Assagao, Bardez", verified: false, photos: "house",
    amenities: ["Garden", "Furnished", "Open Kitchen", "Work Studio", "Parking", "Quiet Lane"],
    description: "Charming garden house in 'the Beverly Hills of Goa' — tropical garden, open kitchen and a separate work studio. Long-term lease, ideal for remote-working families.",
  },
  // ---- Andaman island ----
  {
    owner: "aarav", title: "Private Island Estate near Havelock", type: "island", listing_type: "sell",
    price: 95 * CR, lat: 12.0167, lng: 92.9833, area_sqft: 217800, area_unit: "sqft",
    locality: "Havelock (Swaraj Dweep)", city: "Andaman", state: "Andaman & Nicobar Islands",
    pincode: "744211", address: "Near Swaraj Dweep, Andaman", verified: true, photos: "island",
    amenities: ["Private Beach", "Coral Reef", "Jetty", "Off-Grid Solar", "Helipad Site", "Freshwater"],
    description: "A rare 5-acre private island fringed by white-sand beach and coral reef near Havelock — a natural jetty cove, freshwater source and approved site for an eco-resort or family retreat.",
  },
  // ---- Luxury estates ----
  {
    owner: "priya", title: "French-Style Chateau in Lonavala", type: "chateau", listing_type: "sell",
    price: 34 * CR, lat: 18.7546, lng: 73.4062, area_sqft: 12000, bedrooms: 7, bathrooms: 8,
    furnishing: "furnished", locality: "Lonavala", city: "Lonavala", state: "Maharashtra",
    pincode: "410401", address: "Tungarli, Lonavala", verified: true, photos: "chateau",
    amenities: ["Valley View", "Infinity Pool", "Wine Cellar", "Home Theatre", "Elevator", "Helipad"],
    description: "A hilltop chateau above Tungarli lake with sweeping valley views — seven suites, a wine cellar, infinity pool, home theatre and helipad. Two hours from both Mumbai and Pune.",
  },
  {
    owner: "aarav", title: "Waterfront Mansion in Alibaug", type: "mansion", listing_type: "sell",
    price: 45 * CR, lat: 18.6411, lng: 72.8722, area_sqft: 15000, bedrooms: 6, bathrooms: 7,
    furnishing: "furnished", locality: "Alibaug", city: "Alibaug", state: "Maharashtra",
    pincode: "402201", address: "Awas Beach, Alibaug", verified: true, photos: "mansion",
    amenities: ["Private Beach Access", "Infinity Pool", "Jetty", "Staff Quarters", "Orchard", "Garage"],
    description: "A sprawling waterfront mansion on Awas beach with direct sea access, an infinity pool over the sand, a mango orchard and a private jetty. The quintessential Mumbai weekend estate.",
  },
];

// ---------------------------------------------------------------------------
// Step 1 — ensure the 3 demo auth users + profiles exist.
// ---------------------------------------------------------------------------
async function ensureOwners(): Promise<Record<string, string>> {
  const ids: Record<string, string> = {};

  // One page is plenty for a handful of demo users.
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) throw listErr;
  const byEmail = new Map(list.users.map((usr) => [usr.email?.toLowerCase(), usr.id]));

  for (const owner of OWNERS) {
    let id = byEmail.get(owner.email.toLowerCase());

    if (!id) {
      const { data, error } = await admin.auth.admin.createUser({
        email: owner.email,
        password: SEED_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: owner.full_name,
          phone: owner.phone,
          role: owner.role,
        },
      });
      if (error) throw error;
      id = data.user.id;
      console.log(`  + created auth user  ${owner.email}`);
    } else {
      console.log(`  · reusing auth user  ${owner.email}`);
    }

    // Trigger created the profiles row; make sure its details are filled in.
    const { error: upErr } = await admin
      .from("profiles")
      .update({
        full_name: owner.full_name,
        phone: owner.phone,
        role: owner.role,
        avatar_url: owner.avatar_url,
        kyc_status: "verified",
      })
      .eq("id", id);
    if (upErr) throw upErr;

    ids[owner.key] = id;
  }

  return ids;
}

// ---------------------------------------------------------------------------
// Step 2 — wipe existing seed properties, then insert the 24 via RPC.
// ---------------------------------------------------------------------------
async function seedProperties(ownerIds: Record<string, string>) {
  const ownerIdList = Object.values(ownerIds);

  // Remove any prior listings owned by the demo users (idempotent re-seed).
  const { error: delErr } = await admin
    .from("properties")
    .delete()
    .in("owner_id", ownerIdList);
  if (delErr) throw delErr;

  let inserted = 0;
  for (const p of PROPERTIES) {
    const ownerId = ownerIds[p.owner];
    if (!ownerId) throw new Error(`Unknown owner key "${p.owner}" in seed data`);

    const m = media(p.photos);
    const { error } = await admin.rpc("insert_property", {
      p_owner_id: ownerId,
      p_title: p.title,
      p_type: p.type,
      p_listing_type: p.listing_type,
      p_price: paise(p.price),
      p_lat: p.lat,
      p_lng: p.lng,
      p_description: p.description,
      p_status: "active",
      p_area_sqft: p.area_sqft ?? null,
      p_area_unit: p.area_unit ?? "sqft",
      p_bedrooms: p.bedrooms ?? null,
      p_bathrooms: p.bathrooms ?? null,
      p_furnishing: p.furnishing ?? null,
      p_address: p.address ?? null,
      p_locality: p.locality ?? null,
      p_city: p.city ?? null,
      p_state: p.state ?? null,
      p_country: "India",
      p_pincode: p.pincode ?? null,
      p_amenities: p.amenities ?? [],
      p_rera_number: p.rera_number ?? null,
      p_verified: p.verified ?? false,
      p_cover_image: m.cover_image,
      p_images: m.images,
    });
    if (error) {
      console.error(`  ✗ failed: ${p.title}\n    ${error.message}`);
      throw error;
    }
    inserted++;
    console.log(`  + ${String(inserted).padStart(2, "0")}  ${p.city?.padEnd(12) ?? ""}  ${p.title}`);
  }

  return inserted;
}

// ---------------------------------------------------------------------------
// Run.
// ---------------------------------------------------------------------------
async function main() {
  console.log("\n🌱 OwnState seed — Brick 03\n");

  console.log("Owners:");
  const ownerIds = await ensureOwners();

  console.log("\nProperties:");
  const count = await seedProperties(ownerIds);

  // Summary.
  const { count: total } = await admin
    .from("properties")
    .select("*", { count: "exact", head: true });

  console.log("\n──────────────────────────────────────────────");
  console.log(`✓ ${OWNERS.length} profiles ready`);
  console.log(`✓ ${count} properties inserted (DB now has ${total ?? "?"} total)`);
  console.log(`  Demo login (any owner):  password "${SEED_PASSWORD}"`);
  OWNERS.forEach((o) => console.log(`    ${o.role.padEnd(7)} ${o.email}`));
  console.log("──────────────────────────────────────────────\n");
  console.log("Verify in Supabase → Table Editor → properties (location should NOT be null).\n");
}

main().catch((err) => {
  console.error("\n✗ Seed failed:\n", err);
  process.exit(1);
});
