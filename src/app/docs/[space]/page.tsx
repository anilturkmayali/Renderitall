import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BookOpen, FileText, Github, ArrowRight } from "lucide-react";

interface PageProps {
  params: Promise<{ space: string }>;
}

export default async function DocsHomePage({ params: paramsPromise }: PageProps) {
  const { space: spaceSlug } = await paramsPromise;

  const space = await prisma.space.findFirst({
    where: { slug: spaceSlug, isPublic: true },
    include: {
      org: { select: { name: true } },
      githubRepos: { select: { owner: true, repo: true } },
    },
  });

  if (!space) notFound();

  // Try to find a landing page or redirect to first page
  const firstPage = await prisma.page.findFirst({
    where: { spaceId: space.id, status: "PUBLISHED" },
    orderBy: { position: "asc" },
    select: { slug: true },
  });

  // Get nav sections for the landing page
  const navItems = await prisma.navItem.findMany({
    where: { spaceId: space.id, parentId: null },
    orderBy: { position: "asc" },
    include: {
      children: {
        orderBy: { position: "asc" },
        take: 5,
      },
    },
  });

  const pageCount = await prisma.page.count({
    where: { spaceId: space.id, status: "PUBLISHED" },
  });

  return (
    <main className="flex-1 min-w-0">
      <div className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <BookOpen
            className="mx-auto h-12 w-12 mb-4"
            style={
              space.primaryColor ? { color: space.primaryColor } : undefined
            }
          />
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            {space.name}
          </h1>
          {space.description && (
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {space.description}
            </p>
          )}
          {firstPage && (
            <Link
              href={`/docs/${spaceSlug}/${firstPage.slug}`}
              className="inline-flex items-center gap-2 mt-6 rounded-lg px-6 py-3 text-sm font-medium text-primary-foreground transition-colors"
              style={{
                backgroundColor: space.primaryColor || "hsl(var(--primary))",
              }}
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          <div className="rounded-lg border p-4 text-center">
            <FileText className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
            <div className="text-2xl font-bold">{pageCount}</div>
            <div className="text-xs text-muted-foreground">Pages</div>
          </div>
          <div className="rounded-lg border p-4 text-center">
            <Github className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
            <div className="text-2xl font-bold">
              {space.githubRepos.length}
            </div>
            <div className="text-xs text-muted-foreground">Source Repos</div>
          </div>
          <div className="rounded-lg border p-4 text-center">
            <BookOpen className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
            <div className="text-2xl font-bold">{navItems.length}</div>
            <div className="text-xs text-muted-foreground">Sections</div>
          </div>
        </div>

        {/* Navigation sections as cards */}
        {navItems.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {navItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border p-6 hover:border-primary/50 transition-colors"
              >
                <h2 className="font-semibold text-lg mb-2">{item.label}</h2>
                {item.children.length > 0 && (
                  <ul className="space-y-1.5">
                    {item.children.map((child) => (
                      <li key={child.id}>
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5" />
                          {child.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
