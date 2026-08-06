import "server-only";

import { prisma } from "@/lib/prisma";

// Supabase owns auth.users; our Prisma `profiles` table mirrors it lazily
// (upsert-on-first-request) rather than via a database trigger, so the app
// stays fully self-contained in code with no manual SQL setup step.
export async function getOrCreateProfile(user: { id: string; email?: string | null }) {
  return prisma.profile.upsert({
    where: { id: user.id },
    update: {},
    create: { id: user.id, email: user.email ?? "" },
  });
}
