import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createOctokit } from "@/lib/github";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: "github" },
  });

  if (!account?.access_token) {
    return NextResponse.json({
      connected: false,
      message: "No GitHub account linked",
    });
  }

  const octokit = createOctokit(account.access_token);

  try {
    // Fetch GitHub user info
    const { data: user } = await octokit.rest.users.getAuthenticated();

    // Fetch organizations
    let orgs: { login: string; avatar_url: string; description: string | null }[] = [];
    try {
      const { data: orgData } = await octokit.rest.orgs.listForAuthenticatedUser({
        per_page: 50,
      });
      orgs = orgData.map((o) => ({
        login: o.login,
        avatar_url: o.avatar_url,
        description: o.description || null,
      }));
    } catch {
      // Org access might not be granted
    }

    // Check token scopes
    let scopes: string[] = [];
    try {
      const res = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${account.access_token}` },
      });
      const scopeHeader = res.headers.get("x-oauth-scopes");
      if (scopeHeader) {
        scopes = scopeHeader.split(",").map((s) => s.trim());
      }
    } catch {
      // Non-critical
    }

    const hasOrgAccess = scopes.includes("read:org") || scopes.includes("admin:org");
    const hasRepoAccess = scopes.includes("repo");

    return NextResponse.json({
      connected: true,
      username: user.login,
      name: user.name,
      avatarUrl: user.avatar_url,
      email: user.email,
      connectedAt: null,
      organizations: orgs,
      scopes,
      hasOrgAccess,
      hasRepoAccess,
      needsReconnect: !hasOrgAccess || !hasRepoAccess,
    });
  } catch (err: any) {
    return NextResponse.json({
      connected: true,
      error: err.message,
      tokenExpired: true,
      needsReconnect: true,
    });
  }
}

// Disconnect GitHub
export async function DELETE() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.account.deleteMany({
    where: { userId: session.user.id, provider: "github" },
  });

  return NextResponse.json({ success: true });
}
