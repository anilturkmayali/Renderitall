import { prisma } from "@/lib/prisma";
import { createOctokit } from "@/lib/github";
import crypto from "crypto";

/**
 * Set up a GitHub webhook on a repo so pushes trigger automatic content updates.
 * Returns true if successful, false if failed (non-critical — manual import still works).
 */
export async function setupWebhook(repoId: string): Promise<boolean> {
  const repo = await prisma.gitHubRepo.findUnique({ where: { id: repoId } });
  if (!repo || !repo.accessToken) return false;

  // Don't set up if already configured
  if (repo.webhookId) return true;

  const appUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  const webhookUrl = `${appUrl}/api/webhook/github`;
  const secret = crypto.randomBytes(20).toString("hex");

  try {
    const octokit = createOctokit(repo.accessToken);

    const { data } = await octokit.rest.repos.createWebhook({
      owner: repo.owner,
      repo: repo.repo,
      config: {
        url: webhookUrl,
        content_type: "json",
        secret,
      },
      events: ["push"],
      active: true,
    });

    await prisma.gitHubRepo.update({
      where: { id: repoId },
      data: {
        webhookId: data.id,
        webhookSecret: secret,
      },
    });

    return true;
  } catch (err: any) {
    // Webhook setup failed — likely no admin access to the repo
    // This is non-critical — manual import still works
    console.error(`Webhook setup failed for ${repo.owner}/${repo.repo}:`, err.message);
    return false;
  }
}

/**
 * Remove a webhook from a GitHub repo.
 */
export async function removeWebhook(repoId: string): Promise<void> {
  const repo = await prisma.gitHubRepo.findUnique({ where: { id: repoId } });
  if (!repo || !repo.accessToken || !repo.webhookId) return;

  try {
    const octokit = createOctokit(repo.accessToken);
    await octokit.rest.repos.deleteWebhook({
      owner: repo.owner,
      repo: repo.repo,
      hook_id: repo.webhookId,
    });
  } catch {
    // Non-critical
  }

  await prisma.gitHubRepo.update({
    where: { id: repoId },
    data: { webhookId: null, webhookSecret: null },
  });
}
