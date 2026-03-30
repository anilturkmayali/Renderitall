import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ChevronLeft, Pencil, Calendar } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { MarkdownRenderer } from "@/components/reader/markdown-renderer";
import { TableOfContents } from "@/components/reader/table-of-contents";
import { DocSidebar, type SidebarSection } from "@/components/reader/doc-sidebar";
import { MobileSidebar } from "@/components/reader/mobile-sidebar";
import { formatDistanceToNow } from "date-fns";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ space: string; slug: string[] }>;
}

export async function generateMetadata({
  params: paramsPromise,
}: PageProps): Promise<Metadata> {
  const params = await paramsPromise;
  const space = await prisma.space.findFirst({
    where: { slug: params.space, isPublic: true },
    select: { id: true, name: true },
  });
  if (!space) return {};

  const slug = params.slug.join("/");
  const page = await prisma.page.findFirst({
    where: { spaceId: space.id, slug, status: "PUBLISHED" },
    select: { title: true, excerpt: true },
  });
  if (!page) return {};

  return {
    title: page.title,
    description: page.excerpt || `${page.title} — ${space.name}`,
    openGraph: {
      title: page.title,
      description: page.excerpt || `${page.title} — ${space.name}`,
      type: "article",
    },
  };
}

async function getSpace(slug: string) {
  return prisma.space.findFirst({
    where: { slug, isPublic: true },
    include: { org: { select: { name: true, logo: true } } },
  });
}

async function getPage(spaceId: string, slug: string) {
  return prisma.page.findFirst({
    where: {
      spaceId,
      slug,
      status: "PUBLISHED",
    },
    include: {
      githubRepo: { select: { owner: true, repo: true, branch: true } },
    },
  });
}

