import { NextResponse, type NextRequest } from "next/server";

import { isDatabaseConfigured } from "@/lib/isDatabaseConfigured";
import { prisma } from "@/lib/prisma";

// Public — no auth. Resolves a share token to its project's read-only scene.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  if (!isDatabaseConfigured) {
    return NextResponse.json({ error: "Database is not configured on this deployment." }, { status: 501 });
  }

  const { token } = await params;

  const shareLink = await prisma.shareLink.findUnique({
    where: { token },
    include: { project: { select: { id: true, name: true, scene: true, isPublic: true } } },
  });

  if (!shareLink || !shareLink.project.isPublic) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
    return NextResponse.json({ error: "This share link has expired" }, { status: 410 });
  }

  return NextResponse.json({ project: shareLink.project });
}
