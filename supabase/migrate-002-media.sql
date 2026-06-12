-- DS Labs — migration 002: prompt-first content model.
-- Run in the Supabase SQL editor AFTER deploying is ready (run SQL first, deploy
-- the new code immediately after).
--
-- What this does:
--   1. Adds `prompt` (the showcased prompt text) and `media_kind` (image|video).
--   2. Renames `video_url` → `media_url` (now holds image OR video URLs).
--   3. Backfills `prompt` from the old `sub` column (where prompts were pasted).
--   4. Drops the retired columns: cluster, type, sub, meta, url, sort.
--      (resources_cluster_idx drops automatically with `cluster`.)

alter table public.resources add column if not exists prompt text not null default '';

alter table public.resources rename column video_url to media_url;

alter table public.resources add column if not exists media_kind text not null default 'video'
  check (media_kind in ('image','video'));

-- One-time backfill: prompt text previously lived in `sub`.
update public.resources set prompt = sub where prompt = '' and sub <> '';

alter table public.resources
  drop column if exists cluster,
  drop column if exists type,
  drop column if exists sub,
  drop column if exists meta,
  drop column if exists url,
  drop column if exists sort;

-- If a row's media is actually an image, fix it manually:
--   update public.resources set media_kind = 'image' where id = '<id>';
