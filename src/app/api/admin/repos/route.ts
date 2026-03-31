import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { syncRepository } from "@/lib/sync";
import { logActivity } from "@/lib/activity";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Auto-reset repos stuck in SYNCING for more than 3 minutes
  await prisma.gitHubRepo.updateMany({
    where: {
      lastSyncStatus: "SYNCING",
      updatedAt: { lt: new Date(Date.now() - 3 * 60 * 1000) },
    },
    data: {
      lastSyncStatus: "ERROR",
      lastSyncError: "Sync timed out. The repository may have too many files or the connection was lost. Try syncing again.",
    },
  });

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
  const { owner, repo, branch, docsPath } = body;
  let { spaceId } = body;

  if (!owner || !repo) {
    return NextResponse.json(
      { error: "owner and repo are required" },
      { status: 400 }
    );
  }

  // Auto-assign to a default space if not provided
  if (!spaceId) {
    const membership = await prisma.orgMember.findFirst({
      where: { userId: session.user.id },
    });

    if (membership) {
      const existingSpace = await prisma.space.findFirst({
        where: { orgId: membership.orgId },
        select: { id: true },
      });

      if (existingSpace) {
        spaceId = existingSpace.id;
      } else {
        const space = await prisma.space.create({
          data: { orgId: membership.orgId, name: "Default", slug: "default", isPublic: true },
        });
        spaceId = space.id;
      }
    } else {
      // No org — create one
      const org = await prisma.organisation.create({
        data: { name: "My Organization", slug: "default", members: { create: { userId: session.user.id!, role: "OWNER" } } },
      });
      const space = await prisma.space.create({
        data: { orgId: org.id, name: "Default", slug: "default", isPublic: true },
      });
      spaceId = space.id;
    }
  }

  // Get the user's GitHub access token
  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: "github" },
  });

  // Generate a slug from the repo name
  const repoSlug = repo.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");

  const githubRepo = await prisma.gitHubRepo.create({
    data: {
      spaceId,
      owner,
      repo,
      slug: repoSlug,
      displayName: repo.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
      branch: branch || "main",
      docsPath: docsPath || "/",
      accessToken: account?.access_token || null,
    },
    include: {
      space: { select: { name: true, slug: true } },
    },
  });

  // Log activity
  const space = await prisma.space.findUnique({
    where: { id: spaceId },
    select: { orgId: true },
  });
  if (space) {
    await logActivity({
      orgId: space.orgId,
      userId: session.user.id,
      action: "connected repository",
      entity: `${owner}/${repo}`,
      entityId: githubRepo.id,
    });
  }

  // Auto-trigger initial sync in the background
  syncRepository(githubRepo.id).catch((err) => {
    console.error(`Auto-sync failed for ${owner}/${repo}:`, err);
  });

  return NextResponse.json(githubRepo, { status: 201 });
}
