import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET: list revisions for a page
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const revisions = await prisma.revision.findMany({
    where: { pageId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      message: true,
      createdAt: true,
      authorId: true,
    },
  });

  return NextResponse.json(revisions);
}

// POST: restore a specific revision
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { revisionId } = await req.json();

  const revision = await prisma.revision.findUnique({
    where: { id: revisionId },
  });

  if (!revision || revision.pageId !== id) {
    return NextResponse.json({ error: "Revision not found" }, { status: 404 });
  }

  // Save current state as a new revision before restoring
  const currentPage = await prisma.page.findUnique({ where: { id } });
  if (currentPage) {
    await prisma.revision.create({
      data: {
        pageId: id,
        title: currentPage.title,
        content: currentPage.content || "",
        message: "Auto-saved before restore",
        authorId: session.user.id,
      },
    });
  }

  // Restore the page to the revision's content
  await prisma.page.update({
    where: { id },
    data: {
      title: revision.title,
      content: revision.content,
    },
  });

  return NextResponse.json({ success: true });
}
