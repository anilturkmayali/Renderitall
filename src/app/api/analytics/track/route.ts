import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST: track a page view (called from the public docs site)
export async function POST(req: NextRequest) {
  try {
    const { spaceSlug, pageSlug, referrer } = await req.json();

    if (!spaceSlug || !pageSlug) {
      return NextResponse.json({ ok: true }); // silently ignore bad requests
    }

    // Store as activity log with special action
    const space = await prisma.space.findFirst({
      where: { slug: spaceSlug },
      select: { id: true, orgId: true },
    });

    if (space) {
      await prisma.activityLog.create({
        data: {
          orgId: space.orgId,
          action: "page_view",
          entity: pageSlug,
          entityId: space.id,
          metadata: {
            spaceSlug,
            pageSlug,
            referrer: referrer || null,
            timestamp: new Date().toISOString(),
          },
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // never fail on analytics
  }
}
