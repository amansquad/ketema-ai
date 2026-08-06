import { NextResponse, type NextRequest } from "next/server";

import { requireUser } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

async function loadOwnedProject(id: string, ownerId: string) {
  return prisma.project.findFirst({ where: { id, ownerId } });
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, errorResponse } = await requireUser();
  if (!user) return errorResponse;

  const { id } = await params;
  const project = await loadOwnedProject(id, user.id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ project });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, errorResponse } = await requireUser();
  if (!user) return errorResponse;

  const { id } = await params;
  const existing = await loadOwnedProject(id, user.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}) as Record<string, unknown>);
  const data: Prisma.ProjectUpdateInput = {};

  if (typeof body.name === "string") data.name = body.name;
  if (typeof body.description === "string" || body.description === null) data.description = body.description;
  if (Array.isArray(body.scene)) data.scene = body.scene as Prisma.InputJsonValue;
  if (typeof body.isPublic === "boolean") data.isPublic = body.isPublic;
  if (typeof body.thumbnailUrl === "string" || body.thumbnailUrl === null) data.thumbnailUrl = body.thumbnailUrl;

  const project = await prisma.project.update({ where: { id }, data });
  return NextResponse.json({ project });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, errorResponse } = await requireUser();
  if (!user) return errorResponse;

  const { id } = await params;
  const existing = await loadOwnedProject(id, user.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
