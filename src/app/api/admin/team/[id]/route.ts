import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// PUT: update a member's role
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { role } = await req.json();

  // Check caller is owner or admin
  const caller = await prisma.orgMember.findFirst({
    where: { userId: session.user.id },
  });
  if (!caller || !["OWNER", "ADMIN"].includes(caller.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  // Can't change the owner's role
  const target = await prisma.orgMember.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  if (target.role === "OWNER") {
    return NextResponse.json({ error: "Cannot change the owner's role" }, { status: 403 });
  }

  // Admins can't promote to owner
  const validRoles = caller.role === "OWNER" ? ["ADMIN", "EDITOR", "REVIEWER"] : ["EDITOR", "REVIEWER"];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const updated = await prisma.orgMember.update({
    where: { id },
    data: { role },
  });

  return NextResponse.json(updated);
}

// DELETE: remove a member
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const caller = await prisma.orgMember.findFirst({
    where: { userId: session.user.id },
  });
  if (!caller || !["OWNER", "ADMIN"].includes(caller.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const target = await prisma.orgMember.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  if (target.role === "OWNER") {
    return NextResponse.json({ error: "Cannot remove the owner" }, { status: 403 });
  }
  // Can't remove yourself
  if (target.userId === session.user.id) {
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 403 });
  }

  await prisma.orgMember.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
