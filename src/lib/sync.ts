import { prisma } from "@/lib/prisma";
import {
  createOctokit,
  fetchRepoTree,
  fetchFileContent,
  pathToSlug,
  slugToTitle,
} from "@/lib/github";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SyncResult {
  success: boolean;
  pagesSynced: number;
  pagesSkipped: number;
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
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) stack.pop();
    stack[stack.length - 1].children.push(entry);
    stack.push({ indent, children: entry.children });
  }
  return root;
}

// ─── Link & Image Rewriters ─────────────────────────────────────────────────

function resolvePath(base: string, relative: string): string {
  if (!relative.startsWith(".")) return relative;
  const baseParts = base.split("/").filter(Boolean);
  for (const part of relative.split("/")) {
    if (part === "..") baseParts.pop();
    else if (part !== ".") baseParts.push(part);
  }
  return baseParts.join("/");
}

export function rewriteMarkdownLinks(content: string, currentFilePath: string, docsPath: string, spaceSlug: string): string {
  return content.replace(/\[([^\]]*)\]\(([^)]+)\)/g, (match, text, href: string) => {
    if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("#") || href.startsWith("mailto:")) return match;
    const currentDir = currentFilePath.split("/").slice(0, -1).join("/");
    const resolvedPath = resolvePath(currentDir, href);
    const [pathPart, anchor] = resolvedPath.split("#");
    const slug = pathToSlug(pathPart, docsPath);
    return `[${text}](/docs/${spaceSlug}/${slug}${anchor ? "#" + anchor : ""})`;
  });
}

export function rewriteImageUrls(content: string, currentFilePath: string, owner: string, repo: string, branch: string): string {
  return content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src: string) => {
    if (src.startsWith("http://") || src.startsWith("https://")) return match;
    const currentDir = currentFilePath.split("/").slice(0, -1).join("/");
    const resolvedPath = resolvePath(currentDir, src);
    return `![${alt}](https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${resolvedPath})`;
  });
}

// ─── DB helper with retry ────────────────────────────────────────────────────

async function dbRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      const isConnectionError = err.message?.includes("closed the connection") ||
        err.message?.includes("Connection pool") ||
        err.message?.includes("ECONNRESET") ||
        err.message?.includes("connect ETIMEDOUT");
      if (isConnectionError && i < retries) {
        await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
        continue;
      }
      throw err;
    }
  }
  throw new Error("DB retry exhausted");
}

// ─── Main Sync ───────────────────────────────────────────────────────────────

export async function syncRepository(repoId: string): Promise<SyncResult> {
  const repoConfig = await prisma.gitHubRepo.findUnique({
    where: { id: repoId },
    include: { space: true },
  });

  if (!repoConfig) return { success: false, pagesSynced: 0, pagesSkipped: 0, error: "Repository not found" };

  if (repoConfig.lastSyncStatus === "SYNCING") {
    // If stuck for more than 2 min, force reset and continue
    const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000);
    if (repoConfig.updatedAt > twoMinAgo) {
      return { success: false, pagesSynced: 0, pagesSkipped: 0, error: "Sync already in progress. Please wait." };
    }
  }

  await dbRetry(() =>
    prisma.gitHubRepo.update({ where: { id: repoId }, data: { lastSyncStatus: "SYNCING", pageCount: 0 } })
  );

  try {
    // Get token
    let token = repoConfig.accessToken;
    if (!token) {
      const orgMember = await prisma.orgMember.findFirst({
        where: { orgId: repoConfig.space.orgId },
        include: { user: { include: { accounts: { where: { provider: "github" }, take: 1 } } } },
      });
      token = orgMember?.user?.accounts?.[0]?.access_token || null;
    }
    if (!token) throw new Error("No GitHub access token. Reconnect in Settings.");

    const octokit = createOctokit(token);
    const { owner, repo, branch, docsPath, spaceId } = repoConfig;
    const spaceSlug = repoConfig.space.slug;

    // Get tree
    const tree = await fetchRepoTree(octokit, owner, repo, branch, docsPath);

    // SUMMARY.md
    const summaryFile = tree.find((f) => f.path.toLowerCase().endsWith("summary.md"));
    let summaryEntries: SummaryEntry[] | null = null;
    if (summaryFile) {
      const sc = await fetchFileContent(octokit, owner, repo, summaryFile.path, branch, true);
      summaryEntries = parseSummaryMd(sc.content);
    }

    // Markdown files
    const mdFiles = tree.filter(
      (item) => item.type === "blob" && (item.path.endsWith(".md") || item.path.endsWith(".mdx")) && !item.path.toLowerCase().endsWith("summary.md")
    );

    // Get existing pages to skip unchanged files
    const existingPages = await prisma.page.findMany({
      where: { spaceId, githubRepoId: repoId },
      select: { slug: true, githubSha: true },
    });
    const existingShaMap = new Map(existingPages.map((p) => [p.slug, p.githubSha]));

    let pagesSynced = 0;
    let pagesSkipped = 0;
    const pageMap = new Map<string, string>();

    // Process one file at a time — slower but bulletproof on serverless
    for (const file of mdFiles) {
      const slug = pathToSlug(file.path, docsPath);

      // Skip if SHA hasn't changed (file unchanged since last sync)
      if (existingShaMap.get(slug) === file.sha) {
        pagesSkipped++;
        // Still need the page ID for nav building
        const existing = await prisma.page.findFirst({
          where: { spaceId, slug },
          select: { id: true },
        });
        if (existing) pageMap.set(file.path, existing.id);
        continue;
      }

      try {
        const fileData = await fetchFileContent(octokit, owner, repo, file.path, branch, true);
        const title = (fileData.frontmatter?.title as string) || slugToTitle(slug);
        let content = rewriteImageUrls(fileData.content, file.path, owner, repo, branch);
        content = rewriteMarkdownLinks(content, file.path, docsPath, spaceSlug);
        const fm = JSON.parse(JSON.stringify(fileData.frontmatter || {}));

        const page = await dbRetry(() =>
          prisma.page.upsert({
            where: { spaceId_slug: { spaceId, slug } },
            update: {
              title, content, frontmatter: fm, githubPath: file.path,
              githubSha: fileData.sha, lastSyncedAt: new Date(),
              status: "PUBLISHED", position: pagesSynced + pagesSkipped,
            },
            create: {
              spaceId, githubRepoId: repoId, title, slug, content,
              frontmatter: fm, githubPath: file.path, githubSha: fileData.sha,
              source: "GITHUB", status: "PUBLISHED",
              lastSyncedAt: new Date(), position: pagesSynced + pagesSkipped,
            },
          })
        );
        pageMap.set(file.path, page.id);
        pagesSynced++;
      } catch (err) {
        console.error(`Sync file error ${file.path}:`, err);
        pagesSynced++; // count it to keep position correct
      }
    }

    // Build navigation
    try {
      await dbRetry(() => prisma.navItem.deleteMany({ where: { spaceId } }));
      if (summaryEntries && summaryEntries.length > 0) {
        await buildNavFromSummary(summaryEntries, spaceId, docsPath, pageMap, null, 0);
      } else {
        await buildNavFromFileTree(mdFiles.map((f) => f.path), spaceId, docsPath, pageMap);
      }
    } catch (navErr) {
      console.error("Nav build error:", navErr);
    }

    // Mark success
    await dbRetry(() =>
      prisma.gitHubRepo.update({
        where: { id: repoId },
        data: { lastSyncStatus: "SUCCESS", lastSyncAt: new Date(), lastSyncError: null, pageCount: pagesSynced + pagesSkipped },
      })
    );

    return { success: true, pagesSynced, pagesSkipped };

  } catch (error: any) {
    try {
      await prisma.gitHubRepo.update({
        where: { id: repoId },
        data: { lastSyncStatus: "ERROR", lastSyncError: error.message || "Unknown error" },
      });
    } catch {}
    return { success: false, pagesSynced: 0, pagesSkipped: 0, error: error.message };
  }
}

