import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ChevronLeft, Pencil, Calendar } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { MarkdownRenderer } from "@/components/reader/markdown-renderer";
import { TableOfContents } from "@/components/reader/table-of-contents";
import { DocSidebar, type SidebarSection } from "@/components/reader/doc-sidebar";
import { formatDistanceToNow } from "date-fns";

interface PageProps {
  params: Promise<{ space: string; slug: string[] }>;
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

async function getSidebarPages(spaceId: string): Promise<SidebarSection[]> {
  const pages = await prisma.page.findMany({
    where: { spaceId, status: "PUBLISHED" },
    orderBy: { position: "asc" },
    select: { id: true, title: true, slug: true, parentId: true },
  });

  // Group into top-level pages and their children
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
    getSidebarPages(space.id),
    getAdjacentPages(space.id, page.position),
  ]);

  const content = page.content || "";

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

  return (
    <>
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-sidebar md:block">
        <div className="sticky top-14 h-[calc(100vh-3.5rem)]">
          <DocSidebar spaceSlug={params.space} sections={sections} />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <div className="mx-auto max-w-4xl px-6 py-8 lg:px-8">
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
          <h1 className="text-3xl font-bold tracking-tight mb-2">{page.title}</h1>

          {/* Metadata bar */}
          <div className="mb-8 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {page.commitDate && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Last updated {formatDistanceToNow(new Date(page.commitDate), { addSuffix: true })}
              </span>
            )}
            {page.commitAuthor && (
              <span>by {page.commitAuthor}</span>
            )}
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

      {/* Table of Contents */}
      <aside className="hidden w-56 shrink-0 xl:block">
        <div className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto p-4">
          <TableOfContents content={content} />
        </div>
      </aside>
    </>
  );
}
