import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncRepository } from "@/lib/sync";
import crypto from "crypto";

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;

function verifySignature(payload: string, signature: string | null): boolean {
  if (!WEBHOOK_SECRET || !signature) return false;
  const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
  const digest = `sha256=${hmac.update(payload).digest("hex")}`;
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-hub-signature-256");

  // Verify webhook signature if secret is configured
  if (WEBHOOK_SECRET && !verifySignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = req.headers.get("x-github-event");
  const payload = JSON.parse(body);

  // Handle ping event (sent when webhook is first set up)
  if (event === "ping") {
    return NextResponse.json({ message: "pong" });
  }

  // Only process push events
  if (event !== "push") {
    return NextResponse.json({ message: "Ignored event", event });
  }

  const { repository, ref } = payload;
  const branch = ref.replace("refs/heads/", "");
  const fullName = repository.full_name;
  const [owner, repo] = fullName.split("/");

  // Find matching repo configurations
  const repoConfigs = await prisma.gitHubRepo.findMany({
    where: { owner, repo, branch },
  });

  if (repoConfigs.length === 0) {
    return NextResponse.json({ message: "No matching repos configured" });
  }

  // Sync each matching repo using the sync engine
  const results = [];
  for (const repoConfig of repoConfigs) {
    const result = await syncRepository(repoConfig.id);
    results.push({
      repoId: repoConfig.id,
      ...result,
    });
  }

  return NextResponse.json({ message: "Sync completed", results });
}
