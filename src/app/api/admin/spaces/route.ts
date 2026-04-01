import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const spaces = await prisma.space.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      org: { select: { name: true } },
      _count: { select: { pages: true, githubRepos: true } },
    },
  });

  return NextResponse.json(spaces);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, slug, description, isPublic, orgId, headerLayout } = body;

  if (!name || !slug) {
    return NextResponse.json(
      { error: "Name and slug are required" },
      { status: 400 }
    );
  }

  // Ensure org exists, or create a default one
  let targetOrgId = orgId;
  if (!targetOrgId) {
    let defaultOrg = await prisma.organisation.findFirst({
      where: {
        members: { some: { userId: session.user.id } },
      },
    });

    if (!defaultOrg) {
      defaultOrg = await prisma.organisation.create({
        data: {
          name: "My Organization",
          slug: "default",
          members: {
            create: {
              userId: session.user.id!,
              role: "OWNER",
            },
          },
        },
      });
    }
    targetOrgId = defaultOrg.id;
  }

  // Get corporate font from org settings to use as default
  const org = await prisma.organisation.findUnique({
    where: { id: targetOrgId },
    select: { favicon: true },
  });
  const corporateFont = org?.favicon || null;

  const space = await prisma.space.create({
    data: {
      orgId: targetOrgId,
      name,
      slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      description: description || null,
      isPublic: isPublic !== false,
      headerLayout: headerLayout || "default",
      analyticsId: corporateFont, // analyticsId stores the font name
    },
  });

  await logActivity({
    orgId: targetOrgId,
    userId: session.user.id,
    action: "created space",
    entity: name,
    entityId: space.id,
  });

  return NextResponse.json(space, { status: 201 });
}
