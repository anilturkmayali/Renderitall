import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const repo = await prisma.gitHubRepo.findUnique({
    where: { id },
    include: {
      space: { select: { name: true, slug: true } },
      pages: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          githubPath: true,
          position: true,
        },
      },
    },
  });

  if (!repo) {
    return NextResponse.json({ error: "Repo not found" }, { status: 404 });
  }

  return NextResponse.json(repo);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const data: any = {};
  if (body.branch !== undefined) data.branch = body.branch;
  if (body.docsPath !== undefined) data.docsPath = body.docsPath;
  if (body.displayName !== undefined) data.displayName = body.displayName;
  if (body.slug !== undefined) data.slug = body.slug;
  if (body.homePageId !== undefined) data.homePageId = body.homePageId;
  if (body.config !== undefined) data.config = body.config as Prisma.InputJsonValue;

  const repo = await prisma.gitHubRepo.update({
    where: { id },
    data,
  });

  return NextResponse.json(repo);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await prisma.page.deleteMany({ where: { githubRepoId: id } });
  await prisma.gitHubRepo.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
