import { NextResponse, type NextRequest } from "next/server";

import { requireUser } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

async function loadOwnedProject(id: string, ownerId: string) {
  return prisma.project.findFirst({ where: { id, ownerId } });
}

// Creates (or returns the existing) public share link for a project.
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, errorResponse } = await requireUser();
  if (!user) return errorResponse;

  const { id } = await params;
  const project = await loadOwnedProject(id, user.id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const shareLink = await prisma.shareLink.upsert({
    where: { projectId: id },
    update: {},
    create: { projectId: id },
  });

  await prisma.project.update({ where: { id }, data: { isPublic: true } });

  return NextResponse.json({ shareLink });
}

// Revokes the share link.
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, errorResponse } = await requireUser();
  if (!user) return errorResponse;

  const { id } = await params;
  const project = await loadOwnedProject(id, user.id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.shareLink.deleteMany({ where: { projectId: id } });
  await prisma.project.update({ where: { id }, data: { isPublic: false } });

  return NextResponse.json({ ok: true });
}
