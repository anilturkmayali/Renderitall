import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncRepository } from "@/lib/sync";
import crypto from "crypto";

export const maxDuration = 60;

function verifySignature(payload: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const hmac = crypto.createHmac("sha256", secret);
  const digest = `sha256=${hmac.update(payload).digest("hex")}`;
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-hub-signature-256");
  const event = req.headers.get("x-github-event");

  // Handle ping (sent when webhook is first set up)
  if (event === "ping") {
    return NextResponse.json({ message: "pong" });
  }

  // Only process push events
  if (event !== "push") {
    return NextResponse.json({ message: "Ignored event", event });
  }

  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { repository, ref } = payload;
  if (!repository?.full_name || !ref) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const branch = ref.replace("refs/heads/", "");
  const [owner, repo] = repository.full_name.split("/");

  // Find matching repo configurations
  const repoConfigs = await prisma.gitHubRepo.findMany({
    where: { owner, repo, branch },
  });

  if (repoConfigs.length === 0) {
    return NextResponse.json({ message: "No matching repos configured" });
  }

  const results = [];

  for (const repoConfig of repoConfigs) {
    // Verify signature if the repo has a webhook secret
    if (repoConfig.webhookSecret) {
      if (!verifySignature(body, signature, repoConfig.webhookSecret)) {
        results.push({ repoId: repoConfig.id, error: "Invalid signature" });
        continue;
      }
    }

    // Run sync — this re-imports only changed files (SHA comparison)
    try {
      const result = await syncRepository(repoConfig.id);
      results.push({ repoId: repoConfig.id, ...result });
    } catch (err: any) {
      results.push({ repoId: repoConfig.id, error: err.message });
    }
  }

  return NextResponse.json({ message: "Processed", results });
}
