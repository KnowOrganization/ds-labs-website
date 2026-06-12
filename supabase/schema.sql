-- DS Labs — resources schema (canonical, fresh installs). Run in the Supabase
-- SQL editor. Existing databases: run migrate-002-media.sql instead.
--
-- Each row is one "drop": a prompt + the content it generated (image or video).

create table if not exists public.resources (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  prompt     text not null default '',
  word       text not null,
  media_url  text,
  media_kind text not null default 'video' check (media_kind in ('image','video')),
  enabled    boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists resources_enabled_idx on public.resources (enabled);

-- Row Level Security: world reads only live rows; signed-in users manage all.
alter table public.resources enable row level security;

drop policy if exists "public reads live resources" on public.resources;
create policy "public reads live resources"
  on public.resources for select
  using (enabled = true);

drop policy if exists "authenticated manage resources" on public.resources;
create policy "authenticated manage resources"
  on public.resources for all
  to authenticated
  using (true)
  with check (true);
