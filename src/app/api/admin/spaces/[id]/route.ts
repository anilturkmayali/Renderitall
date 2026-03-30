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

  const space = await prisma.space.findUnique({
    where: { id },
    include: {
      org: { select: { name: true } },
      githubRepos: true,
      _count: { select: { pages: true, githubRepos: true, navItems: true } },
    },
  });

  if (!space) {
    return NextResponse.json({ error: "Space not found" }, { status: 404 });
  }

  return NextResponse.json(space);
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

  const space = await prisma.space.update({
    where: { id },
    data: {
      name: body.name,
      slug: body.slug,
      description: body.description,
      isPublic: body.isPublic,
      primaryColor: body.primaryColor,
      accentColor: body.accentColor,
      defaultTheme: body.defaultTheme,
      customCss: body.customCss,
      headerLayout: body.headerLayout,
      seoTitle: body.seoTitle,
      seoDescription: body.seoDescription,
    },
  });

  return NextResponse.json(space);
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

  await prisma.space.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
