import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ChevronLeft, Pencil, Calendar } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSidebarSections } from "@/lib/sidebar";
import { MarkdownRenderer } from "@/components/reader/markdown-renderer";
import { TableOfContents } from "@/components/reader/table-of-contents";
import { DocSidebar } from "@/components/reader/doc-sidebar";
import { MobileSidebar } from "@/components/reader/mobile-sidebar";
import { CollapsibleSidebar } from "@/components/reader/collapsible-sidebar";
import { PdfButton } from "@/components/reader/pdf-button";
import { formatDistanceToNow } from "date-fns";
import { unstable_cache } from "next/cache";
import type { Metadata } from "next";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ space: string; slug: string[] }>;
}

export async function generateMetadata({ params: paramsPromise }: PageProps): Promise<Metadata> {
  const params = await paramsPromise;
  const space = await getSpace(params.space);
  if (!space) return {};
  const slug = params.slug.join("/");
  const page = await findPage(space.id, slug);
  if (!page) return {};
  return {
    title: page.title,
    description: page.excerpt || `${page.title} — ${space.name}`,
    openGraph: { title: page.title, description: page.excerpt || `${page.title} — ${space.name}`, type: "article" },
  };
}

// ─── Data fetching ───────────────────────────────────────────────────────────

const getSpace = unstable_cache(
  async (slug: string) => {
    return prisma.space.findFirst({
      where: { slug, isPublic: true },
      include: { org: { select: { name: true, logo: true } } },
    });
  },
  ["space"],
  { revalidate: 120 }
);

/**
 * Find a page by slug. Tries multiple strategies:
 * 1. Exact slug match
 * 2. Case-insensitive match
 * 3. If first slug segment matches a repo slug, look for page within that repo
 * 4. If slug matches a repo slug exactly, return the repo's home page
 */
async function findPage(spaceId: string, slug: string) {
  // Strategy 1: exact match
  let page = await prisma.page.findFirst({
    where: { spaceId, slug, status: "PUBLISHED" },
    include: { githubRepo: { select: { owner: true, repo: true, branch: true, slug: true, displayName: true, homePageId: true, config: true } } },
  });
  if (page) return page;

  // Strategy 2: case-insensitive
  page = await prisma.page.findFirst({
    where: { spaceId, slug: { equals: slug, mode: "insensitive" }, status: "PUBLISHED" },
    include: { githubRepo: { select: { owner: true, repo: true, branch: true, slug: true, displayName: true, homePageId: true, config: true } } },
  });
  if (page) return page;

  // Strategy 3: slug might be "{repoSlug}" or "{repoSlug}/{pageSlug}"
  const slugParts = slug.split("/");
  const firstPart = slugParts[0];

  // Find a repo whose slug matches the first part
  const repo = await prisma.gitHubRepo.findFirst({
    where: {
      spaceId,
      OR: [
        { slug: firstPart },
        { slug: { equals: firstPart, mode: "insensitive" } },
        { repo: { equals: firstPart, mode: "insensitive" } },
      ],
    },
  });

  if (repo) {
    if (slugParts.length === 1) {
      // Just the repo slug — return the home page
      if (repo.homePageId) {
        page = await prisma.page.findFirst({
          where: { id: repo.homePageId, status: "PUBLISHED" },
          include: { githubRepo: { select: { owner: true, repo: true, branch: true, slug: true, displayName: true, homePageId: true, config: true } } },
        });
        if (page) return page;
      }
      // No home page set — return the first page of the repo
      page = await prisma.page.findFirst({
        where: { spaceId, githubRepoId: repo.id, status: "PUBLISHED" },
        orderBy: { position: "asc" },
        include: { githubRepo: { select: { owner: true, repo: true, branch: true, slug: true, displayName: true, homePageId: true, config: true } } },
      });
      if (page) return page;
    } else {
      // "{repoSlug}/{rest}" — look for a page with slug = rest within this repo
      const restSlug = slugParts.slice(1).join("/");
      page = await prisma.page.findFirst({
        where: { spaceId, githubRepoId: repo.id, slug: restSlug, status: "PUBLISHED" },
        include: { githubRepo: { select: { owner: true, repo: true, branch: true, slug: true, displayName: true, homePageId: true, config: true } } },
      });
      if (page) return page;

      // Case-insensitive
      page = await prisma.page.findFirst({
        where: { spaceId, githubRepoId: repo.id, slug: { equals: restSlug, mode: "insensitive" }, status: "PUBLISHED" },
        include: { githubRepo: { select: { owner: true, repo: true, branch: true, slug: true, displayName: true, homePageId: true, config: true } } },
      });
      if (page) return page;
    }
  }

  return null;
}

const getCachedSidebar = unstable_cache(
  async (spaceId: string) => getSidebarSections(spaceId),
  ["sidebar-page"],
  { revalidate: 120 }
);

