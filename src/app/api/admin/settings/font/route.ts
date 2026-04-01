import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET: get corporate font
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.orgMember.findFirst({
    where: { userId: session.user.id },
    include: { org: { select: { favicon: true } } },
  });

  return NextResponse.json({ font: membership?.org?.favicon || "" });
}

// PUT: set corporate font
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { font } = await req.json();

  const membership = await prisma.orgMember.findFirst({
    where: { userId: session.user.id },
  });

  if (!membership) return NextResponse.json({ error: "No organization" }, { status: 400 });

  await prisma.organisation.update({
    where: { id: membership.orgId },
    data: { favicon: font || null },
  });

  return NextResponse.json({ success: true, font });
}
