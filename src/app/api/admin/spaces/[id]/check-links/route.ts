import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const maxDuration = 60;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Get all published pages
  const pages = await prisma.page.findMany({
    where: { spaceId: id, status: "PUBLISHED" },
    select: { title: true, slug: true, content: true },
  });

  const space = await prisma.space.findUnique({
    where: { id },
    select: { slug: true },
  });

  if (!space) return NextResponse.json({ error: "Space not found" }, { status: 404 });

  const allSlugs = new Set(pages.map((p) => p.slug));
  const broken: { page: string; pageSlug: string; link: string; type: string }[] = [];

  for (const page of pages) {
    if (!page.content) continue;

    // Find all markdown links: [text](url)
    const linkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
    let match;

    while ((match = linkRegex.exec(page.content)) !== null) {
      const href = match[2];

      // Skip anchors, mailto, and external links (we only check internal)
      if (href.startsWith("#") || href.startsWith("mailto:")) continue;

      if (href.startsWith("http://") || href.startsWith("https://")) {
        // External link — quick HEAD check
        try {
          const res = await fetch(href, { method: "HEAD", signal: AbortSignal.timeout(5000) });
          if (res.status >= 400) {
            broken.push({ page: page.title, pageSlug: page.slug, link: href, type: "external" });
          }
        } catch {
          broken.push({ page: page.title, pageSlug: page.slug, link: href, type: "external" });
        }
      } else {
        // Internal link — check if slug exists
        const cleanHref = href.split("#")[0].replace(/^\/docs\/[^/]+\//, "").replace(/^\//, "");
        if (cleanHref && !allSlugs.has(cleanHref) && !allSlugs.has(cleanHref.toLowerCase())) {
          broken.push({ page: page.title, pageSlug: page.slug, link: href, type: "internal" });
        }
      }
    }
  }

  return NextResponse.json({
    totalPages: pages.length,
    totalLinks: broken.length === 0 ? "All links valid" : `${broken.length} broken links found`,
    broken,
  });
}
