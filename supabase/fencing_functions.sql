-- =============================================================================
-- OwnState — Digital Land Fencing SQL (PostGIS polygons)  •  Brick 12
-- =============================================================================
-- HOW TO RUN (USER ACTION):
--   Supabase → SQL Editor → New query → paste THIS ENTIRE FILE → RUN.
--
-- Stores a drawn boundary as geography(Polygon,4326). We accept the polygon as
-- GeoJSON from the browser (Leaflet-Geoman), build it with ST_GeomFromGeoJSON,
-- and compute the area in acres (geography ST_Area is m²; 1 acre = 4046.86 m²).
-- Reads come back through a view that emits ST_AsGeoJSON so the map can redraw.
--
-- SECURITY INVOKER + locked search_path → the land_boundaries owner-only RLS
-- still applies. IDEMPOTENT — safe to re-run.
-- =============================================================================

create or replace function public.insert_boundary(
  p_owner_id       uuid,
  p_land_name      text,
  p_geojson        text,                  -- GeoJSON Polygon geometry
  p_khasra_number  text   default null,
  p_khata_number   text   default null,
  p_village        text   default null,
  p_tehsil         text   default null,
  p_district       text   default null,
  p_state          text   default null,
  p_ownership_type text   default null,
  p_notes          text   default null,
  p_document_urls  text[] default '{}',
  p_property_id    uuid   default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  geo    geography(Polygon, 4326);
  new_id uuid;
begin
  geo := ST_SetSRID(ST_GeomFromGeoJSON(p_geojson), 4326)::geography;

  insert into public.land_boundaries (
    owner_id, property_id, land_name, khasra_number, khata_number,
    village, tehsil, district, state, boundary, area_acres,
    ownership_type, notes, document_urls
  ) values (
    p_owner_id, p_property_id, p_land_name, p_khasra_number, p_khata_number,
    p_village, p_tehsil, p_district, p_state, geo,
    ST_Area(geo) / 4046.86,
    p_ownership_type, p_notes, coalesce(p_document_urls, '{}')
  )
  returning id into new_id;

  return new_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- VIEW: land_boundaries_geojson — boundary as GeoJSON text (for redraw)
-- ---------------------------------------------------------------------------
create or replace view public.land_boundaries_geojson
  with (security_invoker = on)
as
select
  b.id, b.owner_id, b.property_id, b.land_name, b.khasra_number, b.khata_number,
  b.village, b.tehsil, b.district, b.state, b.area_acres, b.ownership_type,
  b.notes, b.document_urls, b.verified, b.created_at,
  ST_AsGeoJSON(b.boundary::geometry) as geojson
from public.land_boundaries b;

-- =============================================================================
-- DONE. createBoundary() calls insert_boundary; getMyBoundaries() reads the view.
-- =============================================================================
