-- =============================================================================
-- OwnState — Data-layer SQL (views + PostGIS RPCs)  •  Brick 05
-- =============================================================================
-- HOW TO RUN (USER ACTION):
--   Supabase Dashboard → SQL Editor → New query → paste THIS ENTIRE FILE → RUN.
--
-- Why this exists:
--   PostgREST returns a PostGIS `geography` column as opaque WKB, not lat/lng.
--   So instead of selecting `location` directly, the app reads from the
--   `properties_with_coords` VIEW, which exposes `lat` / `lng` as plain numbers.
--   Spatial queries (map bounds, radius) run through the RPCs below.
--
-- SECURITY: the view and RPCs use SECURITY INVOKER + a locked search_path, so
-- the existing Row Level Security on `properties` still applies (anyone sees
-- `active`; owners also see their own). IDEMPOTENT — safe to re-run.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- VIEW: properties_with_coords  (every property column + lat/lng numbers)
-- ---------------------------------------------------------------------------
create or replace view public.properties_with_coords
  with (security_invoker = on)
as
select
  p.id, p.owner_id, p.title, p.description, p.type, p.listing_type, p.status,
  p.price, p.area_sqft, p.area_unit, p.bedrooms, p.bathrooms, p.furnishing,
  p.address, p.locality, p.city, p.state, p.country, p.pincode,
  p.amenities, p.rera_number, p.verified, p.cover_image, p.images,
  p.created_at, p.updated_at,
  ST_Y(p.location::geometry) as lat,
  ST_X(p.location::geometry) as lng
from public.properties p;

-- ---------------------------------------------------------------------------
-- RPC: properties_in_bounds — properties inside a map viewport (ST_Within)
-- ---------------------------------------------------------------------------
create or replace function public.properties_in_bounds(
  min_lat double precision,
  min_lng double precision,
  max_lat double precision,
  max_lng double precision,
  p_limit int default 300
)
returns setof public.properties_with_coords
language sql
stable
security invoker
set search_path = public
as $$
  select v.*
  from public.properties_with_coords v
  join public.properties p on p.id = v.id
  where p.status = 'active'
    and p.location is not null
    and ST_Within(
      p.location::geometry,
      ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)
    )
  order by p.created_at desc
  limit p_limit;
$$;

-- ---------------------------------------------------------------------------
-- RPC: properties_nearby — within `radius_km` of a point (ST_DWithin)
-- ---------------------------------------------------------------------------
create or replace function public.properties_nearby(
  p_lat double precision,
  p_lng double precision,
  radius_km double precision default 5,
  p_limit int default 50
)
returns setof public.properties_with_coords
language sql
stable
security invoker
set search_path = public
as $$
  select v.*
  from public.properties_with_coords v
  join public.properties p on p.id = v.id
  where p.status = 'active'
    and p.location is not null
    and ST_DWithin(
      p.location,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
      radius_km * 1000.0
    )
  order by p.location <-> ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
  limit p_limit;
$$;

-- ---------------------------------------------------------------------------
-- RPC: property_counts_by_type — counts of active listings per type
-- ---------------------------------------------------------------------------
create or replace function public.property_counts_by_type()
returns table (type text, count bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select p.type, count(*)::bigint
  from public.properties p
  where p.status = 'active'
  group by p.type
  order by count(*) desc;
$$;

-- ---------------------------------------------------------------------------
-- RPC: set_property_location — update a property's point (used by updateProperty)
-- SECURITY INVOKER, so RLS limits this to the property's owner.
-- ---------------------------------------------------------------------------
create or replace function public.set_property_location(
  p_property_id uuid,
  p_lat double precision,
  p_lng double precision
)
returns void
language sql
security invoker
set search_path = public
as $$
  update public.properties
     set location = case
           when p_lat is null or p_lng is null then null
           else ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
         end,
         updated_at = now()
   where id = p_property_id;
$$;

-- =============================================================================
-- DONE. The app reads `properties_with_coords` and calls the RPCs above.
-- (createProperty reuses `insert_property` from supabase/seed_functions.sql.)
-- =============================================================================
