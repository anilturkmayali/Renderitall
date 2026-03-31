import { prisma } from "@/lib/prisma";
import {
  createOctokit,
  fetchRepoTree,
  fetchFileContent,
  pathToSlug,
  slugToTitle,
} from "@/lib/github";
import { logActivity } from "@/lib/activity";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SyncResult {
  success: boolean;
  pagesSynced: number;
  error?: string;
}

interface SummaryEntry {
  title: string;
  path: string | null;
  children: SummaryEntry[];
}

// ─── SUMMARY.md Parser ──────────────────────────────────────────────────────

export function parseSummaryMd(content: string): SummaryEntry[] {
  const lines = content.split("\n").filter((l) => l.trim().length > 0);
  const root: SummaryEntry[] = [];
  const stack: { indent: number; children: SummaryEntry[] }[] = [
    { indent: -1, children: root },
  ];

  for (const line of lines) {
    const match = line.match(/^(\s*)\*\s+(.+)$/);
    if (!match) continue;

    const indent = match[1].length;
    const text = match[2].trim();

    const linkMatch = text.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    const entry: SummaryEntry = linkMatch
      ? { title: linkMatch[1], path: linkMatch[2], children: [] }
      : { title: text, path: null, children: [] };

    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    stack[stack.length - 1].children.push(entry);
    stack.push({ indent, children: entry.children });
  }

  return root;
}

// ─── Link & Image Rewriters ─────────────────────────────────────────────────

export function rewriteMarkdownLinks(
  content: string, currentFilePath: string, docsPath: string, spaceSlug: string
): string {
  return content.replace(
    /\[([^\]]*)\]\(([^)]+)\)/g,
    (match, text, href: string) => {
      if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("#") || href.startsWith("mailto:")) return match;
      const currentDir = currentFilePath.split("/").slice(0, -1).join("/");
      const resolvedPath = resolvePath(currentDir, href);
      const [pathPart, anchor] = resolvedPath.split("#");
      const slug = pathToSlug(pathPart, docsPath);
      return `[${text}](/docs/${spaceSlug}/${slug}${anchor ? "#" + anchor : ""})`;
    }
  );
}

function resolvePath(base: string, relative: string): string {
  if (!relative.startsWith(".")) return relative;
  const baseParts = base.split("/").filter(Boolean);
  for (const part of relative.split("/")) {
    if (part === "..") baseParts.pop();
    else if (part !== ".") baseParts.push(part);
  }
  return baseParts.join("/");
}

export function rewriteImageUrls(
  content: string, currentFilePath: string, owner: string, repo: string, branch: string
): string {
  return content.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (match, alt, src: string) => {
      if (src.startsWith("http://") || src.startsWith("https://")) return match;
      const currentDir = currentFilePath.split("/").slice(0, -1).join("/");
      const resolvedPath = resolvePath(currentDir, src);
      return `![${alt}](https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${resolvedPath})`;
    }
  );
}

// ─── Main Sync Function ─────────────────────────────────────────────────────

