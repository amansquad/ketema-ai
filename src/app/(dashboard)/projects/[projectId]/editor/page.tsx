import { EditorShell } from "@/features/editor/components/EditorShell";

export default async function EditorPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  // Milestone 1: the editor runs entirely client-side against local state.
  // Loading/saving `projectId` against Supabase/Prisma lands with the
  // persistence milestone (see docs/ARCHITECTURE.md).
  await params;

  return <EditorShell />;
}
