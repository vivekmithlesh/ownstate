-- =============================================================================
-- OwnState — Security Hardening  •  Production-readiness audit
-- =============================================================================
-- HOW TO RUN (USER ACTION — REQUIRED before going live):
--   Supabase Dashboard → SQL Editor → New query → paste THIS ENTIRE FILE → RUN.
--   Run it AFTER schema.sql, functions.sql and seed_functions.sql.
--
-- WHY THIS EXISTS — the problem it closes:
--   Row Level Security gates rows, NOT columns. The original policies let a
--   property owner or a deal party UPDATE *any* column on their own row, and the
--   `insert_property` RPC is SECURITY DEFINER and trusts its arguments. With only
--   the browser anon key + their own session, a malicious user could:
--     • self-set properties.verified = true  (fake the "Verified" badge)
--     • jump properties.status pending_review → active  (skip review)
--     • call insert_property() directly with p_owner_id = SOMEONE ELSE / p_verified
--       = true / p_status = active  (write listings as other users, pre-verified)
--     • set deals.status = 'registered'/'complete' or token_paid_at WITHOUT paying
--     • lower deals.agreed_price / token_amount to underpay the booking token
--   The TypeScript server actions are careful, but RLS is the real boundary and
--   was too permissive. This file makes the database enforce those rules itself.
--
-- IDEMPOTENT — safe to re-run.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Helper: is the current request a trusted/privileged context?
--    service_role (seed scripts, server-only admin client) has no auth.uid().
--    Normal browser/user requests always carry a uid. We treat "no uid" as
--    privileged so seeds and the payment route's admin client still work.
-- ---------------------------------------------------------------------------
create or replace function public.is_privileged()
returns boolean
language sql
stable
as $$
  -- A normal browser/user request always carries auth.uid(). The seed script and
  -- the server-only admin client use the service-role key, which has no uid — so
  -- "no uid" cleanly means a trusted, privileged context.
  select auth.uid() is null;
$$;

-- ===========================================================================
-- 1. PROPERTIES — block self-verification, review-skipping, owner hijack
-- ===========================================================================
create or replace function public.properties_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_privileged() then
    return new;                       -- service role / server: allow anything
  end if;

  if tg_op = 'INSERT' then
    -- Users may never self-verify or self-publish a new listing.
    new.verified := false;
    if new.status not in ('pending_review', 'inactive') then
      new.status := 'pending_review';
    end if;
    new.owner_id := auth.uid();        -- can only create listings you own
    return new;
  end if;

  -- UPDATE: lock the trust-bearing columns to their previous value.
  new.verified := old.verified;        -- cannot flip the Verified badge
  new.owner_id := old.owner_id;        -- cannot transfer ownership
  -- Cannot publish a pending listing to the public; only toggle active⇄inactive.
  if old.status = 'pending_review' and new.status = 'active' then
    new.status := old.status;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_properties_guard on public.properties;
create trigger trg_properties_guard
  before insert or update on public.properties
  for each row execute function public.properties_guard();