export async function syncRepository(repoId: string): Promise<SyncResult> {
  const repoConfig = await prisma.gitHubRepo.findUnique({
    where: { id: repoId },
    include: { space: true },
  });

  if (!repoConfig) {
    return { success: false, pagesSynced: 0, error: "Repository not found" };
  }

  if (repoConfig.lastSyncStatus === "SYNCING") {
    return { success: false, pagesSynced: 0, error: "Sync already in progress" };
  }

  // Mark as syncing
  try {
    await prisma.gitHubRepo.update({
      where: { id: repoId },
      data: { lastSyncStatus: "SYNCING", pageCount: 0 },
    });
  } catch {
    return { success: false, pagesSynced: 0, error: "Failed to start sync" };
  }

  try {
    // Get a valid access token
    let token = repoConfig.accessToken;
    if (!token) {
      const orgMember = await prisma.orgMember.findFirst({
        where: { orgId: repoConfig.space.orgId },
        include: { user: { include: { accounts: { where: { provider: "github" }, take: 1 } } } },
      });
      token = orgMember?.user?.accounts?.[0]?.access_token || null;
    }

    if (!token) {
      throw new Error("No GitHub access token. Please reconnect the repository.");
    }

    const octokit = createOctokit(token);
    const { owner, repo, branch, docsPath, spaceId } = repoConfig;
    const spaceSlug = repoConfig.space.slug;

    // Fetch repo tree
    const tree = await fetchRepoTree(octokit, owner, repo, branch, docsPath);

    // Check for SUMMARY.md
    const summaryFile = tree.find((f) => f.path.toLowerCase().endsWith("summary.md"));
    let summaryEntries: SummaryEntry[] | null = null;
    if (summaryFile) {
      const sc = await fetchFileContent(octokit, owner, repo, summaryFile.path, branch, true);
      summaryEntries = parseSummaryMd(sc.content);
    }

    // Filter markdown files
    const mdFiles = tree.filter(
      (item) => item.type === "blob" && (item.path.endsWith(".md") || item.path.endsWith(".mdx")) && !item.path.toLowerCase().endsWith("summary.md")
    );

    let pagesSynced = 0;
    const pageMap = new Map<string, string>();

    // Process files in parallel batches of 3 (conservative to avoid connection issues)
    const BATCH = 3;
    for (let i = 0; i < mdFiles.length; i += BATCH) {
      const batch = mdFiles.slice(i, i + BATCH);

      // Fetch content in parallel
      const fetched = await Promise.allSettled(
        batch.map((file) =>
          fetchFileContent(octokit, owner, repo, file.path, branch, true)
            .then((data) => ({ file, data }))
        )
      );

      // Save to DB one at a time (avoids connection pool issues)
      for (const result of fetched) {
        if (result.status !== "fulfilled") {
          pagesSynced++;
          continue;
        }

        const { file, data: fileData } = result.value;
        const slug = pathToSlug(file.path, docsPath);
        const title = (fileData.frontmatter?.title as string) || slugToTitle(slug);
        let content = rewriteImageUrls(fileData.content, file.path, owner, repo, branch);
        content = rewriteMarkdownLinks(content, file.path, docsPath, spaceSlug);
        const fm = JSON.parse(JSON.stringify(fileData.frontmatter || {}));

        try {
          const page = await prisma.page.upsert({
            where: { spaceId_slug: { spaceId, slug } },
            update: {
              title, content, frontmatter: fm, githubPath: file.path,
              githubSha: fileData.sha, lastSyncedAt: new Date(),
              status: "PUBLISHED", position: pagesSynced,
              commitDate: fileData.lastCommitDate ? new Date(fileData.lastCommitDate) : undefined,
              commitAuthor: fileData.lastCommitAuthor,
            },
            create: {
              spaceId, githubRepoId: repoId, title, slug, content,
              frontmatter: fm, githubPath: file.path, githubSha: fileData.sha,
              source: "GITHUB", status: "PUBLISHED", position: pagesSynced,
              commitDate: fileData.lastCommitDate ? new Date(fileData.lastCommitDate) : undefined,
              commitAuthor: fileData.lastCommitAuthor, lastSyncedAt: new Date(),
            },
          });
          pageMap.set(file.path, page.id);
        } catch (dbErr) {
          console.error(`DB error for ${file.path}:`, dbErr);
          // Don't fail the whole sync for one file
        }

        pagesSynced++;
      }

      // Update progress after each batch
      try {
        await prisma.gitHubRepo.update({
          where: { id: repoId },
          data: { pageCount: pagesSynced },
        });
      } catch {
        // Non-critical — progress update failed, continue syncing
      }
    }

    // Build navigation
    let navItemsCreated = 0;
    try {
      await prisma.navItem.deleteMany({ where: { spaceId } });

      if (summaryEntries && summaryEntries.length > 0) {
        navItemsCreated = await buildNavFromSummary(summaryEntries, spaceId, docsPath, pageMap, null, 0);
      } else {
        navItemsCreated = await buildNavFromFileTree(mdFiles.map((f) => f.path), spaceId, docsPath, pageMap);
      }
    } catch (navErr) {
      console.error("Nav build error:", navErr);
    }

    // Mark success
    try {
      await prisma.gitHubRepo.update({
        where: { id: repoId },
        data: {
          lastSyncStatus: "SUCCESS",
          lastSyncAt: new Date(),
          lastSyncError: null,
          pageCount: pagesSynced,
        },
      });
    } catch {
      // If even the final update fails, at least the pages are synced
    }

    // Log activity (non-critical)
    try {
      await logActivity({
        orgId: repoConfig.space.orgId,
        action: "synced repository",
        entity: `${owner}/${repo}`,
        entityId: repoId,
      });
    } catch {}

    return { success: true, pagesSynced };

  } catch (error: any) {
    // Mark as error
    try {
      await prisma.gitHubRepo.update({
        where: { id: repoId },
        data: {
          lastSyncStatus: "ERROR",
          lastSyncError: error.message || "Unknown sync error",
        },
      });
    } catch {}

    return { success: false, pagesSynced: 0, error: error.message };
  }
}

