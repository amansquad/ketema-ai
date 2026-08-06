import { EditorShell } from "@/features/editor/components/EditorShell";

export default async function EditorPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  // EditorShell/useProjectSync handles both cases: a real, owned project id
  // loads and autosaves against Supabase/Prisma; anything else (no auth, no
  // DB configured, or the "demo" scratch id) runs local-only.
  return <EditorShell projectId={projectId} />;
}
