import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// `dotenv/config` only auto-loads `.env` — Next.js's convention of
// `.env.local` overriding `.env` needs to be replicated by hand here since
// the Prisma CLI runs outside Next's own env loader.
config({ path: ".env" });
config({ path: ".env.local", override: true });

// Prisma 7: this file supplies the connection used by CLI commands
// (`migrate`, `db push`, `studio`). Use the *direct* (non-pooled) connection
// here — Supabase's pooled URL doesn't support the prepared statements
// Migrate relies on. The pooled DATABASE_URL is used at runtime instead, via
// the driver adapter in src/lib/prisma.ts.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Plain process.env (not the `env()` helper) so commands that don't
    // touch the database — e.g. `prisma generate` — don't hard-fail when
    // this var isn't set yet (local dev before Supabase credentials exist).
    url: process.env.DIRECT_URL ?? "",
  },
});
