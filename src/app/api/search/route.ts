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
      { slug: { contains: q, mode: "insensitive" } },
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
      space: { select: { slug: true, name: true } },
    },
  });

  const qLower = q.toLowerCase();

  const results = pages
    .map((page) => {
      // Score: title match > heading match > content match
      let score = 0;
      if (page.title.toLowerCase().includes(qLower)) score += 100;

      // Check for heading matches
      let excerpt = "";
      if (page.content) {
        const lines = page.content.split("\n");
        const headingMatch = lines.find(
          (line) =>
            line.startsWith("#") && line.toLowerCase().includes(qLower)
        );

        if (headingMatch) {
          score += 50;
          excerpt = headingMatch.replace(/^#+\s*/, "");
        } else {
          // Extract excerpt around the content match
          const idx = page.content.toLowerCase().indexOf(qLower);
          if (idx >= 0) {
            score += 10;
            const start = Math.max(0, idx - 80);
            const end = Math.min(page.content.length, idx + q.length + 80);
            excerpt =
              (start > 0 ? "..." : "") +
              page.content
                .slice(start, end)
                .replace(/\n/g, " ")
                .trim() +
              (end < page.content.length ? "..." : "");
          }
        }
      }

      return {
        id: page.id,
        title: page.title,
        slug: page.slug,
        excerpt,
        spaceSlug: page.space.slug,
        spaceName: page.space.name,
        score,
      };
    })
    .sort((a, b) => b.score - a.score);

  return NextResponse.json({ results });
}
