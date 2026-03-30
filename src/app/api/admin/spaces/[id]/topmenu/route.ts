import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const space = await prisma.space.findUnique({
    where: { id },
    select: { footerLinks: true },
  });

  // footerLinks stores the top menu items as JSON array
  const items = (space?.footerLinks as any[]) || [];
  return NextResponse.json(items);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { items } = await req.json();

  await prisma.space.update({
    where: { id },
    data: { footerLinks: items as Prisma.InputJsonValue },
  });

  return NextResponse.json(items);
}
