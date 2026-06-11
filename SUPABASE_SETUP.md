# Supabase Setup

A step-by-step guide to wire this app to your own Supabase project — including
the new **video uploads** feature. No prior Supabase experience needed.

You only need two values to run the app: a **Project URL** and an **anon key**.
Everything else below is explained as we go.

---

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in (free tier is fine).
2. Click **New project**.
3. Pick an organization, give the project a name, and set a **database
   password**. Save this password somewhere safe — you'll only need it for
   external SQL tools (see step 3), not for running the app.
4. Choose a region close to you and click **Create new project**. Provisioning
   takes a minute or two.

---

## 2. Find your keys (Settings → API)

In the dashboard, open **Settings** (gear icon) → **API**. You'll need two values:

| Dashboard label             | Env variable                     |
| --------------------------- | -------------------------------- |
| **Project URL**             | `NEXT_PUBLIC_SUPABASE_URL`        |
| **Project API keys → `anon` / `public`** | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

- The **`anon` (public) key is safe to expose in the browser.** That's by
  design — it only grants what your Row Level Security (RLS) policies allow.
- ⚠️ There is also a **`service_role`** key on the same page. **Never commit it,
  never put it in `NEXT_PUBLIC_*`, and never use it client-side.** It bypasses
  RLS entirely. This app does **not** use it.

---

## 3. Project URL vs. Postgres connection string

Supabase shows you two very different "addresses" — don't mix them up:

- **Project URL** (Settings → API) — e.g. `https://abcdefgh.supabase.co`.
  **This is what this app uses**, together with the anon key, to talk to
  Supabase over HTTPS. This is the only URL you need.

- **Postgres connection string / Database URI** (Settings → **Database** →
  **Connection string**) — a direct database login used by external SQL tools
  (psql, Drizzle, Prisma, migration runners). Its format is:

  ```
  postgresql://postgres:[PASSWORD]@db.<ref>.supabase.co:5432/postgres
  ```

  **This app does NOT use the Postgres URI.** You only need it if you choose to
  run migrations from an external tool. For this guide we run SQL straight in
  the dashboard (step 6), so you can ignore it.

---

## 4. Add your keys to `.env.local`

Copy the example file and fill in the two values from step 2:

```bash
cp .env.example .env.local
```

Then edit `.env.local`:

```bash
# Supabase — leave blank to run the site in static/offline mode.
NEXT_PUBLIC_SUPABASE_URL=https://<your-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-public-key>

# Comma-separated emails allowed into /admin (see step 5).
ADMIN_EMAILS=you@example.com
```

> **Why `NEXT_PUBLIC_`?** Next.js inlines any variable prefixed with
> `NEXT_PUBLIC_` into the browser bundle. That's intentional here — the Project
> URL and anon key are meant to be public. Keep all other secrets unprefixed.

Leaving both Supabase values blank runs the site in **static/offline mode**
(seed content only, no auth, no admin, no uploads).

---

## 5. Lock `/admin` to your email

Set `ADMIN_EMAILS` in `.env.local` to your own address so only you can manage
resources and upload videos:

```bash
ADMIN_EMAILS=you@example.com
```

- Multiple admins: comma-separate them — `a@x.com,b@y.com`.
- Leave it **empty** and *any* signed-in user can reach `/admin`. For a real
  deployment, always set this.

---

## 6. Run the SQL (schema, then storage)

In the dashboard: **SQL Editor** → **New query**. Run these two files **in
order**, pasting the full contents of each and clicking **Run**:

1. **`supabase/schema.sql`** — creates the `resources` table, its indexes, and
   RLS policies (public reads enabled rows; signed-in users manage all).
2. **`supabase/storage.sql`** — creates the public **`videos`** storage bucket
   and its RLS policies (public read; authenticated insert/update/delete).

Both scripts are **idempotent** — re-running them is safe.

---

## 7. Configure Auth (Email)

Open **Authentication** in the dashboard.

1. **Providers** → enable the **Email** provider.
2. **For fast local dev:** turn **off** *Confirm email* (under Email provider
   settings / **Sign In / Providers**). With it off, signing up logs you in
   immediately — no inbox round-trip. Re-enable it for production.
3. **URL Configuration** → set:
   - **Site URL**: `http://localhost:3000` (use your real domain in prod).
   - **Redirect URLs**: add `http://localhost:3000/**` (and your prod URL, e.g.
     `https://yourdomain.com/**`).

The app completes email-confirm / OAuth sign-in at the **`/auth/callback`**
route, so that path must be covered by the redirect URLs above.

---

## 8. Confirm the `videos` storage bucket

After running `supabase/storage.sql`, open **Storage** in the dashboard. You
should see a bucket named **`videos`** marked **Public**. If it's missing or
private, re-run `supabase/storage.sql` (step 6).

**File size limits:**

- This app rejects videos larger than **100MB** in the browser before upload
  (enforced in `src/lib/supabase/storage.ts`).
- Supabase also has its own per-file limit. To raise it: **Storage** → select
  the **`videos`** bucket → **Configuration** / **Edit bucket** → adjust the
  **file size limit**. Keep it at or above the app's 100MB if you want the full
  range allowed.

---

## 9. Run the app

```bash
npm install
npm run dev
```

Then in the browser:

1. Open `http://localhost:3000` and go to **`/signup`** to create an account
   (with *Confirm email* off, you're signed in instantly).
2. Open **`/admin`**.
3. Click **Seed prompts & videos** to populate starter resources.
4. Open a resource and **upload a video** — progress will show as it uploads,
   and the video becomes playable from its public URL.

---

## 10. Troubleshooting

| Symptom | Fix |
| ------- | --- |
| **"Could not reach resources table"** | Run `supabase/schema.sql` (step 6). The table doesn't exist yet. |
| **Upload fails with an RLS / "row-level security" error** | Run `supabase/storage.sql` (step 6) **and** make sure you're signed in — only authenticated users can upload. |
| **Blocked from `/admin`** | Your email isn't in `ADMIN_EMAILS`. Add it in `.env.local` (step 5) and restart `npm run dev`. |
| **Uploaded video won't play / 404** | Confirm the `videos` bucket is **Public** (step 8); re-run `storage.sql` if needed. |
| **Site shows only seed content, auth disabled** | `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are blank — fill them in `.env.local` (step 4) and restart. |
| **Sign-up seems to hang on confirmation** | Disable *Confirm email* for dev, or check the redirect URLs include `/auth/callback` (step 7). |

> Changes to `.env.local` require restarting `npm run dev` to take effect.
