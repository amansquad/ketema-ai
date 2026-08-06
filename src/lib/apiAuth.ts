import "server-only";

import { NextResponse } from "next/server";

import { isDatabaseConfigured } from "@/lib/isDatabaseConfigured";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/isConfigured";

/**
 * Resolves the authenticated Supabase user for a Route Handler. Returns
 * either `{ user }` or `{ errorResponse }` — callers do
 * `if (!user) return errorResponse;` and TypeScript narrows the rest.
 * Nearly every route that needs auth also needs Prisma, so this checks both.
 */
export async function requireUser() {
  if (!isSupabaseConfigured || !isDatabaseConfigured) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: "Supabase/database environment variables are not configured on this deployment." },
        { status: 501 },
      ),
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return { user: null, errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { user: data.user, errorResponse: null };
}
