import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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
      _count: { select: { pages: true } },
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

  const repo = await prisma.gitHubRepo.update({
    where: { id },
    data: {
      branch: body.branch,
      docsPath: body.docsPath,
    },
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

  // Delete associated pages first
  await prisma.page.deleteMany({
    where: { githubRepoId: id },
  });

  await prisma.gitHubRepo.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
