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

  const page = await prisma.page.findUnique({
    where: { id },
    include: {
      space: { select: { name: true, slug: true } },
      githubRepo: { select: { owner: true, repo: true, branch: true } },
    },
  });

  if (!page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  return NextResponse.json(page);
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

  // Save a revision before updating (for version history)
  const currentPage = await prisma.page.findUnique({ where: { id }, select: { title: true, content: true } });
  if (currentPage && currentPage.content) {
    await prisma.revision.create({
      data: {
        pageId: id,
        title: currentPage.title,
        content: currentPage.content,
        authorId: session.user.id || undefined,
      },
    });
  }

  const page = await prisma.page.update({
    where: { id },
    data: {
      title: body.title,
      slug: body.slug,
      content: body.content,
      status: body.status,
      parentId: body.parentId,
      position: body.position,
      publishedAt:
        body.status === "PUBLISHED" ? new Date() : undefined,
    },
  });

  return NextResponse.json(page);
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

  await prisma.page.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