// ─── Navigation Builders ────────────────────────────────────────────────────

async function buildNavFromSummary(
  entries: SummaryEntry[], spaceId: string, docsPath: string,
  pageMap: Map<string, string>, parentId: string | null, startPosition: number
): Promise<number> {
  let created = 0;
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    let pageId: string | undefined;

    if (entry.path) {
      const normalizedDocsPath = docsPath.replace(/^\//, "").replace(/\/$/, "");
      const fullPath = normalizedDocsPath ? `${normalizedDocsPath}/${entry.path}` : entry.path;
      pageId = pageMap.get(fullPath) || pageMap.get(entry.path);

      if (!pageId) {
        const slug = pathToSlug(fullPath, docsPath);
        const page = await prisma.page.findFirst({ where: { spaceId, slug }, select: { id: true } });
        pageId = page?.id;
      }
    }

    const navItem = await prisma.navItem.create({
      data: {
        spaceId, parentId, label: entry.title,
        type: entry.path ? "PAGE" : "SECTION",
        pageId: pageId || null, url: null, position: startPosition + i,
      },
    });
    created++;

    if (entry.children.length > 0) {
      created += await buildNavFromSummary(entry.children, spaceId, docsPath, pageMap, navItem.id, 0);
    }
  }
  return created;
}

async function buildNavFromFileTree(
  filePaths: string[], spaceId: string, docsPath: string, pageMap: Map<string, string>
): Promise<number> {
  const dirMap = new Map<string, string[]>();

  for (const filePath of filePaths) {
    const slug = pathToSlug(filePath, docsPath);
    const parts = slug.split("/");
    if (parts.length === 1) {
      const existing = dirMap.get("__root__") || [];
      existing.push(filePath);
      dirMap.set("__root__", existing);
    } else {
      const dir = parts.slice(0, -1).join("/");
      const existing = dirMap.get(dir) || [];
      existing.push(filePath);
      dirMap.set(dir, existing);
    }
  }

  let created = 0;
  let position = 0;

  const rootFiles = dirMap.get("__root__") || [];
  for (const fp of rootFiles) {
    const pageId = pageMap.get(fp);
    const slug = pathToSlug(fp, docsPath);
    await prisma.navItem.create({
      data: { spaceId, label: slugToTitle(slug), type: "PAGE", pageId: pageId || null, position: position++ },
    });
    created++;
  }

  for (const [dir, files] of dirMap.entries()) {
    if (dir === "__root__") continue;
    const sectionTitle = slugToTitle(dir.split("/").pop() || dir);
    const section = await prisma.navItem.create({
      data: { spaceId, label: sectionTitle, type: "SECTION", position: position++ },
    });
    created++;

    let childPos = 0;
    for (const fp of files) {
      const pageId = pageMap.get(fp);
      const slug = pathToSlug(fp, docsPath);
      const pageName = slug.split("/").pop() || slug;
      await prisma.navItem.create({
        data: { spaceId, parentId: section.id, label: slugToTitle(pageName), type: "PAGE", pageId: pageId || null, position: childPos++ },
      });
      created++;
    }
  }

  return created;
}
