import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BookOpen, FileText, ArrowRight, ChevronRight } from "lucide-react";
import { DocSidebar, type SidebarSection } from "@/components/reader/doc-sidebar";
import { MobileSidebar } from "@/components/reader/mobile-sidebar";

interface PageProps {
  params: Promise<{ space: string }>;
}

export default async function DocsHomePage({
  params: paramsPromise,
}: PageProps) {
  const { space: spaceSlug } = await paramsPromise;

  const space = await prisma.space.findFirst({
    where: { slug: spaceSlug, isPublic: true },
    include: {
      org: { select: { name: true } },
    },
  });

  if (!space) notFound();

  // Get first page to redirect or link to
  const firstPage = await prisma.page.findFirst({
    where: { spaceId: space.id, status: "PUBLISHED" },
    orderBy: { position: "asc" },
    select: { slug: true, title: true, content: true },
  });

  // If first page exists and has content, render it as the home page
  // This mimics GitBook behavior where the first page IS the landing page
  if (firstPage?.content) {
    // Build sidebar sections for the layout
    const sections = await getSidebarSections(space.id);

    // Dynamic import of markdown renderer (to avoid SSR issues)
    const { MarkdownRenderer } = await import(
      "@/components/reader/markdown-renderer"
    );
    const { TableOfContents } = await import(
      "@/components/reader/table-of-contents"
    );

    const content = firstPage.content;
    const isMinimal = space.headerLayout === "minimal";

    return (
      <>
        {/* Mobile sidebar */}
        <div className="fixed bottom-4 left-4 z-30 md:hidden">
          <MobileSidebar spaceSlug={spaceSlug} sections={sections} />
        </div>

        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r bg-sidebar md:block">
          <div className="sticky top-14 h-[calc(100vh-3.5rem)]">
            <DocSidebar spaceSlug={spaceSlug} sections={sections} />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <div className="mx-auto max-w-4xl px-6 py-8 lg:px-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              {space.name}
            </h1>
            {space.description && (
              <p className="text-lg text-muted-foreground mb-8">
                {space.description}
              </p>
            )}
            <MarkdownRenderer content={content} />
          </div>
        </main>

        {/* Table of Contents */}
        {!isMinimal && (
          <aside className="hidden w-56 shrink-0 xl:block">
            <div className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto p-4">
              <TableOfContents content={content} />
            </div>
          </aside>
        )}
      </>
    );
  }

  // Fallback: show a welcome/overview page if no content exists yet
  const sections = await getSidebarSections(space.id);

  const pageCount = await prisma.page.count({
    where: { spaceId: space.id, status: "PUBLISHED" },
  });

  return (
    <>
      {/* Mobile sidebar */}
      <div className="fixed bottom-4 left-4 z-30 md:hidden">
        <MobileSidebar spaceSlug={spaceSlug} sections={sections} />
      </div>

      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-sidebar md:block">
        <div className="sticky top-14 h-[calc(100vh-3.5rem)]">
          <DocSidebar spaceSlug={spaceSlug} sections={sections} />
        </div>
      </aside>

      {/* Main content - welcome page */}
      <main className="flex-1 min-w-0">
        <div className="mx-auto max-w-3xl px-6 py-12 lg:px-8">
          <div className="mb-10">
            <h1 className="text-3xl font-bold tracking-tight mb-3">
              Welcome to {space.name}
            </h1>
            {space.description && (
              <p className="text-lg text-muted-foreground">
                {space.description}
              </p>
            )}
          </div>

          {/* Section links */}
          {sections.length > 0 && (
            <div className="space-y-6">
              {sections.map((section) => (
                <div key={section.label}>
                  {section.label && (
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      {section.label}
                    </h2>
                  )}
                  <div className="grid gap-2">
                    {section.pages.map((page) => (
                      <Link
                        key={page.id}
                        href={`/docs/${spaceSlug}/${page.slug}`}
                        className="group flex items-center justify-between rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50 hover:border-primary/30"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">
                            {page.title}
                          </span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {pageCount === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <BookOpen className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="font-medium">No content yet</p>
              <p className="text-sm mt-1">
                Connect a GitHub repository and sync to populate this space.
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

// ─── Helper: Build sidebar sections ──────────────────────────────────────────

async function getSidebarSections(
  spaceId: string
): Promise<SidebarSection[]> {
  // Try NavItem-based navigation
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
    const sections: SidebarSection[] = [];
    let currentSection: SidebarSection = { label: "", pages: [] };

    for (const item of navItems) {
      if (item.type === "SECTION") {
        if (currentSection.pages.length > 0 || currentSection.label) {
          sections.push(currentSection);
        }
        currentSection = {
          label: item.label,
          pages: item.children.map((child) => ({
            id: child.pageId || child.id,
            title: child.label,
            slug: "",
            children:
              child.children?.map((gc) => ({
                id: gc.pageId || gc.id,
                title: gc.label,
                slug: "",
              })) || [],
          })),
        };
      } else if (item.type === "PAGE") {
        currentSection.pages.push({
          id: item.pageId || item.id,
          title: item.label,
          slug: "",
          children:
            item.children?.map((child) => ({
              id: child.pageId || child.id,
              title: child.label,
              slug: "",
            })) || [],
        });
      }
    }
    if (currentSection.pages.length > 0 || currentSection.label) {
      sections.push(currentSection);
    }

    // Resolve slugs
    const allPageIds = new Set<string>();
    for (const section of sections) {
      for (const page of section.pages) {
        allPageIds.add(page.id);
        for (const child of page.children || []) {
          allPageIds.add(child.id);
        }
      }
    }

    const pages = await prisma.page.findMany({
      where: { id: { in: Array.from(allPageIds) } },
      select: { id: true, slug: true },
    });
    const slugMap = new Map(pages.map((p) => [p.id, p.slug]));

    for (const section of sections) {
      for (const page of section.pages) {
        page.slug = slugMap.get(page.id) || page.id;
        for (const child of page.children || []) {
          child.slug = slugMap.get(child.id) || child.id;
        }
      }
    }

    return sections;
  }

  // Fallback: page hierarchy
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
