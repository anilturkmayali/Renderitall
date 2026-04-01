import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: look up which space a custom domain belongs to
export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get("domain");

  if (!domain) {
    return NextResponse.json({ error: "domain required" }, { status: 400 });
  }

  // Clean the domain (remove port if present)
  const cleanDomain = domain.split(":")[0].toLowerCase();

  const space = await prisma.space.findFirst({
    where: { customDomain: cleanDomain },
    select: { slug: true },
  });

  if (!space) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }

  return NextResponse.json({ spaceSlug: space.slug });
}