// ─── Nav Builders ────────────────────────────────────────────────────────────

async function buildNavFromSummary(
  entries: SummaryEntry[], spaceId: string, docsPath: string,
  pageMap: Map<string, string>, parentId: string | null, startPos: number
): Promise<number> {
  let created = 0;
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    let pageId: string | undefined;
    if (entry.path) {
      const np = docsPath.replace(/^\//, "").replace(/\/$/, "");
      const fp = np ? `${np}/${entry.path}` : entry.path;
      pageId = pageMap.get(fp) || pageMap.get(entry.path);
      if (!pageId) {
        const slug = pathToSlug(fp, docsPath);
        const p = await prisma.page.findFirst({ where: { spaceId, slug }, select: { id: true } });
        pageId = p?.id;
      }
    }
    const nav = await dbRetry(() =>
      prisma.navItem.create({
        data: { spaceId, parentId, label: entry.title, type: entry.path ? "PAGE" : "SECTION", pageId: pageId || null, url: null, position: startPos + i },
      })
    );
    created++;
    if (entry.children.length > 0) {
      created += await buildNavFromSummary(entry.children, spaceId, docsPath, pageMap, nav.id, 0);
    }
  }
  return created;
}

async function buildNavFromFileTree(
  filePaths: string[], spaceId: string, docsPath: string, pageMap: Map<string, string>
): Promise<number> {
  const dirMap = new Map<string, string[]>();
  for (const fp of filePaths) {
    const slug = pathToSlug(fp, docsPath);
    const parts = slug.split("/");
    const key = parts.length === 1 ? "__root__" : parts.slice(0, -1).join("/");
    const arr = dirMap.get(key) || [];
    arr.push(fp);
    dirMap.set(key, arr);
  }

  let created = 0, pos = 0;
  for (const fp of dirMap.get("__root__") || []) {
    await dbRetry(() => prisma.navItem.create({ data: { spaceId, label: slugToTitle(pathToSlug(fp, docsPath)), type: "PAGE", pageId: pageMap.get(fp) || null, position: pos++ } }));
    created++;
  }
  for (const [dir, files] of dirMap.entries()) {
    if (dir === "__root__") continue;
    const section = await dbRetry(() => prisma.navItem.create({ data: { spaceId, label: slugToTitle(dir.split("/").pop() || dir), type: "SECTION", position: pos++ } }));
    created++;
    let cp = 0;
    for (const fp of files) {
      const slug = pathToSlug(fp, docsPath);
      await dbRetry(() => prisma.navItem.create({ data: { spaceId, parentId: section.id, label: slugToTitle(slug.split("/").pop() || slug), type: "PAGE", pageId: pageMap.get(fp) || null, position: cp++ } }));
      created++;
    }
  }
  return created;
}
