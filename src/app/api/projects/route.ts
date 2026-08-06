import { NextResponse, type NextRequest } from "next/server";

import { requireUser } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { getOrCreateProfile } from "@/lib/profile";

export async function GET() {
  const { user, errorResponse } = await requireUser();
  if (!user) return errorResponse;

  await getOrCreateProfile(user);

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

  return NextResponse.json({ projects });
}

export async function POST(request: NextRequest) {
  const { user, errorResponse } = await requireUser();
  if (!user) return errorResponse;

  await getOrCreateProfile(user);

  const body = await request.json().catch(() => ({}) as Record<string, unknown>);
  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : "Untitled City";

  const project = await prisma.project.create({
    data: { name, ownerId: user.id, scene: [] },
  });

  return NextResponse.json({ project }, { status: 201 });
}
