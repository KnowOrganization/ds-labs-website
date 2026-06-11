-- DS Labs — resources schema. Run in the Supabase SQL editor.

create table if not exists public.resources (
  id         uuid primary key default gen_random_uuid(),
  cluster    text not null check (cluster in
               ('prompts','videos','products','notion','tools','code','vault')),
  type       text not null check (type in
               ('prompt','video','product','template','tool','code','link')),
  title      text not null,
  sub        text not null default '',
  meta       text not null default '',
  word       text not null,
  url        text,
  video_url  text,
  enabled    boolean not null default true,
  sort       integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists resources_cluster_idx on public.resources (cluster);
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
