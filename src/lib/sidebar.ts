import { prisma } from "@/lib/prisma";
import type { SidebarSection } from "@/components/reader/doc-sidebar";

/**
 * Build sidebar sections for a space from NavItems or page hierarchy.
 * Shared between the docs landing page and doc pages.
 */
export async function getSidebarSections(
  spaceId: string
): Promise<SidebarSection[]> {
  // Try NavItem-based navigation first
  const navItems = await prisma.navItem.findMany({
    where: { spaceId, parentId: null },
    orderBy: { position: "asc" },
    include: {
      children: {
        orderBy: { position: "asc" },
        include: {
          children: { orderBy: { position: "asc" } },
        },
      },
    },
  });

  if (navItems.length > 0) {
    // Collect all pageIds that are non-null
    const allPageIds = new Set<string>();
    for (const item of navItems) {
      if (item.pageId) allPageIds.add(item.pageId);
      for (const child of item.children || []) {
        if (child.pageId) allPageIds.add(child.pageId);
        for (const gc of (child as any).children || []) {
          if (gc.pageId) allPageIds.add(gc.pageId);
        }
      }
    }

    // Fetch slugs for all referenced pages
    const pagesById = await prisma.page.findMany({
      where: { id: { in: Array.from(allPageIds) } },
      select: { id: true, slug: true, title: true },
    });
    const slugMap = new Map(pagesById.map((p) => [p.id, p.slug]));

    // Also build a title->slug map for fallback matching
    const allSpacePages = await prisma.page.findMany({
      where: { spaceId, status: "PUBLISHED" },
      select: { id: true, slug: true, title: true },
    });
    const titleSlugMap = new Map(
      allSpacePages.map((p) => [p.title.toLowerCase(), { id: p.id, slug: p.slug }])
    );
    const idSlugMap = new Map(
      allSpacePages.map((p) => [p.id, p.slug])
    );

    function resolveSlug(pageId: string | null, label: string): string {
      // 1. Direct pageId lookup
      if (pageId && slugMap.has(pageId)) {
        return slugMap.get(pageId)!;
      }
      // 2. Try by pageId in all space pages
      if (pageId && idSlugMap.has(pageId)) {
        return idSlugMap.get(pageId)!;
      }
      // 3. Fallback: match by title
      const match = titleSlugMap.get(label.toLowerCase());
      if (match) return match.slug;
      // 4. Give up — return empty (item won't be clickable)
      return "";
    }

    function resolveId(pageId: string | null, label: string): string {
      if (pageId && (slugMap.has(pageId) || idSlugMap.has(pageId))) {
        return pageId;
      }
      const match = titleSlugMap.get(label.toLowerCase());
      if (match) return match.id;
      return pageId || "";
    }

    // Build sections
    const sections: SidebarSection[] = [];
    let currentSection: SidebarSection = { label: "", pages: [] };

    for (const item of navItems) {
      if (item.type === "SECTION") {
        if (currentSection.pages.length > 0 || currentSection.label) {
          sections.push(currentSection);
        }
        currentSection = {
          label: item.label,
          pages: (item.children || [])
            .filter((child) => child.type === "PAGE" || child.type === "SECTION")
            .map((child) => ({
              id: resolveId(child.pageId, child.label),
              title: child.label,
              slug: resolveSlug(child.pageId, child.label),
              children: ((child as any).children || []).map((gc: any) => ({
                id: resolveId(gc.pageId, gc.label),
                title: gc.label,
                slug: resolveSlug(gc.pageId, gc.label),
              })),
            })),
        };
      } else if (item.type === "PAGE") {
        currentSection.pages.push({
          id: resolveId(item.pageId, item.label),
          title: item.label,
          slug: resolveSlug(item.pageId, item.label),
          children: (item.children || []).map((child) => ({
            id: resolveId(child.pageId, child.label),
            title: child.label,
            slug: resolveSlug(child.pageId, child.label),
          })),
        });
      }
    }
    if (currentSection.pages.length > 0 || currentSection.label) {
      sections.push(currentSection);
    }

    // Filter out pages with empty slugs (unresolvable)
    for (const section of sections) {
      section.pages = section.pages.filter((p) => p.slug);
      for (const page of section.pages) {
        if (page.children) {
          page.children = page.children.filter((c) => c.slug);
        }
      }
    }

    return sections.filter((s) => s.pages.length > 0 || s.label);
  }

  // Fallback: build from page hierarchy
  const pages = await prisma.page.findMany({
    where: { spaceId, status: "PUBLISHED" },
    orderBy: { position: "asc" },
    select: { id: true, title: true, slug: true, parentId: true },
  });

  const topLevel = pages.filter((p) => !p.parentId);
  const childMap = new Map<string, typeof pages>();
  pages.forEach((p) => {
    if (p.parentId) {
      const existing = childMap.get(p.parentId) || [];
      existing.push(p);
      childMap.set(p.parentId, existing);
    }
  });

  return [
    {
      label: "Documentation",
      pages: topLevel.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        children: (childMap.get(p.id) || []).map((c) => ({
          id: c.id,
          title: c.title,
          slug: c.slug,
        })),
      })),
    },
  ];
}
