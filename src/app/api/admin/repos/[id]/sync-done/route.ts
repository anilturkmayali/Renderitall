import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST: mark sync as complete
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { pagesSynced } = await req.json();

  const pageCount = await prisma.page.count({
    where: { githubRepoId: id },
  });

  await prisma.gitHubRepo.update({
    where: { id },
    data: {
      lastSyncStatus: "SUCCESS",
      lastSyncAt: new Date(),
      lastSyncError: null,
      pageCount,
    },
  });

  return NextResponse.json({ success: true, pageCount });
}
