-- =============================================================================
-- OwnState — Database Schema (Postgres + PostGIS)  •  Brick 01
-- =============================================================================
-- HOW TO RUN (USER ACTION):
--   1. Supabase Dashboard → Database → Extensions → enable "postgis".
--   2. Supabase Dashboard → SQL Editor → New query → paste THIS ENTIRE FILE → RUN.
--   3. Confirm in Table Editor: profiles, properties, land_boundaries, deals,
--      saved_properties, enquiries, messages, alerts (8 app tables; PostGIS also
--      adds public.spatial_ref_sys, so the public schema shows 9 tables total).
--
-- This script is IDEMPOTENT — safe to re-run. It (re)creates tables, indexes,
-- the new-user trigger, and Row Level Security policies.
--
-- Money is stored as BIGINT in paise (₹1 = 100 paise) to avoid float errors.
-- Geography columns use SRID 4326 (WGS84 lat/lng).
-- =============================================================================

-- Extensions ------------------------------------------------------------------
create extension if not exists postgis;
create extension if not exists "pgcrypto";   -- for gen_random_uuid()

-- =============================================================================
-- 1. profiles  (1 row per auth user; created automatically via trigger)
-- =============================================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  phone       text,
  role        text not null default 'buyer'
                check (role in ('buyer','seller','agent','admin')),
  kyc_status  text not null default 'unverified'
                check (kyc_status in ('unverified','pending','verified','rejected')),
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- =============================================================================
-- 2. properties
-- =============================================================================
create table if not exists public.properties (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references public.profiles(id) on delete cascade,
  title         text not null,
  description   text,
  type          text not null
                  check (type in ('flat','house','land','commercial','villa',
                                  'penthouse','mansion','chateau','island')),
  listing_type  text not null check (listing_type in ('sell','rent','lease')),
  status        text not null default 'active'
                  check (status in ('active','pending_review','sold','rented',
                                    'leased','inactive')),
  price         bigint not null,                  -- paise
  area_sqft     numeric,
  area_unit     text not null default 'sqft',
  bedrooms      int,
  bathrooms     int,
  furnishing    text check (furnishing in
                  ('unfurnished','semi-furnished','furnished','none')),
  address       text,
  locality      text,
  city          text,
  state         text,
  country       text not null default 'India',
  pincode       text,
  location      geography(Point, 4326),
  amenities     text[] not null default '{}',
  rera_number   text,
  verified      boolean not null default false,
  cover_image   text,
  images        text[] not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- =============================================================================
-- 3. land_boundaries  (Digital Land Fencing polygons)
-- =============================================================================
create table if not exists public.land_boundaries (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references public.profiles(id) on delete cascade,
  property_id     uuid references public.properties(id) on delete set null,
  land_name       text not null,
  khasra_number   text,
  khata_number    text,
  village         text,
  tehsil          text,
  district        text,
  state           text,
  boundary        geography(Polygon, 4326) not null,
  area_acres      numeric,
  ownership_type  text,
  notes           text,
  document_urls   text[] not null default '{}',
  verified        boolean not null default false,
  created_at      timestamptz not null default now()
);

-- =============================================================================
-- 4. deals  (legal transaction pipeline / Deal Room)
-- =============================================================================
create table if not exists public.deals (
  id            uuid primary key default gen_random_uuid(),
  property_id   uuid not null references public.properties(id) on delete cascade,
  buyer_id      uuid not null references public.profiles(id) on delete cascade,
  seller_id     uuid not null references public.profiles(id) on delete cascade,
  deal_type     text not null check (deal_type in ('sell','rent','lease')),
  status        text not null default 'interested'
                  check (status in ('interested','token_paid','agreement_signed',
                                    'registered','complete','cancelled')),
  agreed_price  bigint,
  token_amount  bigint,
  token_paid_at timestamptz,
  created_at    timestamptz not null default now()
);

-- =============================================================================
-- 5. saved_properties  (user's saved/favourited listings)
-- =============================================================================
create table if not exists public.saved_properties (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, property_id)
);

-- =============================================================================
-- 6. enquiries
-- =============================================================================
create table if not exists public.enquiries (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  from_user   uuid references public.profiles(id) on delete set null,
  name        text,
  phone       text,
  message     text,
  created_at  timestamptz not null default now()
);

-- =============================================================================
-- 7. messages  (chat inside a deal)
-- =============================================================================
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  deal_id    uuid not null references public.deals(id) on delete cascade,
  sender_id  uuid not null references public.profiles(id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);

-- =============================================================================
-- 8. alerts  (saved-search alerts)
-- =============================================================================
create table if not exists public.alerts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       text,
  filters    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- =============================================================================
-- INDEXES
-- =============================================================================
-- Spatial (GIST) — power geo search & fencing
create index if not exists idx_properties_location
  on public.properties using gist (location);
create index if not exists idx_land_boundaries_boundary
  on public.land_boundaries using gist (boundary);

-- Common filter / sort paths
create index if not exists idx_properties_city_status_listing
  on public.properties (city, status, listing_type);
create index if not exists idx_properties_price
  on public.properties (price);

-- Foreign-key lookups used frequently
create index if not exists idx_properties_owner on public.properties (owner_id);
create index if not exists idx_saved_user        on public.saved_properties (user_id);
create index if not exists idx_enquiries_property on public.enquiries (property_id);
create index if not exists idx_messages_deal      on public.messages (deal_id);
create index if not exists idx_deals_buyer        on public.deals (buyer_id);
create index if not exists idx_deals_seller       on public.deals (seller_id);

-- =============================================================================
-- TRIGGER: handle_new_user → create a profiles row for every new auth user
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'phone',
    coalesce(new.raw_user_meta_data ->> 'role', 'buyer')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
alter table public.profiles         enable row level security;
alter table public.properties        enable row level security;
alter table public.land_boundaries   enable row level security;
alter table public.deals             enable row level security;
alter table public.saved_properties  enable row level security;
alter table public.enquiries         enable row level security;
alter table public.messages          enable row level security;
alter table public.alerts            enable row level security;

-- ---- profiles: anyone reads, owner updates own --------------------------------
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles
  for select using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- ---- properties: active visible to all; owner does C/U/D --------------------
drop policy if exists "properties_select_active_or_own" on public.properties;
create policy "properties_select_active_or_own" on public.properties
  for select using (status = 'active' or auth.uid() = owner_id);

drop policy if exists "properties_insert_own" on public.properties;
create policy "properties_insert_own" on public.properties
  for insert with check (auth.uid() = owner_id);

drop policy if exists "properties_update_own" on public.properties;
create policy "properties_update_own" on public.properties
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "properties_delete_own" on public.properties;
create policy "properties_delete_own" on public.properties
  for delete using (auth.uid() = owner_id);

-- ---- land_boundaries: owner-only (all operations) ---------------------------
drop policy if exists "boundaries_all_own" on public.land_boundaries;
create policy "boundaries_all_own" on public.land_boundaries
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ---- deals: buyer or seller only --------------------------------------------
drop policy if exists "deals_select_party" on public.deals;
create policy "deals_select_party" on public.deals
  for select using (auth.uid() = buyer_id or auth.uid() = seller_id);

drop policy if exists "deals_insert_buyer" on public.deals;
create policy "deals_insert_buyer" on public.deals
  for insert with check (auth.uid() = buyer_id);

drop policy if exists "deals_update_party" on public.deals;
create policy "deals_update_party" on public.deals
  for update using (auth.uid() = buyer_id or auth.uid() = seller_id)
  with check (auth.uid() = buyer_id or auth.uid() = seller_id);

-- ---- saved_properties: own only ---------------------------------------------
drop policy if exists "saved_all_own" on public.saved_properties;
create policy "saved_all_own" on public.saved_properties
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- enquiries: owner of the property reads; anyone may create --------------
drop policy if exists "enquiries_insert_any" on public.enquiries;
create policy "enquiries_insert_any" on public.enquiries
  for insert with check (true);

drop policy if exists "enquiries_select_owner" on public.enquiries;
create policy "enquiries_select_owner" on public.enquiries
  for select using (
    auth.uid() = from_user
    or auth.uid() = (select owner_id from public.properties p where p.id = property_id)
  );

-- ---- messages: only deal participants can read/send -------------------------
drop policy if exists "messages_select_party" on public.messages;
create policy "messages_select_party" on public.messages
  for select using (
    exists (
      select 1 from public.deals d
      where d.id = deal_id
        and (auth.uid() = d.buyer_id or auth.uid() = d.seller_id)
    )
  );

drop policy if exists "messages_insert_party" on public.messages;
create policy "messages_insert_party" on public.messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.deals d
      where d.id = deal_id
        and (auth.uid() = d.buyer_id or auth.uid() = d.seller_id)
    )
  );

-- ---- alerts: own only -------------------------------------------------------
drop policy if exists "alerts_all_own" on public.alerts;
create policy "alerts_all_own" on public.alerts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =============================================================================
-- DONE. Expect: 8 application tables created, RLS enabled on all, PostGIS active.
-- =============================================================================
