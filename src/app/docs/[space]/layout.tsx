import Link from "next/link";
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
    title: { default: title, template: `%s | ${space.name}` },
    description,
    openGraph: {
      title,
      description,
      type: "website",
      ...(space.ogImage && { images: [space.ogImage] }),
    },
    twitter: { card: "summary_large_image", title, description },
    themeColor: space.primaryColor || undefined,
  };
}

export default async function DocsLayout({ children, params }: LayoutProps) {
  const { space: spaceSlug } = await params;

  const space = await prisma.space.findFirst({
    where: { slug: spaceSlug, isPublic: true },
    include: { org: { select: { name: true, logo: true, logoDark: true } } },
  });

  const spaceName = space?.name || spaceSlug;
  const primaryColor = space?.primaryColor || "#3b82f6";
  const accentColor = space?.accentColor;
  const logo = space?.org?.logo;
  const headerLayout = space?.headerLayout || "default";

  // Determine header style based on accentColor
  // If accentColor is set, use it as header background (colored header)
  // Otherwise use a subtle tinted header
  const useColoredHeader = !!accentColor;
  const headerBg = useColoredHeader ? accentColor : undefined;
  const headerTextLight = useColoredHeader; // white text on colored bg

  return (
    <div className="min-h-screen bg-background">
      {/* CSS custom properties for theming */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            :root {
              --site-primary: ${primaryColor};
              --site-accent: ${accentColor || primaryColor};
            }
            .site-header { ${headerBg ? `background-color: ${headerBg};` : ""} }
            .site-header a, .site-header span, .site-header button { ${headerTextLight ? "color: white !important;" : ""} }
            .site-header .search-trigger { ${headerTextLight ? "background: rgba(255,255,255,0.15) !important; border-color: rgba(255,255,255,0.2) !important; color: rgba(255,255,255,0.8) !important;" : ""} }
            .site-header .search-trigger:hover { ${headerTextLight ? "background: rgba(255,255,255,0.25) !important;" : ""} }
            .site-sidebar .sidebar-active { background-color: ${primaryColor}15; color: ${primaryColor}; border-left-color: ${primaryColor}; }
            .prose a { color: ${primaryColor}; }
            .prose a:hover { color: ${primaryColor}; opacity: 0.8; }
            ${space?.customCss || ""}
          `,
        }}
      />

      {/* Top navigation */}
      <header className={`site-header sticky top-0 z-40 border-b ${!useColoredHeader ? "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" : ""}`}>
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href={`/docs/${spaceSlug}`}
              className="flex items-center gap-2.5"
            >
              {logo ? (
                <img
                  src={logo}
                  alt={spaceName}
                  className="h-7 w-auto max-w-[140px] object-contain"
                />
              ) : (
                <div
                  className="h-7 w-7 rounded-md flex items-center justify-center text-white font-bold text-xs"
                  style={{ backgroundColor: primaryColor }}
                >
                  {spaceName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="font-semibold text-sm">{spaceName}</span>
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
    </div>
  );
}
