import Link from "next/link";
import { BookOpen } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ThemeToggle } from "@/components/theme-toggle";
import { SearchCommand } from "@/components/search-command";

export default async function DocsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ space: string }>;
}) {
  const { space: spaceSlug } = await params;

  // Fetch space for branding
  const space = await prisma.space.findFirst({
    where: { slug: spaceSlug, isPublic: true },
    include: { org: { select: { name: true, logo: true } } },
  });

  const spaceName = space?.name || spaceSlug;
  const orgName = space?.org?.name;
  const primaryColor = space?.primaryColor;

  return (
    <div className="min-h-screen bg-background">
      {/* Top navigation */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href={`/docs/${spaceSlug}`} className="flex items-center gap-2">
              <BookOpen
                className="h-5 w-5"
                style={primaryColor ? { color: primaryColor } : undefined}
              />
              <span className="font-semibold">{spaceName}</span>
              {orgName && (
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  by {orgName}
                </span>
              )}
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <SearchCommand spaceSlug={spaceSlug} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Content area */}
      <div className="flex">{children}</div>

      {/* Custom CSS injection */}
      {space?.customCss && (
        <style dangerouslySetInnerHTML={{ __html: space.customCss }} />
      )}
    </div>
  );
}
