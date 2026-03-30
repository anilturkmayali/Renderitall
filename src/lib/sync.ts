import { prisma } from "@/lib/prisma";
import {
  createOctokit,
  fetchRepoTree,
  fetchFileContent,
  pathToSlug,
  slugToTitle,
} from "@/lib/github";
import type { Octokit } from "octokit";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SyncResult {
  success: boolean;
  pagessynced: number;
  navItemsCreated: number;
  error?: string;
}

interface SummaryEntry {
  title: string;
  path: string | null; // null for section headers
  children: SummaryEntry[];
}

// ─── SUMMARY.md Parser ──────────────────────────────────────────────────────

/**
 * Parses a GitBook-style SUMMARY.md into a tree structure.
 * Supports nested lists like:
 *   * [Title](path.md)
 *     * [Child](child.md)
 */
export function parseSummaryMd(content: string): SummaryEntry[] {
  const lines = content.split("\n").filter((l) => l.trim().length > 0);
  const root: SummaryEntry[] = [];
  const stack: { indent: number; children: SummaryEntry[] }[] = [
    { indent: -1, children: root },
  ];

  for (const line of lines) {
    // Match lines like "  * [Title](path.md)" or "  * Section Header"
    const match = line.match(/^(\s*)\*\s+(.+)$/);
    if (!match) continue;

    const indent = match[1].length;
    const text = match[2].trim();

    // Parse [Title](path) or plain text section header
    const linkMatch = text.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    const entry: SummaryEntry = linkMatch
      ? { title: linkMatch[1], path: linkMatch[2], children: [] }
      : { title: text, path: null, children: [] };

    // Find the right parent based on indentation
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    stack[stack.length - 1].children.push(entry);
    stack.push({ indent, children: entry.children });
  }

  return root;
}

// ─── Link Rewriter ──────────────────────────────────────────────────────────

/**
 * Rewrites relative markdown links to work within the docs reader.
 * Converts paths like `../folder/file.md` to proper slugs.
 */
export function rewriteMarkdownLinks(
  content: string,
  currentFilePath: string,
  docsPath: string,
  spaceSlug: string
): string {
  // Rewrite markdown links: [text](relative/path.md)
  return content.replace(
    /\[([^\]]*)\]\(([^)]+)\)/g,
    (match, text, href: string) => {
      // Skip external URLs, anchors, and absolute URLs
      if (
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("#") ||
        href.startsWith("mailto:")
      ) {
        return match;
      }

      // Resolve relative path
      const currentDir = currentFilePath.split("/").slice(0, -1).join("/");
      const resolvedPath = resolvePath(currentDir, href);

      // Strip anchor
      const [pathPart, anchor] = resolvedPath.split("#");

      // Convert to slug
      const slug = pathToSlug(pathPart, docsPath);
      const newHref = `/docs/${spaceSlug}/${slug}${anchor ? "#" + anchor : ""}`;

      return `[${text}](${newHref})`;
    }
  );
}

function resolvePath(base: string, relative: string): string {
  if (!relative.startsWith(".")) {
    return relative;
  }

  const baseParts = base.split("/").filter(Boolean);
  const relParts = relative.split("/");

  for (const part of relParts) {
    if (part === "..") {
      baseParts.pop();
    } else if (part !== ".") {
      baseParts.push(part);
    }
  }

  return baseParts.join("/");
}

// ─── Image URL Rewriter ─────────────────────────────────────────────────────

/**
 * Rewrites relative image paths to use raw.githubusercontent.com URLs.
 */
