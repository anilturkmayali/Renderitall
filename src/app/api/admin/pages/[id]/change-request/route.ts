import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET: list change requests for a page
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const changeRequests = await prisma.changeRequest.findMany({
    where: { pages: { some: { pageId: id } } },
    orderBy: { createdAt: "desc" },
    include: {
      pages: { where: { pageId: id }, select: { draftTitle: true, draftContent: true } },
    },
  });

  return NextResponse.json(changeRequests);
}

// POST: create a change request (draft edit)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { title, draftTitle, draftContent } = await req.json();

  const page = await prisma.page.findUnique({
    where: { id },
    select: { spaceId: true, title: true },
  });
  if (!page) return NextResponse.json({ error: "Page not found" }, { status: 404 });

  const cr = await prisma.changeRequest.create({
    data: {
      spaceId: page.spaceId,
      title: title || `Edit: ${page.title}`,
      authorId: session.user.id!,
      status: "OPEN",
      pages: {
        create: {
          pageId: id,
          draftTitle: draftTitle || page.title,
          draftContent: draftContent || "",
        },
      },
    },
  });

  return NextResponse.json(cr, { status: 201 });
}

// PUT: publish a change request (apply the draft)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { changeRequestId } = await req.json();

  const cr = await prisma.changeRequest.findUnique({
    where: { id: changeRequestId },
    include: { pages: true },
  });

  if (!cr) return NextResponse.json({ error: "Change request not found" }, { status: 404 });

  // Apply each draft page
  for (const crPage of cr.pages) {
    // Save current as revision
    const current = await prisma.page.findUnique({ where: { id: crPage.pageId }, select: { title: true, content: true } });
    if (current?.content) {
      await prisma.revision.create({
        data: { pageId: crPage.pageId, title: current.title, content: current.content, message: `Before change request: ${cr.title}`, authorId: session.user.id },
      });
    }

    // Apply draft
    await prisma.page.update({
      where: { id: crPage.pageId },
      data: { title: crPage.draftTitle, content: crPage.draftContent },
    });
  }

  // Mark as published
  await prisma.changeRequest.update({
    where: { id: changeRequestId },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
