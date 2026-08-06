import { redirect } from "next/navigation";

import { NotConfiguredNotice } from "@/components/ui/NotConfiguredNotice";
import { SignOutButton } from "@/features/auth/components/SignOutButton";
import { ProjectList } from "@/features/persistence/components/ProjectList";
import type { ProjectSummary } from "@/features/persistence/hooks/useProjects";
import { isDatabaseConfigured } from "@/lib/isDatabaseConfigured";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/isConfigured";

export default async function DashboardPage() {
  if (!isSupabaseConfigured || !isDatabaseConfigured) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-zinc-950 px-6">
        <NotConfiguredNotice />
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const projects = await prisma.project.findMany({
    where: { ownerId: user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      thumbnailUrl: true,
      isPublic: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const initialProjects: ProjectSummary[] = projects.map((project) => ({
    ...project,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  }));

  return (
    <div className="min-h-dvh bg-zinc-950">
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-3">
        <p className="font-mono text-xs tracking-widest text-emerald-400 uppercase">Ketema AI</p>
        <SignOutButton />
      </header>
      <ProjectList initialProjects={initialProjects} />
    </div>
  );
}
