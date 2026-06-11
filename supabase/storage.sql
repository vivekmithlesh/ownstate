-- =============================================================================
-- OwnState — Storage buckets & policies  •  Brick 10
-- =============================================================================
-- USER ACTION (dashboard) — create the buckets first:
--   Supabase → Storage → New bucket:
--     • property-images   → Public  ✓
--     • documents         → Public  ✗  (keep private)
--
-- THEN run this file in the SQL Editor to add access policies. Without these,
-- uploads fail with "new row violates row-level security policy".
--
-- Path convention (set by the app): "<auth.uid()>/<filename>", so each user can
-- only write inside their own folder. IDEMPOTENT — safe to re-run.
-- =============================================================================

-- ---- property-images: anyone can READ; owners write inside their own folder ---
drop policy if exists "property_images_public_read" on storage.objects;
create policy "property_images_public_read" on storage.objects
  for select using (bucket_id = 'property-images');

drop policy if exists "property_images_insert_own" on storage.objects;
create policy "property_images_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "property_images_update_own" on storage.objects;
create policy "property_images_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "property_images_delete_own" on storage.objects;
create policy "property_images_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---- documents: PRIVATE — owner-only for every operation --------------------
drop policy if exists "documents_all_own" on storage.objects;
create policy "documents_all_own" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- =============================================================================
-- DONE. Authenticated users can now upload images (public) and documents
-- (private) under their own user-id folder.
-- =============================================================================
