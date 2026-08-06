// Checked before any Supabase client is constructed so unset env vars (e.g.
// this repo before Supabase credentials are wired in) produce a clear
// in-app message instead of a runtime crash inside the Supabase SDK.
export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
