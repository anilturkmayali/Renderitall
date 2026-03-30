import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const spaceId = searchParams.get("spaceId");

  const pages = await prisma.page.findMany({
    where: spaceId ? { spaceId } : undefined,
    orderBy: { position: "asc" },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      source: true,
      position: true,
      updatedAt: true,
      parentId: true,
      githubPath: true,
      space: { select: { name: true, slug: true } },
    },
  });

  return NextResponse.json(pages);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { spaceId, title, slug, content, status, parentId } = body;

  if (!spaceId || !title || !slug) {
    return NextResponse.json(
      { error: "spaceId, title, and slug are required" },
      { status: 400 }
    );
  }

  const page = await prisma.page.create({
    data: {
      spaceId,
      title,
      slug: slug.toLowerCase().replace(/[^a-z0-9-/]/g, "-"),
      content: content || "",
      status: status || "DRAFT",
      source: "NATIVE",
      parentId: parentId || null,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
    },
  });

  return NextResponse.json(page, { status: 201 });
}