const getAdjacentPages = unstable_cache(
  async (spaceId: string, currentPosition: number) => {
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
  },
  ["adjacent"],
  { revalidate: 60 }
);

// ─── Page Component ──────────────────────────────────────────────────────────

export default async function DocPage({ params: paramsPromise }: PageProps) {
  const params = await paramsPromise;
  const space = await getSpace(params.space);
  if (!space) notFound();

  const slug = params.slug.join("/");
  const page = await findPage(space.id, slug);
  if (!page) notFound();

  const [sections, adjacent] = await Promise.all([
    getCachedSidebar(space.id),
    getAdjacentPages(space.id, page.position),
  ]);

  const content = page.content || "";
  const template = space.headerLayout || "default";
  const isMinimal = template === "minimal";
  const isModern = template === "modern";

  let editUrl: string | undefined;
  if (page.githubRepo && page.githubPath) {
    editUrl = `https://github.com/${page.githubRepo.owner}/${page.githubRepo.repo}/edit/${page.githubRepo.branch}/${page.githubPath}`;
  }

  const slugParts = slug.split("/");
  const breadcrumbs = slugParts.map((part, i) => ({
    label: part.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    href: `/docs/${params.space}/${slugParts.slice(0, i + 1).join("/")}`,
  }));

  const contentBlock = (
    <>
      <nav className="mb-6 flex items-center gap-1 text-sm text-muted-foreground flex-wrap">
        <Link href={`/docs/${params.space}`} className="hover:text-foreground">{space.name || params.space}</Link>
        {breadcrumbs.map((bc) => (
          <span key={bc.href} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href={bc.href} className="hover:text-foreground">{bc.label}</Link>
          </span>
        ))}
      </nav>

      <h1 className={`font-bold tracking-tight mb-2 ${isModern ? "text-4xl" : "text-3xl"}`}>{page.title}</h1>
      {page.excerpt && <p className="text-lg text-muted-foreground mb-4">{page.excerpt}</p>}

      <div className="mb-8 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        {page.commitDate && (
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Last updated {formatDistanceToNow(new Date(page.commitDate), { addSuffix: true })}
          </span>
        )}
        {page.commitAuthor && <span>by {page.commitAuthor}</span>}
        <div className="ml-auto flex items-center gap-4">
          {editUrl && (
            <Link href={editUrl} target="_blank" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
              <Pencil className="h-3.5 w-3.5" />Edit this page
            </Link>
          )}
        </div>
      </div>

      <MarkdownRenderer content={content} />

      <div className="mt-16 flex items-stretch gap-4 border-t pt-8">
        {adjacent.prev ? (
          <Link href={`/docs/${params.space}/${adjacent.prev.slug}`} className="group flex flex-1 flex-col items-start rounded-lg border p-4 transition-colors hover:bg-muted">
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><ChevronLeft className="h-3 w-3" />Previous</span>
            <span className="mt-1 font-medium group-hover:text-primary">{adjacent.prev.title}</span>
          </Link>
        ) : <div className="flex-1" />}
        {adjacent.next ? (
          <Link href={`/docs/${params.space}/${adjacent.next.slug}`} className="group flex flex-1 flex-col items-end rounded-lg border p-4 transition-colors hover:bg-muted">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">Next<ChevronRight className="h-3 w-3" /></span>
            <span className="mt-1 font-medium group-hover:text-primary">{adjacent.next.title}</span>
          </Link>
        ) : <div className="flex-1" />}
      </div>
    </>
  );

  // MINIMAL: no sidebar, centered, hamburger only
  if (isMinimal) {
    return (
      <>
        <div className="fixed bottom-4 left-4 z-30">
          <MobileSidebar spaceSlug={params.space} sections={sections} />
        </div>
        <main className="flex-1 min-w-0">
          <div className="mx-auto max-w-3xl px-6 py-8 lg:px-8">{contentBlock}</div>
        </main>
      </>
    );
  }

  // CLASSIC & MODERN: collapsible sidebar + content + TOC
  return (
    <>
      <div className="fixed bottom-4 left-4 z-30 md:hidden">
        <MobileSidebar spaceSlug={params.space} sections={sections} />
      </div>

      <CollapsibleSidebar>
        <DocSidebar spaceSlug={params.space} sections={sections} />
      </CollapsibleSidebar>

      <main className="flex-1 min-w-0">
        <div className={`mx-auto px-6 py-8 lg:px-8 ${isModern ? "max-w-5xl" : "max-w-4xl"}`}>
          {contentBlock}
        </div>
      </main>

      <aside className="hidden w-56 shrink-0 xl:block">
        <div className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto p-4">
          <TableOfContents content={content} />
        </div>
      </aside>
    </>
  );
}
