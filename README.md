# DS Labs — Resource Studio

A spatial, pannable "universe" of prompts & videos from the DS Labs feed, plus a
Supabase-backed admin to manage them. Built with Next.js (App Router) + TypeScript.

The original HTML/CSS/JS design prototypes live in [`project/`](./project) for reference.

## Stack

- **Next.js 15** (App Router, server components, server actions)
- **Supabase** (`@supabase/ssr`) for auth + the `resources` table
- **three.js** + **gsap** for the spatial background and motion
- Plain CSS (ported 1:1 from the design) — no UI framework

## Features

- **Home** (`/`) — the spatial studio. Pan (drag), zoom (wheel/pinch), search,
  minimap, warp chips, per-card detail overlay (videos embed inline).
- **Auth** (`/login`, `/signup`) — email + password via Supabase.
- **Admin** (`/admin`) — protected CRUD for resources, with one-click seeding.
- **Flag system** (`src/lib/flags.ts`) — the switchboard for what ships. Only
  `prompts` + `videos` are live; flip a flag to launch the rest.

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in Supabase keys (optional)
npm run dev
```

Without Supabase keys the site runs in **static/offline mode**: the studio shows
the seed content from `src/lib/universe.ts`; auth and admin are disabled.

## Supabase setup

**New here? Follow the full walkthrough in [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md)** —
it covers keys, auth, the `videos` storage bucket for uploads, and troubleshooting.

Quick version:

1. Create a project at [supabase.com](https://supabase.com).
2. Run [`supabase/schema.sql`](./supabase/schema.sql) **then**
   [`supabase/storage.sql`](./supabase/storage.sql) in the SQL editor
   (the second sets up the public `videos` bucket for video uploads).
3. Put the project URL + anon key in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ADMIN_EMAILS=you@example.com   # optional allow-list; empty = any signed-in user
   ```
4. Sign up at `/signup`, open `/admin`, hit **Seed prompts & videos**, then
   upload a video on a resource.

> For a smoother dev loop, disable "Confirm email" in Supabase Auth settings so
> sign-up logs you straight in.

## Feature flags

`src/lib/flags.ts` is the single source of truth. Defaults ship `prompts` +
`videos` and hide everything else. Override per-environment without code edits:

```
NEXT_PUBLIC_FLAG_CLUSTER_PRODUCTS=true
NEXT_PUBLIC_FLAG_MINIMAP=false
```

The data layer (`src/lib/data.ts`) filters clusters by flag, so a disabled
cluster never reaches the client.

## Project structure

```
src/
  app/
    page.tsx              home (spatial studio)
    (auth)/login,signup   auth pages
    auth/callback         email-confirm / OAuth code exchange
    admin/                protected dashboard + server actions
  components/
    studio/               engine.ts, background.ts, Studio.tsx
    auth/ , admin/        client UI
  lib/
    flags.ts              feature switchboard
    universe.ts           static seed content + cluster scaffold
    data.ts               static + Supabase merge
    supabase/             browser/server/middleware clients
    types.ts , auth.ts
supabase/schema.sql       resources table + RLS
project/                  original design prototypes (reference)
```
