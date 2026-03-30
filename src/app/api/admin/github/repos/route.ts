import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createOctokit } from "@/lib/github";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";
  const perPage = 50;

  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: "github" },
  });

  if (!account?.access_token) {
    return NextResponse.json(
      { error: "No GitHub account linked" },
      { status: 400 }
    );
  }

  const octokit = createOctokit(account.access_token);

  try {
    let repos;

    if (query) {
      // Search across all repos the user can access
      const { data } = await octokit.rest.search.repos({
        q: query,
        per_page: perPage,
        sort: "updated",
      });
      repos = data.items;
    } else {
      // Fetch repos from all sources: personal + all orgs
      const personalRepos = await octokit.rest.repos.listForAuthenticatedUser({
        per_page: perPage,
        sort: "updated",
        direction: "desc",
        affiliation: "owner,collaborator,organization_member",
      });

      // Also fetch org repos explicitly
      let orgRepos: any[] = [];
      try {
        const { data: orgs } = await octokit.rest.orgs.listForAuthenticatedUser({
          per_page: 20,
        });
        const orgPromises = orgs.map((org) =>
          octokit.rest.repos.listForOrg({
            org: org.login,
            per_page: 30,
            sort: "updated",
            direction: "desc",
          }).then((res) => res.data).catch(() => [])
        );
        const orgResults = await Promise.all(orgPromises);
        orgRepos = orgResults.flat();
      } catch {
        // Org fetch failed — continue with personal repos
      }

      // Merge and deduplicate
      const allRepos = [...personalRepos.data, ...orgRepos];
      const seen = new Set<number>();
      repos = allRepos.filter((r) => {
        if (seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      });

      // Sort by updated_at
      repos.sort((a, b) =>
        new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()
      );

      repos = repos.slice(0, perPage);
    }

    const result = repos.map((repo) => ({
      id: repo.id,
      fullName: repo.full_name,
      owner: repo.owner?.login || "",
      name: repo.name,
      description: repo.description,
      defaultBranch: repo.default_branch,
      isPrivate: repo.private,
      updatedAt: repo.updated_at,
      language: repo.language,
      stargazersCount: repo.stargazers_count,
    }));

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch repos" },
      { status: 500 }
    );
  }
}
