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
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = 30;

  // Get the user's GitHub access token
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
      // Search user's repos
      const { data } = await octokit.rest.search.repos({
        q: `${query} user:${session.user.name || ""} fork:true`,
        per_page: perPage,
        page,
        sort: "updated",
      });

      // Also search in orgs the user belongs to
      const { data: orgData } = await octokit.rest.search.repos({
        q: `${query} fork:true`,
        per_page: perPage,
        page,
        sort: "updated",
      });

      // Merge and deduplicate
      const allRepos = [...data.items, ...orgData.items];
      const seen = new Set<number>();
      repos = allRepos.filter((r) => {
        if (seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      }).slice(0, perPage);
    } else {
      // List repos the user has access to (includes org repos)
      const { data } = await octokit.rest.repos.listForAuthenticatedUser({
        per_page: perPage,
        page,
        sort: "updated",
        direction: "desc",
      });
      repos = data;
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
