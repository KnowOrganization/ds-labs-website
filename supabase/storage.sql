-- DS Labs — Storage setup for the `videos` upload feature.
-- Run this AFTER schema.sql, in the Supabase SQL editor. Safe to re-run.
--
-- What this does:
--   1. Creates a PUBLIC storage bucket named `videos`.
--   2. Adds RLS policies on storage.objects scoped to that bucket:
--        - anyone can READ (public SELECT),
--        - signed-in users can INSERT / UPDATE / DELETE.

-- 1. Bucket (idempotent). `public = true` so getPublicUrl() returns a URL
--    that plays without a token. Re-running just re-asserts public = true.
insert into storage.buckets (id, name, public)
values ('videos', 'videos', true)
on conflict (id) do update set public = true;

-- 2. RLS policies on storage.objects, scoped to bucket_id = 'videos'.
--    RLS is already enabled on storage.objects by Supabase; we only add policies.

-- Public read: anyone (incl. anonymous visitors) can view/stream the videos.
drop policy if exists "videos public read" on storage.objects;
create policy "videos public read"
  on storage.objects for select
  using (bucket_id = 'videos');

-- Authenticated insert: signed-in users can upload new videos.
drop policy if exists "videos authenticated insert" on storage.objects;
create policy "videos authenticated insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'videos');

-- Authenticated update: signed-in users can overwrite/replace videos.
drop policy if exists "videos authenticated update" on storage.objects;
create policy "videos authenticated update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'videos')
  with check (bucket_id = 'videos');

-- Authenticated delete: signed-in users can remove videos.
drop policy if exists "videos authenticated delete" on storage.objects;
create policy "videos authenticated delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'videos');
