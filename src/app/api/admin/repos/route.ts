import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const repos = await prisma.gitHubRepo.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      space: { select: { name: true, slug: true } },
      _count: { select: { pages: true } },
    },
  });

  return NextResponse.json(repos);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { spaceId, owner, repo, branch, docsPath } = body;

  if (!spaceId || !owner || !repo) {
    return NextResponse.json(
      { error: "spaceId, owner, and repo are required" },
      { status: 400 }
    );
  }

  // Get the user's GitHub access token from their OAuth account
  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: "github" },
  });

  const githubRepo = await prisma.gitHubRepo.create({
    data: {
      spaceId,
      owner,
      repo,
      branch: branch || "main",
      docsPath: docsPath || "/",
      accessToken: account?.access_token || null,
    },
    include: {
      space: { select: { name: true, slug: true } },
    },
  });

  return NextResponse.json(githubRepo, { status: 201 });
}
