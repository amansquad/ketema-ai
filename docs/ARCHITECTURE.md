# Ketema AI — Architecture

Ketema ("city" in Amharic) AI is a browser-based 3D Smart City Digital Twin
Builder. This document describes the module layout and the reasoning behind
it so future milestones stay consistent.

## Principles

1. **Feature-based, not layer-based.** Each domain (`editor`, `simulation`,
   `dashboard`, `ai-assistant`, `persistence`, `auth`, `i18n`, `ethiopia`,
   `assets`) owns its components, hooks, store slices, and pure logic under
   `src/features/<name>`. Cross-feature primitives live in `src/components`,
   `src/lib`, `src/hooks`.
2. **Server/client boundary is explicit.** Route handlers under
   `src/app/api/**` are the only place that touch Prisma/Supabase service-role
   credentials. Client components talk to those routes or to Supabase's
   client-side SDK (anon key, RLS-scoped) — never directly to Prisma.
3. **The 3D engine is framework-agnostic where possible.** Scene state
   (objects, transforms, selection, history) lives in a Zustand store
   (`features/editor/store`) independent of React Three Fiber, so it can be
   unit-tested and, later, reused by a headless export/simulation worker.
4. **The AI assistant never touches the scene directly.** It only produces a
   typed `SceneCommand[]` (see `features/ai-assistant/lib/commandSchema.ts`),
   which the existing undo/redo-aware `commandExecutor` applies through the
   same store actions a human editing action would use. This keeps the LLM
   provider swappable (`features/ai-assistant/lib/providers/*`) and keeps
   "AI edits" and "user edits" on one history stack.
5. **Persistence is optimistic + autosaved.** Local edits apply to the
   Zustand store immediately; a debounced autosave hook
   (`features/persistence/hooks/useAutosave`) serializes the scene graph and
   PUTs it to `/api/projects/[id]`. React Query owns server cache
   (project list, dashboard metrics) so the UI never manually manages
   loading/error state for network calls.

## Directory map

```
src/
  app/                          Next.js App Router routes only — thin,
                                 delegate to features/* for logic & UI.
    (marketing)/                Public landing page.
    (auth)/                     Supabase-auth sign-in / sign-up.
    (dashboard)/
      dashboard/                Account-level analytics across projects.
      projects/[projectId]/editor/   The 3D editor route.
    s/[token]/                  Public read-only share-link viewer.
    api/
      ai/                       POST prompt -> SceneCommand[] (provider-swappable).
      projects/                 CRUD + list (Prisma, service role).
      projects/[id]/            Get/update/delete a project; autosave target.
      share/[token]/            Resolve a public share link.
      autosave/                 Lightweight autosave endpoint.

  features/
    editor/                     Core 3D editor: canvas, controls, selection,
                                 transform gizmos, undo/redo, clipboard.
      store/                    Zustand slices: scene, selection, history.
    assets/                     Placeable asset catalog + metadata (buildings,
                                 roads, trees, utilities, civic buildings...).
    ethiopia/                   Ethiopian-specific asset set & culture pack
                                 (monuments, churches, mosques, mountains,
                                 rivers) + Amharic-flavored presets.
    simulation/                 Traffic, pedestrians, weather, day/night,
                                 energy, water, pollution heatmap engine.
    dashboard/                  Charts & KPIs (Recharts) fed by simulation +
                                 persisted project data.
    ai-assistant/                Prompt -> command pipeline, provider adapters.
    persistence/                Supabase session, project save/load, autosave,
                                 share-link hooks.
    auth/                       Supabase auth UI + hooks.
    i18n/                       en/am locale dictionaries + t() helper.

  components/ui/                 Design-system primitives (Button, Dialog...).
  components/layout/             App shell, nav, panels shared across routes.
  lib/supabase/                  Browser/server/middleware Supabase clients.
  lib/prisma.ts                  Singleton PrismaClient.
  types/                          Shared cross-feature TypeScript types.

prisma/schema.prisma              Postgres schema (Users via Supabase auth,
                                   Projects, SceneSnapshots, ShareLinks).
```

## State ownership

| State                         | Owner                                   |
|--------------------------------|------------------------------------------|
| Scene graph, selection, history| Zustand (`features/editor/store`)        |
| Simulation clock & params      | Zustand slice, driven by `useFrame`      |
| Auth session                   | Supabase client + React Query            |
| Project list / metadata        | React Query (`features/persistence`)     |
| Ephemeral UI (panels open, etc)| Local component state                    |
| Dev-only tweakables             | Leva (stripped from production bundles)  |

## Milestones

0. Scaffold, tooling, architecture (this commit).
1. Editor foundation: canvas, ground, grid, orbit/transform controls, selection store, undo/redo.
2. Asset library + drag & drop placement, instanced rendering.
3. Object property panel (transform, material, metadata, tags, color).
4. Persistence: Supabase auth, Prisma schema, project CRUD, autosave, share links.
5. Simulation engine: day/night, weather, traffic, pedestrians, energy/water/pollution.
6. Dashboard: charts & KPIs.
7. AI assistant: command schema, executor, provider abstraction, chat UI.
8. Performance pass: LOD, frustum culling, instancing audit, Suspense boundaries, Draco.
9. Accessibility & i18n: keyboard shortcuts, reduced motion, Amharic locale.
10. Ethiopian content pack: monuments, churches, mosques, terrain features.
11. Deployment: Vercel config, env docs, CI.
