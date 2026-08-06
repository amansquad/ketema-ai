// Checked before any Prisma query so an unset DATABASE_URL (e.g. this repo
// before Supabase credentials are wired in) produces a clear in-app message
// instead of a connection-error crash.
export const isDatabaseConfigured = Boolean(process.env.DATABASE_URL);
