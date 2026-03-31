import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET: list team members
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Find the user's org
  const membership = await prisma.orgMember.findFirst({
    where: { userId: session.user.id },
    include: { org: true },
  });

  if (!membership) {
    return NextResponse.json({ members: [], orgName: null });
  }

  const members = await prisma.orgMember.findMany({
    where: { orgId: membership.orgId },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    orgId: membership.orgId,
    orgName: membership.org.name,
    currentUserRole: membership.role,
    members: members.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      createdAt: m.createdAt,
      user: m.user,
    })),
  });
}

// POST: invite a user by email
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email, role } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  // Check caller is owner or admin
  const callerMembership = await prisma.orgMember.findFirst({
    where: { userId: session.user.id },
  });

  if (!callerMembership || !["OWNER", "ADMIN"].includes(callerMembership.role)) {
    return NextResponse.json({ error: "Only owners and admins can invite members" }, { status: 403 });
  }

  // Find user by email
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return NextResponse.json(
      { error: "No user found with that email. They need to sign in with GitHub first." },
      { status: 404 }
    );
  }

  // Check if already a member
  const existing = await prisma.orgMember.findFirst({
    where: { orgId: callerMembership.orgId, userId: user.id },
  });

  if (existing) {
    return NextResponse.json({ error: "This user is already a team member" }, { status: 409 });
  }

  // Add member
  const validRoles = ["ADMIN", "EDITOR", "REVIEWER"];
  const memberRole = validRoles.includes(role) ? role : "EDITOR";

  const member = await prisma.orgMember.create({
    data: {
      orgId: callerMembership.orgId,
      userId: user.id,
      role: memberRole,
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  return NextResponse.json({
    id: member.id,
    userId: member.userId,
    role: member.role,
    createdAt: member.createdAt,
    user: member.user,
  }, { status: 201 });
}
