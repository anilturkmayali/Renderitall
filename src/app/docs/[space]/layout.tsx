import Link from "next/link";
import { BookOpen } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ThemeToggle } from "@/components/theme-toggle";
import { SearchCommand } from "@/components/search-command";
import { unstable_cache } from "next/cache";
import type { Metadata } from "next";

export const revalidate = 120;

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ space: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ space: string }>;
}): Promise<Metadata> {
  const { space: spaceSlug } = await params;
  const space = await prisma.space.findFirst({
    where: { slug: spaceSlug, isPublic: true },
    select: {
      name: true,
      description: true,
      seoTitle: true,
      seoDescription: true,
      ogImage: true,
      primaryColor: true,
    },
  });

  if (!space) return {};

  const title = space.seoTitle || space.name;
  const description = space.seoDescription || space.description || "";

  return {
    title: {
      default: title,
      template: `%s | ${space.name}`,
    },
    description,
    openGraph: {
      title,
      description,
      type: "website",
      ...(space.ogImage && { images: [space.ogImage] }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    themeColor: space.primaryColor || undefined,
  };
}

export default async function DocsLayout({ children, params }: LayoutProps) {
  const { space: spaceSlug } = await params;

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
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link
              href={`/docs/${spaceSlug}`}
              className="flex items-center gap-2"
            >
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
