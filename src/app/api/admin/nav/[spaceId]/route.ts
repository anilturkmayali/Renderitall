import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { spaceId } = await params;

  const navItems = await prisma.navItem.findMany({
    where: { spaceId },
    orderBy: { position: "asc" },
    include: {
      children: {
        orderBy: { position: "asc" },
        include: {
          children: {
            orderBy: { position: "asc" },
          },
        },
      },
    },
  });

  // Return only top-level items (children are included via relation)
  const topLevel = navItems.filter((item) => !item.parentId);

  return NextResponse.json(topLevel);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { spaceId } = await params;
  const body = await req.json();
  const { items } = body;

  if (!items || !Array.isArray(items)) {
    return NextResponse.json(
      { error: "items array is required" },
      { status: 400 }
    );
  }

  // Delete all existing nav items for this space
  await prisma.navItem.deleteMany({ where: { spaceId } });

  // Recursively create new nav items
  async function createItems(
    navItems: any[],
    parentId: string | null
  ) {
    for (let i = 0; i < navItems.length; i++) {
      const item = navItems[i];
      const created = await prisma.navItem.create({
        data: {
          spaceId,
          parentId,
          label: item.label,
          type: item.type || "PAGE",
          pageId: item.pageId || null,
          url: item.url || null,
          position: i,
        },
      });

      if (item.children && item.children.length > 0) {
        await createItems(item.children, created.id);
      }
    }
  }

  await createItems(items, null);

  // Fetch and return the new tree
  const newItems = await prisma.navItem.findMany({
    where: { spaceId, parentId: null },
    orderBy: { position: "asc" },
    include: {
      children: {
        orderBy: { position: "asc" },
        include: {
          children: { orderBy: { position: "asc" } },
        },
      },
    },
  });

  return NextResponse.json(newItems);
}
