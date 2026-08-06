import { notFound } from "next/navigation";

import { NotConfiguredNotice } from "@/components/ui/NotConfiguredNotice";
import { ReadOnlyCanvas } from "@/features/editor/components/Scene/ReadOnlyCanvas";
import type { SceneObject } from "@/features/editor/types";
import { isDatabaseConfigured } from "@/lib/isDatabaseConfigured";
import { prisma } from "@/lib/prisma";

export default async function SharedProjectPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!isDatabaseConfigured) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-zinc-950 px-6">
        <NotConfiguredNotice />
      </div>
    );
  }

  const shareLink = await prisma.shareLink.findUnique({
    where: { token },
    include: { project: { select: { name: true, scene: true, isPublic: true } } },
  });

  if (!shareLink || !shareLink.project.isPublic) notFound();
  if (shareLink.expiresAt && shareLink.expiresAt < new Date()) notFound();

  const objects = Array.isArray(shareLink.project.scene) ? (shareLink.project.scene as unknown as SceneObject[]) : [];

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-zinc-950">
      <ReadOnlyCanvas objects={objects} />
      <div className="pointer-events-none absolute top-4 left-4 rounded-md border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs text-zinc-300 backdrop-blur">
        <p className="font-semibold text-zinc-100">{shareLink.project.name}</p>
        <p className="text-zinc-500">Shared from Ketema AI — read only</p>
      </div>
    </div>
  );
}
