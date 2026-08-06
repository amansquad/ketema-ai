# Deploying to Vercel

## Prerequisites

- A [Supabase](https://supabase.com) project (for auth + Postgres, or bring
  your own Postgres and skip Supabase's DB in favor of just its auth — this
  app expects Supabase Postgres by default).
- The GitHub repo pushed and connected to a [Vercel](https://vercel.com)
  project.

## 1. Import the project

From the Vercel dashboard: **Add New → Project**, import
`github.com/<you>/ketema-ai`. Vercel auto-detects Next.js — no build command
overrides are needed.

## 2. Set environment variables

In the Vercel project's **Settings → Environment Variables**, add every
variable from [.env.example](../.env.example) for both **Production** and
**Preview**:

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API — **server-only**, do not prefix with `NEXT_PUBLIC_` |
| `DATABASE_URL` | Supabase → Project Settings → Database → Connection pooling (pgbouncer, "Transaction" mode) |
| `DIRECT_URL` | Supabase → Project Settings → Database → Connection string (direct, non-pooled) — used by `prisma migrate` |
| `AI_PROVIDER` | `mock` (default, no key needed) or `anthropic` |
| `ANTHROPIC_API_KEY` | Only needed if `AI_PROVIDER=anthropic` |
| `NEXT_PUBLIC_APP_URL` | Your production URL, e.g. `https://ketema-ai.vercel.app` |

`prisma generate` runs automatically on every install via the `postinstall`
script in `package.json` — no extra Vercel build step needed for that.

## 3. Run the database migration once

Prisma migrations are **not** run automatically during the Vercel build (a
build shouldn't have write access to run schema migrations). Run it once,
locally, against the production database before the first deploy that needs
it:

```bash
DIRECT_URL="<production DIRECT_URL>" npx prisma migrate deploy
```

Re-run this any time `prisma/schema.prisma` changes.

## 4. Configure Supabase Auth redirect URLs

In Supabase → **Authentication → URL Configuration**, add your Vercel
production and preview URLs (e.g. `https://ketema-ai.vercel.app`,
`https://*.vercel.app` for previews if you want auth to work there too) to
**Redirect URLs** — otherwise sign-in redirects will fail on the deployed
site even though they work locally.

## 5. Deploy

Push to the branch Vercel is tracking (usually `main`/`master`), or run:

```bash
vercel --prod
```

## Notes

- Every persistence surface (API routes, `/dashboard`, `/s/[token]`, the
  proxy) checks `isSupabaseConfigured` / `isDatabaseConfigured` and shows a
  "not configured" state instead of crashing if you deploy before setting
  the env vars above — see `src/lib/supabase/isConfigured.ts` and
  `src/lib/isDatabaseConfigured.ts`.
- The 3D editor itself (`/projects/demo/editor`) works with **zero**
  environment variables — it's fully client-side and local-only until you
  add persistence.
- Leva and the drei `<Stats>` FPS panel are gated to
  `NODE_ENV === "development"` and are stripped from the production bundle
  by Next's dead-code elimination.