async function getSidebarFromNav(spaceId: string): Promise<SidebarSection[]> {
  // First try NavItem-based navigation
  const navItems = await prisma.navItem.findMany({
    where: { spaceId, parentId: null },
    orderBy: { position: "asc" },
    include: {
      children: {
        orderBy: { position: "asc" },
        include: {
          children: {
            orderBy: { position: "asc" },
          },
        },
      },
    },
  });

  if (navItems.length > 0) {
    // Convert NavItems to sidebar sections
    const sections: SidebarSection[] = [];
    let currentSection: SidebarSection = { label: "", pages: [] };

    for (const item of navItems) {
      if (item.type === "SECTION") {
        // Start a new section
        if (currentSection.pages.length > 0 || currentSection.label) {
          sections.push(currentSection);
        }
        currentSection = {
          label: item.label,
          pages: item.children.map((child) => ({
            id: child.pageId || child.id,
            title: child.label,
            slug: "", // Will be resolved below
            children: child.children?.map((grandchild) => ({
              id: grandchild.pageId || grandchild.id,
              title: grandchild.label,
              slug: "",
            })) || [],
          })),
        };
      } else if (item.type === "PAGE") {
        currentSection.pages.push({
          id: item.pageId || item.id,
          title: item.label,
          slug: "",
          children: item.children?.map((child) => ({
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

    // Resolve slugs for pages
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

  const sidebarPages = topLevel.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    children: (childMap.get(p.id) || []).map((c) => ({
      id: c.id,
      title: c.title,
      slug: c.slug,
    })),
  }));

  return [{ label: "Documentation", pages: sidebarPages }];
}

async function getAdjacentPages(spaceId: string, currentPosition: number) {
  const [prev, next] = await Promise.all([
    prisma.page.findFirst({
      where: { spaceId, status: "PUBLISHED", position: { lt: currentPosition } },
      orderBy: { position: "desc" },
      select: { title: true, slug: true },
    }),
    prisma.page.findFirst({
      where: { spaceId, status: "PUBLISHED", position: { gt: currentPosition } },
      orderBy: { position: "asc" },
      select: { title: true, slug: true },
    }),
  ]);
  return { prev, next };
}

export default async function DocPage({ params: paramsPromise }: PageProps) {
  const params = await paramsPromise;
  const space = await getSpace(params.space);
  if (!space) notFound();

  const slug = params.slug.join("/");
  const page = await getPage(space.id, slug);
  if (!page) notFound();

  const [sections, adjacent] = await Promise.all([
    getSidebarFromNav(space.id),
    getAdjacentPages(space.id, page.position),
  ]);

  const content = page.content || "";
  const template = space.headerLayout || "default";

  // Build "Edit on GitHub" link
  let editUrl: string | undefined;
  if (page.githubRepo && page.githubPath) {
    editUrl = `https://github.com/${page.githubRepo.owner}/${page.githubRepo.repo}/edit/${page.githubRepo.branch}/${page.githubPath}`;
  }

  // Breadcrumbs
  const slugParts = slug.split("/");
  const breadcrumbs = slugParts.map((part, i) => ({
    label: part.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    href: `/docs/${params.space}/${slugParts.slice(0, i + 1).join("/")}`,
  }));

  const isMinimal = template === "minimal";
  const isModern = template === "modern";

  return (
    <>
      {/* Mobile sidebar */}
      <div className="fixed bottom-4 left-4 z-30 md:hidden">
        <MobileSidebar spaceSlug={params.space} sections={sections} />
      </div>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden shrink-0 border-r bg-sidebar md:block ${
          isMinimal ? "w-56" : "w-64"
        }`}
      >
        <div className="sticky top-14 h-[calc(100vh-3.5rem)]">
          <DocSidebar spaceSlug={params.space} sections={sections} />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <div
          className={`mx-auto px-6 py-8 lg:px-8 ${
            isMinimal ? "max-w-3xl" : isModern ? "max-w-5xl" : "max-w-4xl"
          }`}
        >
          {/* Breadcrumbs */}
          <nav className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
            <Link href={`/docs/${params.space}`} className="hover:text-foreground">
              {space.name || params.space}
            </Link>
            {breadcrumbs.map((bc) => (
              <span key={bc.href} className="flex items-center gap-1">
                <ChevronRight className="h-3.5 w-3.5" />
                <Link href={bc.href} className="hover:text-foreground">
                  {bc.label}
                </Link>
              </span>
            ))}
          </nav>

          {/* Page title */}
          <h1
            className={`font-bold tracking-tight mb-2 ${
              isModern ? "text-4xl" : "text-3xl"
            }`}
            style={
              space.primaryColor
                ? ({ "--title-color": space.primaryColor } as React.CSSProperties)
                : undefined
            }
          >
            {page.title}
          </h1>

          {/* Page description/excerpt */}
          {page.excerpt && (
            <p className="text-lg text-muted-foreground mb-4">
              {page.excerpt}
            </p>
          )}

          {/* Metadata bar */}
          <div className="mb-8 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {page.commitDate && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Last updated{" "}
                {formatDistanceToNow(new Date(page.commitDate), {
                  addSuffix: true,
                })}
              </span>
            )}
            {page.commitAuthor && <span>by {page.commitAuthor}</span>}
            {editUrl && (
              <Link
                href={editUrl}
                target="_blank"
                className="ml-auto flex items-center gap-1.5 hover:text-foreground transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit this page
              </Link>
            )}
          </div>

          {/* Markdown content */}
          <MarkdownRenderer content={content} />

          {/* Previous / Next navigation */}
          <div className="mt-16 flex items-stretch gap-4 border-t pt-8">
            {adjacent.prev ? (
              <Link
                href={`/docs/${params.space}/${adjacent.prev.slug}`}
                className="group flex flex-1 flex-col items-start rounded-lg border p-4 transition-colors hover:bg-muted"
              >
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <ChevronLeft className="h-3 w-3" />
                  Previous
                </span>
                <span className="mt-1 font-medium group-hover:text-primary">
                  {adjacent.prev.title}
                </span>
              </Link>
            ) : (
              <div className="flex-1" />
            )}
            {adjacent.next ? (
              <Link
                href={`/docs/${params.space}/${adjacent.next.slug}`}
                className="group flex flex-1 flex-col items-end rounded-lg border p-4 transition-colors hover:bg-muted"
              >
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  Next
                  <ChevronRight className="h-3 w-3" />
                </span>
                <span className="mt-1 font-medium group-hover:text-primary">
                  {adjacent.next.title}
                </span>
              </Link>
            ) : (
              <div className="flex-1" />
            )}
          </div>
        </div>
      </main>

      {/* Table of Contents (hidden in minimal template) */}
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
