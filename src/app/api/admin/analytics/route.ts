import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") || "30");
  const spaceId = searchParams.get("spaceId") || undefined;

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Get the user's org
  const membership = await prisma.orgMember.findFirst({
    where: { userId: session.user.id },
    select: { orgId: true },
  });
  if (!membership) return NextResponse.json({ totalViews: 0, pages: [], daily: [] });

  const where: any = {
    orgId: membership.orgId,
    action: "page_view",
    createdAt: { gte: since },
  };
  if (spaceId) where.entityId = spaceId;

  // Total views
  const totalViews = await prisma.activityLog.count({ where });

  // Views per page (top 20)
  const pageViews = await prisma.activityLog.groupBy({
    by: ["entity"],
    where,
    _count: { entity: true },
    orderBy: { _count: { entity: "desc" } },
    take: 20,
  });

  // Daily views (last N days)
  const allViews = await prisma.activityLog.findMany({
    where,
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const dailyMap = new Map<string, number>();
  for (let d = 0; d < days; d++) {
    const date = new Date(Date.now() - d * 24 * 60 * 60 * 1000);
    dailyMap.set(date.toISOString().slice(0, 10), 0);
  }
  allViews.forEach((v) => {
    const key = v.createdAt.toISOString().slice(0, 10);
    dailyMap.set(key, (dailyMap.get(key) || 0) + 1);
  });

  const daily = Array.from(dailyMap.entries())
    .map(([date, views]) => ({ date, views }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Unique visitors (approximate — based on unique referrer + day combos)
  const uniqueDays = new Set(allViews.map((v) => v.createdAt.toISOString().slice(0, 10)));

  return NextResponse.json({
    totalViews,
    uniqueDays: uniqueDays.size,
    pages: pageViews.map((p) => ({ slug: p.entity, views: p._count.entity })),
    daily,
  });
}
