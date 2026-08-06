# Ketema AI

**ኬተማ** ("city" in Amharic) — a browser-based 3D Smart City Digital Twin
Builder. Design city districts in an in-browser 3D editor, simulate traffic,
weather, energy and pollution, and drive edits with a natural-language AI
assistant.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the module layout and
milestone plan.

## Stack

- Next.js (App Router) + TypeScript
- React Three Fiber, @react-three/drei, @react-three/rapier (physics)
- Zustand (editor/scene state) + TanStack React Query (server state)
- Supabase (auth) + Prisma + PostgreSQL
- Tailwind CSS, Framer Motion, Leva (dev-only debug panel)

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Supabase + database values, see below
npm run prisma:migrate       # applies prisma/schema.prisma to your database
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

All variables are documented in [.env.example](.env.example). Summary:

| Variable | Purpose | Where to find it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public/browser Supabase key | Dashboard → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase key (never exposed to the client) | Dashboard → Project Settings → API |
| `DATABASE_URL` | Pooled Postgres connection string, used by the app at runtime | Dashboard → Project Settings → Database → Connection pooling |
| `DIRECT_URL` | Direct (non-pooled) Postgres connection string, used by `prisma migrate` | Dashboard → Project Settings → Database → Connection string |
| `AI_PROVIDER` | Which AI assistant provider adapter to use (`mock` default, or `anthropic`) | — |
| `ANTHROPIC_API_KEY` | Credentials for the Anthropic provider (only if `AI_PROVIDER=anthropic`) | [console.anthropic.com](https://console.anthropic.com) |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` / `npm start` | Production build / start |
| `npm run lint` | ESLint |
| `npm run format` / `format:check` | Prettier write / check |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run prisma:generate` | Regenerate the Prisma client |
| `npm run prisma:migrate` | Run Prisma migrations against `DIRECT_URL` |
| `npm run prisma:studio` | Open Prisma Studio |

## Deployment

Deployable to [Vercel](https://vercel.com). See
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full walkthrough
(environment variables, running the Prisma migration against production,
Supabase auth redirect URLs). Short version: set the environment variables
above in the Vercel project settings (Production + Preview) — Prisma's
`postinstall` hook runs `prisma generate` automatically during the Vercel
build, but `prisma migrate deploy` against `DIRECT_URL` needs to be run
manually once.

## Internationalization

The primary UI (landing page, auth, dashboard, editor toolbar/panels) is
localized in English and Amharic — see `src/features/i18n`. Switch locales
with the EN/አማ toggle in the top-right of the landing/auth pages or the
editor toolbar; the choice persists in `localStorage`.
