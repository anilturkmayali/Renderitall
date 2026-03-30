import { Octokit } from "octokit";
import matter from "gray-matter";

export function createOctokit(accessToken: string) {
  return new Octokit({ auth: accessToken });
}

export interface GitHubFile {
  path: string;
  sha: string;
  content: string;
  frontmatter: Record<string, unknown>;
  lastCommitDate?: string;
  lastCommitAuthor?: string;
}

export async function fetchRepoTree(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string,
  docsPath: string
): Promise<{ path: string; sha: string; type: string }[]> {
  const { data } = await octokit.rest.git.getTree({
    owner,
    repo,
    tree_sha: branch,
    recursive: "1",
  });

  const normalizedPath = docsPath.replace(/^\//, "").replace(/\/$/, "");

  return data.tree
    .filter((item) => {
      if (!item.path || !item.sha) return false;
      const inPath = normalizedPath
        ? item.path.startsWith(normalizedPath + "/") || item.path === normalizedPath
        : true;
      const isMarkdown =
        item.type === "blob" &&
        (item.path.endsWith(".md") || item.path.endsWith(".mdx"));
      return inPath && isMarkdown;
    })
    .map((item) => ({
      path: item.path!,
      sha: item.sha!,
      type: item.type!,
    }));
}

/**
 * Fetch file content from GitHub.
 * skipCommitInfo=true skips the per-file commit lookup (much faster for bulk sync).
 */
export async function fetchFileContent(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  ref: string,
  skipCommitInfo = false
): Promise<GitHubFile> {
  const { data } = await octokit.rest.repos.getContent({
    owner,
    repo,
    path,
    ref,
  });

  if (Array.isArray(data) || data.type !== "file" || !("content" in data)) {
    throw new Error(`Path ${path} is not a file`);
  }

  const raw = Buffer.from(data.content, "base64").toString("utf-8");
  const { data: frontmatter, content } = matter(raw);

  let lastCommitDate: string | undefined;
  let lastCommitAuthor: string | undefined;

  if (!skipCommitInfo) {
    try {
      const commits = await octokit.rest.repos.listCommits({
        owner,
        repo,
        path,
        sha: ref,
        per_page: 1,
      });
      if (commits.data.length > 0) {
        lastCommitDate = commits.data[0].commit.committer?.date ?? undefined;
        lastCommitAuthor =
          commits.data[0].commit.author?.name ??
          commits.data[0].author?.login ??
          undefined;
      }
    } catch {
      // Non-critical
    }
  }

  return {
    path,
    sha: data.sha,
    content,
    frontmatter,
    lastCommitDate,
    lastCommitAuthor,
  };
}

export function pathToSlug(filePath: string, docsPath: string): string {
  const normalizedDocsPath = docsPath.replace(/^\//, "").replace(/\/$/, "");
  let relative = filePath;
  if (normalizedDocsPath) {
    relative = filePath.replace(normalizedDocsPath + "/", "");
  }
  return relative
    .replace(/\.mdx?$/, "")
    .replace(/\/index$/, "")
    .replace(/\/README$/i, "")
    .toLowerCase()
    .replace(/\s+/g, "-");
}

export function slugToTitle(slug: string): string {
  const lastSegment = slug.split("/").pop() || slug;
  return lastSegment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
