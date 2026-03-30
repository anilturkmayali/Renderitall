import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Upload logo — accepts base64 data URL
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { logo, logoDark } = body;

  // Validate: must be a data URL or a regular URL
  if (logo && !logo.startsWith("data:") && !logo.startsWith("http")) {
    return NextResponse.json({ error: "Invalid logo format" }, { status: 400 });
  }

  const space = await prisma.space.findUnique({ where: { id } });
  if (!space) {
    return NextResponse.json({ error: "Space not found" }, { status: 404 });
  }

  // For the Space model, logo is stored in the Organisation
  // But we can use the Space's icon field for now
  // Actually let's use a direct update approach
  await prisma.organisation.update({
    where: { id: space.orgId },
    data: {
      logo: logo || undefined,
      logoDark: logoDark || undefined,
    },
  });

  return NextResponse.json({ success: true });
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
  const space = await prisma.space.findUnique({ where: { id } });
  if (!space) {
    return NextResponse.json({ error: "Space not found" }, { status: 404 });
  }

  await prisma.organisation.update({
    where: { id: space.orgId },
    data: { logo: null, logoDark: null },
  });

  return NextResponse.json({ success: true });
}
