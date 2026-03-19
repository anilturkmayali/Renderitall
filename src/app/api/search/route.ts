import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const spaceSlug = searchParams.get("space");

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const where: Record<string, unknown> = {
    status: "PUBLISHED",
    OR: [
      { title: { contains: q, mode: "insensitive" } },
      { content: { contains: q, mode: "insensitive" } },
    ],
  };

  if (spaceSlug) {
    where.space = { slug: spaceSlug };
  }

  const pages = await prisma.page.findMany({
    where,
    take: 20,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      content: true,
      space: { select: { slug: true } },
    },
  });

  const results = pages.map((page) => {
    // Extract excerpt around the match
    let excerpt = "";
    if (page.content) {
      const idx = page.content.toLowerCase().indexOf(q.toLowerCase());
      if (idx >= 0) {
        const start = Math.max(0, idx - 60);
        const end = Math.min(page.content.length, idx + q.length + 60);
        excerpt = (start > 0 ? "..." : "") + page.content.slice(start, end) + (end < page.content.length ? "..." : "");
      }
    }

    return {
      id: page.id,
      title: page.title,
      slug: page.slug,
      excerpt,
      spaceSlug: page.space.slug,
    };
  });

  return NextResponse.json({ results });
}
