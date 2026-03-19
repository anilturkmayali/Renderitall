import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createOctokit, fetchRepoTree, fetchFileContent, pathToSlug, slugToTitle } from "@/lib/github";
import crypto from "crypto";

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;

function verifySignature(payload: string, signature: string | null): boolean {
  if (!WEBHOOK_SECRET || !signature) return false;
  const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
  const digest = `sha256=${hmac.update(payload).digest("hex")}`;
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-hub-signature-256");

  // Verify webhook signature if secret is configured
  if (WEBHOOK_SECRET && !verifySignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = req.headers.get("x-github-event");
  const payload = JSON.parse(body);

  // Only process push events
  if (event !== "push") {
    return NextResponse.json({ message: "Ignored event", event });
  }

  const { repository, ref } = payload;
  const branch = ref.replace("refs/heads/", "");
  const fullName = repository.full_name;
  const [owner, repo] = fullName.split("/");

  // Find matching repo configurations
  const repoConfigs = await prisma.gitHubRepo.findMany({
    where: { owner, repo, branch },
    include: { space: true },
  });

  if (repoConfigs.length === 0) {
    return NextResponse.json({ message: "No matching repos configured" });
  }

  // Sync each matching repo
  for (const repoConfig of repoConfigs) {
    try {
      await prisma.gitHubRepo.update({
        where: { id: repoConfig.id },
        data: { lastSyncStatus: "SYNCING" },
      });

      const octokit = createOctokit(repoConfig.accessToken || "");
      const tree = await fetchRepoTree(
        octokit,
        owner,
        repo,
        branch,
        repoConfig.docsPath
      );

      // Filter markdown files
      const mdFiles = tree.filter(
        (item: { path: string; type: string }) =>
          item.type === "blob" &&
          (item.path.endsWith(".md") || item.path.endsWith(".mdx"))
      );

      let position = 0;
      for (const file of mdFiles) {
        const fileData = await fetchFileContent(
          octokit,
          owner,
          repo,
          branch,
          file.path
        );

        const slug = pathToSlug(file.path, repoConfig.docsPath);
        const title = (fileData.frontmatter?.title as string) || slugToTitle(slug);
        const fm = JSON.parse(JSON.stringify(fileData.frontmatter || {}));

        await prisma.page.upsert({
          where: {
            spaceId_slug: {
              spaceId: repoConfig.spaceId,
              slug,
            },
          },
          update: {
            title,
            content: fileData.content,
            frontmatter: fm,
            githubPath: file.path,
            commitSha: fileData.sha,
            commitDate: fileData.lastCommitDate
              ? new Date(fileData.lastCommitDate)
              : undefined,
            commitAuthor: fileData.lastCommitAuthor,
            position,
            updatedAt: new Date(),
          },
          create: {
            spaceId: repoConfig.spaceId,
            githubRepoId: repoConfig.id,
            title,
            slug,
            content: fileData.content,
            frontmatter: fm,
            githubPath: file.path,
            source: "GITHUB",
            status: "PUBLISHED",
            commitSha: fileData.sha,
            commitDate: fileData.lastCommitDate
              ? new Date(fileData.lastCommitDate)
              : undefined,
            commitAuthor: fileData.lastCommitAuthor,
            position,
          },
        });

        position++;
      }

      await prisma.gitHubRepo.update({
        where: { id: repoConfig.id },
        data: {
          lastSyncStatus: "SUCCESS",
          lastSyncAt: new Date(),
          lastSyncError: null,
        },
      });
    } catch (error: any) {
      await prisma.gitHubRepo.update({
        where: { id: repoConfig.id },
        data: {
          lastSyncStatus: "ERROR",
          lastSyncError: error.message || "Unknown error",
        },
      });
    }
  }

  return NextResponse.json({ message: "Sync completed" });
}
