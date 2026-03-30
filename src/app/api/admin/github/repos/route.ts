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
  const org = searchParams.get("org") || ""; // filter by org
  const perPage = 50;

  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: "github" },
  });

  if (!account?.access_token) {
    return NextResponse.json(
      { error: "No GitHub account linked. Go to Settings to connect your GitHub account." },
      { status: 400 }
    );
  }

  const octokit = createOctokit(account.access_token);

  try {
    let repos: any[];

    if (query) {
      // Search — optionally scoped to an org
      const q = org ? `${query} org:${org}` : query;
      const { data } = await octokit.rest.search.repos({
        q,
        per_page: perPage,
        sort: "updated",
      });
      repos = data.items;
    } else if (org) {
      // List repos for a specific org
      const { data } = await octokit.rest.repos.listForOrg({
        org,
        per_page: perPage,
        sort: "updated",
        direction: "desc",
        type: "all",
      });
      repos = data;
    } else {
      // List all repos the user has access to
      const { data } = await octokit.rest.repos.listForAuthenticatedUser({
        per_page: perPage,
        sort: "updated",
        direction: "desc",
        affiliation: "owner,collaborator,organization_member",
      });
      repos = data;
    }

    const result = repos.map((repo: any) => ({
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
