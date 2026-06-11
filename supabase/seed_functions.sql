-- =============================================================================
-- OwnState — Seed helper functions (Postgres + PostGIS)  •  Brick 03
-- =============================================================================
-- HOW TO RUN (USER ACTION):
--   Supabase Dashboard → SQL Editor → New query → paste THIS ENTIRE FILE → RUN.
--   Then, from the project root, run:  npx tsx scripts/seed.ts
--
-- Why this exists:
--   `properties.location` is a PostGIS `geography(Point, 4326)` column. You cannot
--   INSERT a point through the plain PostgREST/JS table API, so the seed script
--   calls this RPC and passes plain `p_lat` / `p_lng`. The function turns them into
--   a real geography point via ST_SetSRID(ST_MakePoint(lng, lat), 4326).
--
-- IDEMPOTENT — safe to re-run (CREATE OR REPLACE). SECURITY DEFINER + a locked
-- search_path so it inserts cleanly regardless of the caller's RLS context.
-- =============================================================================

create or replace function public.insert_property(
  p_owner_id     uuid,
  p_title        text,
  p_type         text,
  p_listing_type text,
  p_price        bigint,                 -- paise (₹1 = 100 paise)
  p_lat          double precision,
  p_lng          double precision,
  p_description  text     default null,
  p_status       text     default 'active',
  p_area_sqft    numeric  default null,
  p_area_unit    text     default 'sqft',
  p_bedrooms     int      default null,
  p_bathrooms    int      default null,
  p_furnishing   text     default null,
  p_address      text     default null,
  p_locality     text     default null,
  p_city         text     default null,
  p_state        text     default null,
  p_country      text     default 'India',
  p_pincode      text     default null,
  p_amenities    text[]   default '{}',
  p_rera_number  text     default null,
  p_verified     boolean  default false,
  p_cover_image  text     default null,
  p_images       text[]   default '{}'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  insert into public.properties (
    owner_id, title, description, type, listing_type, status, price,
    area_sqft, area_unit, bedrooms, bathrooms, furnishing,
    address, locality, city, state, country, pincode,
    location, amenities, rera_number, verified, cover_image, images
  ) values (
    p_owner_id, p_title, p_description, p_type, p_listing_type, p_status, p_price,
    p_area_sqft, p_area_unit, p_bedrooms, p_bathrooms, p_furnishing,
    p_address, p_locality, p_city, p_state, p_country, p_pincode,
    case
      when p_lat is null or p_lng is null then null
      else ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
    end,
    coalesce(p_amenities, '{}'),
    p_rera_number, p_verified, p_cover_image,
    coalesce(p_images, '{}')
  )
  returning id into new_id;

  return new_id;
end;
$$;

-- Optional convenience: read a property's lat/lng back out as plain numbers
-- (handy for sanity-checking the seed; used nowhere critical).
create or replace function public.property_lat_lng(p_property_id uuid)
returns table (lat double precision, lng double precision)
language sql
stable
security definer
set search_path = public
as $$
  select ST_Y(location::geometry), ST_X(location::geometry)
  from public.properties
  where id = p_property_id;
$$;

-- =============================================================================
-- DONE. Now run:  npx tsx scripts/seed.ts
-- =============================================================================