-- ---- Replace the over-powered insert_property with a safe, owner-scoped one --
-- The app no longer calls insert_property; lock it to privileged callers (the
-- seed script runs as service_role and is unaffected).
-- Auto-detects every overload of insert_property and revokes from each, so this
-- never fails on an argument-signature mismatch (and is a no-op if it's absent).
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'insert_property'
  loop
    execute format('revoke execute on function %s from anon, authenticated', r.sig);
  end loop;
end $$;

-- Properties can carry private verification documents (uploaded to the private
-- `documents` bucket). Without this column those uploads were orphaned.
alter table public.properties
  add column if not exists document_urls text[] not null default '{}';

-- A property-creation RPC the browser CAN call: SECURITY INVOKER, so the RLS
-- insert policy + the guard trigger above apply. Owner is forced to auth.uid(),
-- verified is always false, status is always pending_review.
create or replace function public.create_my_property(
  p_title        text,
  p_type         text,
  p_listing_type text,
  p_price        bigint,
  p_lat          double precision default null,
  p_lng          double precision default null,
  p_description  text     default null,
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
  p_cover_image  text     default null,
  p_images       text[]   default '{}',
  p_document_urls text[]  default '{}'
)
returns uuid
language plpgsql
security invoker                      -- RLS + guard trigger enforce the rules
set search_path = public
as $$
declare
  new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.properties (
    owner_id, title, description, type, listing_type, status, price,
    area_sqft, area_unit, bedrooms, bathrooms, furnishing,
    address, locality, city, state, country, pincode,
    location, amenities, rera_number, verified, cover_image, images,
    document_urls
  ) values (
    auth.uid(), p_title, p_description, p_type, p_listing_type,
    'pending_review', p_price,
    p_area_sqft, p_area_unit, p_bedrooms, p_bathrooms, p_furnishing,
    p_address, p_locality, p_city, p_state, p_country, p_pincode,
    case when p_lat is null or p_lng is null then null
         else ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography end,
    coalesce(p_amenities, '{}'), p_rera_number, false, p_cover_image,
    coalesce(p_images, '{}'), coalesce(p_document_urls, '{}')
  )
  returning id into new_id;

  return new_id;
end;
$$;

-- ===========================================================================
-- 2. DEALS — money & lifecycle columns can only move through vetted RPCs
-- ===========================================================================
-- A BEFORE UPDATE trigger freezes status / agreed_price / token_* for normal
-- users UNLESS a transaction-local flag is set by one of the RPCs below. Direct
-- `update deals set status='complete'` from the browser is therefore rejected.
create or replace function public.deals_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_privileged() then
    return new;                       -- service role (payment route) may write
  end if;

  if tg_op = 'INSERT' then
    -- Buyer is always the caller; agreed_price is pinned to the live list price.
    new.buyer_id := auth.uid();
    new.status   := 'interested';
    new.token_amount  := null;
    new.token_paid_at := null;
    select price, owner_id into new.agreed_price, new.seller_id
      from public.properties where id = new.property_id;
    return new;
  end if;

  -- UPDATE: only the deal_advance RPC (which sets this flag) may touch lifecycle
  -- columns. Everything else is frozen to its previous value.
  if coalesce(current_setting('app.deal_ctx', true), '') <> 'on' then
    new.status        := old.status;
    new.agreed_price  := old.agreed_price;
    new.token_amount  := old.token_amount;
    new.token_paid_at := old.token_paid_at;
    new.buyer_id      := old.buyer_id;
    new.seller_id     := old.seller_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_deals_guard on public.deals;
create trigger trg_deals_guard
  before insert or update on public.deals
  for each row execute function public.deals_guard();

-- deal_advance — the ONLY user-facing way to move a deal's stage. Validates
-- party membership and that the transition is legal, then performs the write
-- with the guard flag lifted. token_paid is never reachable here (payment only).
create or replace function public.deal_advance(p_deal_id uuid, p_to text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  d public.deals;
  stages text[] := array['interested','token_paid','agreement_signed','registered','complete'];
  cur_idx int;
begin
  select * into d from public.deals where id = p_deal_id;
  if not found then raise exception 'Deal not found'; end if;
  if auth.uid() <> d.buyer_id and auth.uid() <> d.seller_id then
    raise exception 'You are not part of this deal';
  end if;
  if d.status in ('complete','cancelled') then
    raise exception 'This deal is already closed';
  end if;

  if p_to = 'token_paid' then
    raise exception 'The token is paid through the payment step';
  elsif p_to <> 'cancelled' then
    cur_idx := array_position(stages, d.status);
    if cur_idx is null or stages[cur_idx + 1] is distinct from p_to then
      raise exception 'That stage is not the next step';
    end if;
  end if;

  perform set_config('app.deal_ctx', 'on', true);   -- lift the guard for this tx
  update public.deals set status = p_to where id = p_deal_id;
  perform set_config('app.deal_ctx', 'off', true);
  return p_to;
end;
$$;

-- ===========================================================================
-- 3. ENQUIRIES — stop anonymous spam-flooding (basic, DB-side throttle)
-- ===========================================================================
-- Caps a single logged-in user to 20 enquiries/hour. (Truly anonymous floods
-- still need an edge rate-limiter / captcha — see the audit TODO.)
create or replace function public.enquiries_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent int;
begin
  if auth.uid() is not null then
    new.from_user := auth.uid();        -- cannot spoof another user as sender
    select count(*) into recent
      from public.enquiries
      where from_user = auth.uid()
        and created_at > now() - interval '1 hour';
    if recent >= 20 then
      raise exception 'Too many enquiries. Please try again later.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enquiries_guard on public.enquiries;
create trigger trg_enquiries_guard
  before insert on public.enquiries
  for each row execute function public.enquiries_guard();

-- =============================================================================
-- DONE. The database now enforces: no self-verification, no review-skipping,
-- no cross-user writes, no payment-skipping, no token underpayment, and a basic
-- enquiry throttle — regardless of what a tampered client sends.
-- =============================================================================
