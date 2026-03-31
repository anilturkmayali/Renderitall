import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createOctokit, fetchRepoTree, pathToSlug, slugToTitle } from "@/lib/github";

export const maxDuration = 30;

// GET: fetch the file list from GitHub without downloading content
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const repoConfig = await prisma.gitHubRepo.findUnique({
    where: { id },
    include: { space: true },
  });

  if (!repoConfig) return NextResponse.json({ error: "Repo not found" }, { status: 404 });

  // Get token
  let token = repoConfig.accessToken;
  if (!token) {
    const orgMember = await prisma.orgMember.findFirst({
      where: { orgId: repoConfig.space.orgId },
      include: { user: { include: { accounts: { where: { provider: "github" }, take: 1 } } } },
    });
    token = orgMember?.user?.accounts?.[0]?.access_token || null;
  }
  if (!token) return NextResponse.json({ error: "No GitHub access token" }, { status: 400 });

  try {
    const octokit = createOctokit(token);
    const tree = await fetchRepoTree(octokit, repoConfig.owner, repoConfig.repo, repoConfig.branch, repoConfig.docsPath);

    const mdFiles = tree.filter(
      (item) => item.type === "blob" && (item.path.endsWith(".md") || item.path.endsWith(".mdx")) && !item.path.toLowerCase().endsWith("summary.md")
    );

    // Check which files are already synced (same SHA = unchanged)
    const existingPages = await prisma.page.findMany({
      where: { spaceId: repoConfig.spaceId, githubRepoId: id },
      select: { slug: true, githubSha: true, title: true },
    });
    const existingShaMap = new Map(existingPages.map((p) => [p.slug, p.githubSha]));
    const existingTitleMap = new Map(existingPages.map((p) => [p.slug, p.title]));

    const files = mdFiles.map((file) => {
      const slug = pathToSlug(file.path, repoConfig.docsPath);
      const existingSha = existingShaMap.get(slug);
      const isUnchanged = existingSha === file.sha;
      return {
        path: file.path,
        sha: file.sha,
        slug,
        title: existingTitleMap.get(slug) || slugToTitle(slug),
        alreadySynced: !!existingSha,
        unchanged: isUnchanged,
      };
    });

    return NextResponse.json({
      total: files.length,
      newFiles: files.filter((f) => !f.alreadySynced).length,
      changedFiles: files.filter((f) => f.alreadySynced && !f.unchanged).length,
      unchangedFiles: files.filter((f) => f.unchanged).length,
      files,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch file list" }, { status: 500 });
  }
}
