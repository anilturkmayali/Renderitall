import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSidebarSections } from "@/lib/sidebar";
import { BookOpen, FileText, ChevronRight } from "lucide-react";
import { DocSidebar } from "@/components/reader/doc-sidebar";
import { MobileSidebar } from "@/components/reader/mobile-sidebar";
import { CollapsibleSidebar } from "@/components/reader/collapsible-sidebar";
import { unstable_cache } from "next/cache";

export const revalidate = 60;

const getCachedSidebar = unstable_cache(
  async (spaceId: string) => getSidebarSections(spaceId),
  ["sidebar-home"],
  { revalidate: 120 }
);

interface PageProps {
  params: Promise<{ space: string }>;
}

export default async function DocsHomePage({
  params: paramsPromise,
}: PageProps) {
  const { space: spaceSlug } = await paramsPromise;

  const space = await prisma.space.findFirst({
    where: { slug: spaceSlug, isPublic: true },
    include: { org: { select: { name: true } } },
  });

  if (!space) notFound();

  const sections = await getCachedSidebar(space.id);

  // Get homepage: user-selected (space.icon stores homepage page ID) or first page
  let homePage = null;
  if (space.icon) {
    homePage = await prisma.page.findFirst({
      where: { id: space.icon, status: "PUBLISHED" },
      select: { slug: true, title: true, content: true },
    });
  }
  if (!homePage) {
    homePage = await prisma.page.findFirst({
      where: { spaceId: space.id, status: "PUBLISHED" },
      orderBy: { position: "asc" },
      select: { slug: true, title: true, content: true },
    });
  }
  const firstPage = homePage;

  if (firstPage?.content) {
    const { MarkdownRenderer } = await import(
      "@/components/reader/markdown-renderer"
    );
    const { TableOfContents } = await import(
      "@/components/reader/table-of-contents"
    );

    const isMinimal = space.headerLayout === "minimal";

    return (
      <>
        <div className="fixed bottom-4 left-4 z-30 md:hidden">
          <MobileSidebar spaceSlug={spaceSlug} sections={sections} />
        </div>

        <CollapsibleSidebar>
          <DocSidebar spaceSlug={spaceSlug} sections={sections} />
        </CollapsibleSidebar>

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
            <MarkdownRenderer content={firstPage.content} />
          </div>
        </main>

        {!isMinimal && (
          <aside className="hidden w-56 shrink-0 xl:block">
            <div className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto p-4">
              <TableOfContents content={firstPage.content} />
            </div>
          </aside>
        )}
      </>
    );
  }

  // Fallback: welcome page with section links
  const pageCount = await prisma.page.count({
    where: { spaceId: space.id, status: "PUBLISHED" },
  });

  return (
    <>
      <div className="fixed bottom-4 left-4 z-30 md:hidden">
        <MobileSidebar spaceSlug={spaceSlug} sections={sections} />
      </div>

      <CollapsibleSidebar>
        <DocSidebar spaceSlug={spaceSlug} sections={sections} />
      </CollapsibleSidebar>

      <main className="flex-1 min-w-0">
        <div className="mx-auto max-w-3xl px-6 py-12 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight mb-3">
            Welcome to {space.name}
          </h1>
          {space.description && (
            <p className="text-lg text-muted-foreground mb-10">
              {space.description}
            </p>
          )}

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
