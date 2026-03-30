import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Add a custom domain to a space
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { spaceId, domain } = await req.json();

  if (!spaceId || !domain) {
    return NextResponse.json(
      { error: "spaceId and domain are required" },
      { status: 400 }
    );
  }

  // Normalize domain (lowercase, no protocol, no trailing slash)
  const cleanDomain = domain
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "")
    .trim();

  // Check if domain is already in use
  const existing = await prisma.space.findFirst({
    where: { customDomain: cleanDomain, id: { not: spaceId } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "This domain is already in use by another space" },
      { status: 409 }
    );
  }

  // Add domain to Vercel project (if VERCEL_PROJECT_ID and VERCEL_TEAM_ID are set)
  const vercelResult = await addDomainToVercel(cleanDomain);

  // Update space with domain
  const space = await prisma.space.update({
    where: { id: spaceId },
    data: {
      customDomain: cleanDomain,
      sslEnabled: true,
    },
  });

  return NextResponse.json({
    space,
    vercel: vercelResult,
    instructions: {
      message: "Add the following DNS record to your domain provider:",
      type: "CNAME",
      name: cleanDomain.includes(".")
        ? cleanDomain.split(".")[0]
        : cleanDomain,
      value: "cname.vercel-dns.com",
    },
  });
}

// Check domain verification status
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const domain = searchParams.get("domain");

  if (!domain) {
    return NextResponse.json(
      { error: "domain parameter required" },
      { status: 400 }
    );
  }

  const vercelStatus = await checkDomainOnVercel(domain);
  return NextResponse.json(vercelStatus);
}

// Remove a custom domain
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { spaceId, domain } = await req.json();

  await removeDomainFromVercel(domain);

  await prisma.space.update({
    where: { id: spaceId },
    data: { customDomain: null, sslEnabled: false },
  });

  return NextResponse.json({ success: true });
}

// ─── Vercel Domain API Helpers ───────────────────────────────────────────────

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;

async function addDomainToVercel(domain: string) {
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    return { configured: false, message: "Vercel API not configured. Add domain manually in Vercel dashboard." };
  }

  try {
    const teamParam = VERCEL_TEAM_ID ? `&teamId=${VERCEL_TEAM_ID}` : "";
    const res = await fetch(
      `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains?${teamParam}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${VERCEL_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: domain }),
      }
    );

    const data = await res.json();
    return { configured: true, ...data };
  } catch (err: any) {
    return { configured: false, error: err.message };
  }
}

async function checkDomainOnVercel(domain: string) {
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    return { verified: false, message: "Vercel API not configured" };
  }

  try {
    const teamParam = VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : "";
    const res = await fetch(
      `https://api.vercel.com/v6/domains/${domain}/config${teamParam}`,
      {
        headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
      }
    );

    const data = await res.json();
    return data;
  } catch (err: any) {
    return { verified: false, error: err.message };
  }
}

async function removeDomainFromVercel(domain: string) {
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) return;

  try {
    const teamParam = VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : "";
    await fetch(
      `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}${teamParam}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
      }
    );
  } catch {
    // Non-critical
  }
}
