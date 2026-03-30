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

const getSpaceData = unstable_cache(
  async (slug: string) => {
    return prisma.space.findFirst({
      where: { slug, isPublic: true },
      include: {
        org: { select: { name: true, logo: true, logoDark: true } },
        navItems: {
          where: { parentId: null, type: "LINK" },
          orderBy: { position: "asc" },
          select: { label: true, url: true },
        },
      },
    });
  },
  ["space-layout"],
  { revalidate: 120 }
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ space: string }>;
}): Promise<Metadata> {
  const { space: spaceSlug } = await params;
  const space = await getSpaceData(spaceSlug);
  if (!space) return {};

  const title = space.seoTitle || space.name;
  const description = space.seoDescription || space.description || "";

  return {
    title: { default: title, template: `%s | ${space.name}` },
    description,
    openGraph: { title, description, type: "website", ...(space.ogImage && { images: [space.ogImage] }) },
    twitter: { card: "summary_large_image", title, description },
    themeColor: space.primaryColor || undefined,
  };
}

export default async function DocsLayout({ children, params }: LayoutProps) {
  const { space: spaceSlug } = await params;
  const space = await getSpaceData(spaceSlug);

  const spaceName = space?.name || spaceSlug;
  const primaryColor = space?.primaryColor || "#3b82f6";
  const accentColor = space?.accentColor;
  const logo = space?.org?.logo;
  const template = space?.headerLayout || "default";

  // Top nav links (LINK type nav items at root level)
  const topLinks = space?.navItems || [];

  const useColoredHeader = !!accentColor;

  return (
    <div className="min-h-screen bg-background">
      {/* Theme CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        :root { --site-primary: ${primaryColor}; --site-accent: ${accentColor || primaryColor}; }
        .site-link { color: var(--site-primary); }
        .site-link:hover { opacity: 0.8; }
        .sidebar-item-active { background-color: ${primaryColor}12; color: ${primaryColor}; border-left: 2px solid ${primaryColor}; }
        .prose a { color: var(--site-primary); }
        ${space?.customCss || ""}
      `}} />

      {/* Header */}
      <header
        className={`sticky top-0 z-40 border-b ${useColoredHeader ? "" : "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"}`}
        style={useColoredHeader ? { backgroundColor: accentColor! } : undefined}
      >
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href={`/docs/${spaceSlug}`} className="flex items-center gap-2.5 shrink-0">
              {logo ? (
                <img src={logo} alt={spaceName} className="h-7 w-auto max-w-[140px] object-contain" />
              ) : (
                <div className="h-7 w-7 rounded-md flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: primaryColor }}>
                  {spaceName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className={`font-semibold text-sm ${useColoredHeader ? "text-white" : ""}`}>
                {spaceName}
              </span>
            </Link>

            {/* Top nav links — shown on Modern template or when links exist */}
            {(template === "modern" || topLinks.length > 0) && topLinks.length > 0 && (
              <nav className="hidden md:flex items-center gap-1 ml-4">
                {topLinks.map((link, i) => (
                  <a
                    key={i}
                    href={link.url || "#"}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      useColoredHeader
                        ? "text-white/80 hover:text-white hover:bg-white/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                    target={link.url?.startsWith("http") ? "_blank" : undefined}
                    rel={link.url?.startsWith("http") ? "noopener noreferrer" : undefined}
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className={useColoredHeader ? "[&_button]:text-white/80 [&_button]:border-white/20 [&_button]:bg-white/10 [&_button:hover]:bg-white/20" : ""}>
              <SearchCommand spaceSlug={spaceSlug} />
            </div>
            <div className={useColoredHeader ? "[&_button]:text-white/80" : ""}>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Content — layout varies by template */}
      <div className="flex">{children}</div>
    </div>
  );
}
