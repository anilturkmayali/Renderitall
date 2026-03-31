import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createOctokit, fetchFileContent, pathToSlug, slugToTitle } from "@/lib/github";
import { rewriteMarkdownLinks, rewriteImageUrls } from "@/lib/sync";

export const maxDuration = 15;

// POST: sync a single file
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { filePath, position } = await req.json();

  if (!filePath) return NextResponse.json({ error: "filePath is required" }, { status: 400 });

  const repoConfig = await prisma.gitHubRepo.findUnique({
    where: { id },
    include: { space: true },
  });
  if (!repoConfig) return NextResponse.json({ error: "Repo not found" }, { status: 404 });

  let token = repoConfig.accessToken;
  if (!token) {
    const orgMember = await prisma.orgMember.findFirst({
      where: { orgId: repoConfig.space.orgId },
      include: { user: { include: { accounts: { where: { provider: "github" }, take: 1 } } } },
    });
    token = orgMember?.user?.accounts?.[0]?.access_token || null;
  }
  if (!token) return NextResponse.json({ error: "No access token" }, { status: 400 });

  try {
    const octokit = createOctokit(token);
    const { owner, repo, branch, docsPath, spaceId } = repoConfig;
    const spaceSlug = repoConfig.space.slug;

    const fileData = await fetchFileContent(octokit, owner, repo, filePath, branch, true);
    const slug = pathToSlug(filePath, docsPath);
    const title = (fileData.frontmatter?.title as string) || slugToTitle(slug);
    let content = rewriteImageUrls(fileData.content, filePath, owner, repo, branch);
    content = rewriteMarkdownLinks(content, filePath, docsPath, spaceSlug);
    const fm = JSON.parse(JSON.stringify(fileData.frontmatter || {}));

    const page = await prisma.page.upsert({
      where: { spaceId_slug: { spaceId, slug } },
      update: {
        title, content, frontmatter: fm, githubPath: filePath,
        githubSha: fileData.sha, lastSyncedAt: new Date(),
        status: "PUBLISHED", position: position || 0,
      },
      create: {
        spaceId, githubRepoId: id, title, slug, content,
        frontmatter: fm, githubPath: filePath, githubSha: fileData.sha,
        source: "GITHUB", status: "PUBLISHED", lastSyncedAt: new Date(),
        position: position || 0,
      },
    });

    return NextResponse.json({ success: true, pageId: page.id, slug, title });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to sync file" }, { status: 500 });
  }
}