export function rewriteImageUrls(
  content: string,
  currentFilePath: string,
  owner: string,
  repo: string,
  branch: string
): string {
  return content.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (match, alt, src: string) => {
      // Skip absolute URLs
      if (src.startsWith("http://") || src.startsWith("https://")) {
        return match;
      }

      const currentDir = currentFilePath.split("/").slice(0, -1).join("/");
      const resolvedPath = resolvePath(currentDir, src);
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${resolvedPath}`;

      return `![${alt}](${rawUrl})`;
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
    return { success: false, pagessynced: 0, navItemsCreated: 0, error: "Repository not found" } as any;
  }

  // Mark as syncing
  await prisma.gitHubRepo.update({
    where: { id: repoId },
    data: { lastSyncStatus: "SYNCING" },
  });

  try {
    const octokit = createOctokit(repoConfig.accessToken || "");
    const { owner, repo, branch, docsPath, spaceId } = repoConfig;
    const spaceSlug = repoConfig.space.slug;

    // Step 1: Fetch the repo tree
    const tree = await fetchRepoTree(octokit, owner, repo, branch, docsPath);

    // Step 2: Check for SUMMARY.md
    const summaryFile = tree.find(
      (f) =>
        f.path.toLowerCase().endsWith("summary.md") ||
        f.path.toLowerCase().endsWith("summary.md")
    );

    let summaryEntries: SummaryEntry[] | null = null;
    if (summaryFile) {
      const summaryContent = await fetchFileContent(
        octokit,
        owner,
        repo,
        summaryFile.path,
        branch
      );
      summaryEntries = parseSummaryMd(summaryContent.content);
    }

    // Step 3: Fetch and upsert all markdown files
    const mdFiles = tree.filter(
      (item) =>
        item.type === "blob" &&
        (item.path.endsWith(".md") || item.path.endsWith(".mdx")) &&
        !item.path.toLowerCase().endsWith("summary.md")
    );

    let pagessynced = 0;
    const pageMap = new Map<string, string>(); // path -> pageId

    for (const file of mdFiles) {
      try {
        const fileData = await fetchFileContent(
          octokit,
          owner,
          repo,
          file.path,
          branch
        );

        const slug = pathToSlug(file.path, docsPath);
        const title =
          (fileData.frontmatter?.title as string) || slugToTitle(slug);

        // Rewrite links and images
        let processedContent = rewriteImageUrls(
          fileData.content,
          file.path,
          owner,
          repo,
          branch
        );
        processedContent = rewriteMarkdownLinks(
          processedContent,
          file.path,
          docsPath,
          spaceSlug
        );

        const fm = JSON.parse(JSON.stringify(fileData.frontmatter || {}));

        const page = await prisma.page.upsert({
          where: {
            spaceId_slug: { spaceId, slug },
          },
          update: {
            title,
            content: processedContent,
            frontmatter: fm,
            githubPath: file.path,
            githubSha: fileData.sha,
            commitDate: fileData.lastCommitDate
              ? new Date(fileData.lastCommitDate)
              : undefined,
            commitAuthor: fileData.lastCommitAuthor,
            lastSyncedAt: new Date(),
            status: "PUBLISHED",
            position: pagessynced,
          },
          create: {
            spaceId,
            githubRepoId: repoId,
            title,
            slug,
            content: processedContent,
            frontmatter: fm,
            githubPath: file.path,
            githubSha: fileData.sha,
            source: "GITHUB",
            status: "PUBLISHED",
            commitDate: fileData.lastCommitDate
              ? new Date(fileData.lastCommitDate)
              : undefined,
            commitAuthor: fileData.lastCommitAuthor,
            lastSyncedAt: new Date(),
            position: pagessynced,
          },
        });

        pageMap.set(file.path, page.id);
        pagessynced++;
      } catch (err) {
        console.error(`Failed to sync file ${file.path}:`, err);
        // Continue with other files
      }
    }

    // Step 4: Build navigation from SUMMARY.md or auto-generate
    let navItemsCreated = 0;

    // Delete existing nav items for this space that came from this repo
    await prisma.navItem.deleteMany({
      where: { spaceId },
    });

    if (summaryEntries && summaryEntries.length > 0) {
      navItemsCreated = await buildNavFromSummary(
        summaryEntries,
        spaceId,
        docsPath,
        pageMap,
        null,
        0
      );
    } else {
      // Auto-generate navigation from file structure
      navItemsCreated = await buildNavFromFileTree(
        mdFiles.map((f) => f.path),
        spaceId,
        docsPath,
        pageMap
      );
    }

    // Step 5: Update sync status
    await prisma.gitHubRepo.update({
      where: { id: repoId },
      data: {
        lastSyncStatus: "SUCCESS",
        lastSyncAt: new Date(),
        lastSyncError: null,
        pageCount: pagessynced,
      },
    });

    return {
      success: true,
      pagessynced,
      navItemsCreated,
    } as any;
  } catch (error: any) {
    await prisma.gitHubRepo.update({
      where: { id: repoId },
      data: {
        lastSyncStatus: "ERROR",
        lastSyncError: error.message || "Unknown sync error",
      },
    });

    return {
      success: false,
      pagessynced: 0,
      navItemsCreated: 0,
      error: error.message,
    } as any;
  }
}

// ─── Navigation Builders ────────────────────────────────────────────────────

async function buildNavFromSummary(
  entries: SummaryEntry[],
  spaceId: string,
  docsPath: string,
  pageMap: Map<string, string>,
  parentId: string | null,
  startPosition: number
): Promise<number> {
  let created = 0;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    let pageId: string | undefined;

    // Try to find the page by matching the summary path to our pageMap
    if (entry.path) {
      const normalizedDocsPath = docsPath.replace(/^\//, "").replace(/\/$/, "");
      const fullPath = normalizedDocsPath
        ? `${normalizedDocsPath}/${entry.path}`
        : entry.path;

      pageId = pageMap.get(fullPath);

      // Also try without docs path prefix
      if (!pageId) {
        pageId = pageMap.get(entry.path);
      }

      // Try matching by slug
      if (!pageId) {
        const slug = pathToSlug(fullPath, docsPath);
        const page = await prisma.page.findFirst({
          where: { spaceId, slug },
          select: { id: true },
        });
        pageId = page?.id;
      }
    }

    const navItem = await prisma.navItem.create({
      data: {
        spaceId,
        parentId,
        label: entry.title,
        type: entry.path ? "PAGE" : "SECTION",
        pageId: pageId || null,
        url: null,
        position: startPosition + i,
      },
    });

    created++;

    if (entry.children.length > 0) {
      created += await buildNavFromSummary(
        entry.children,
        spaceId,
        docsPath,
        pageMap,
        navItem.id,
        0
      );
    }
  }

  return created;
}

async function buildNavFromFileTree(
  filePaths: string[],
  spaceId: string,
  docsPath: string,
  pageMap: Map<string, string>
): Promise<number> {
  // Group files by directory
  const dirMap = new Map<string, string[]>();

  for (const filePath of filePaths) {
    const slug = pathToSlug(filePath, docsPath);
    const parts = slug.split("/");

    if (parts.length === 1) {
      // Top-level file
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

  // Create root-level pages
  const rootFiles = dirMap.get("__root__") || [];
  for (const fp of rootFiles) {
    const pageId = pageMap.get(fp);
    const slug = pathToSlug(fp, docsPath);
    await prisma.navItem.create({
      data: {
        spaceId,
        label: slugToTitle(slug),
        type: "PAGE",
        pageId: pageId || null,
        position: position++,
      },
    });
    created++;
  }

  // Create directory sections with their pages
  for (const [dir, files] of dirMap.entries()) {
    if (dir === "__root__") continue;

    const sectionTitle = slugToTitle(dir.split("/").pop() || dir);
    const section = await prisma.navItem.create({
      data: {
        spaceId,
        label: sectionTitle,
        type: "SECTION",
        position: position++,
      },
    });
    created++;

    let childPos = 0;
    for (const fp of files) {
      const pageId = pageMap.get(fp);
      const slug = pathToSlug(fp, docsPath);
      const pageName = slug.split("/").pop() || slug;
      await prisma.navItem.create({
        data: {
          spaceId,
          parentId: section.id,
          label: slugToTitle(pageName),
          type: "PAGE",
          pageId: pageId || null,
          position: childPos++,
        },
      });
      created++;
    }
  }

  return created;
}
