import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ThemeToggle } from "@/components/theme-toggle";
import { SearchCommand } from "@/components/search-command";
import { PageTracker } from "@/components/reader/page-tracker";
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

  // Top nav links from footerLinks JSON field
  const topLinks: { label: string; url: string }[] = Array.isArray(space?.footerLinks) ? (space.footerLinks as any[]) : [];

  const useColoredHeader = !!accentColor;
  const font = space?.analyticsId || ""; // analyticsId stores font name

  return (
    <div className="min-h-screen bg-background" style={font ? { fontFamily: `"${font}", sans-serif` } : undefined}>
      {/* Google Font */}
      {font && (
        <link
          rel="stylesheet"
          href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@300;400;500;600;700&display=swap`}
        />
      )}

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

            {/* Top nav — supports flat links, repo links, and dropdowns */}
            {topLinks.length > 0 && (
              <nav className="hidden md:flex items-center gap-0.5 ml-4">
                {topLinks.map((link: any, i: number) => {
                  const linkClass = `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    useColoredHeader
                      ? "text-white/80 hover:text-white hover:bg-white/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`;

                  // Dropdown menu
                  if (link.children && link.children.length > 0) {
                    return (
                      <div key={i} className="relative group">
                        <button className={linkClass}>
                          {link.label}
                          <svg className="inline-block ml-1 h-3 w-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        <div className="absolute top-full left-0 mt-1 w-56 rounded-lg border bg-background shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                          <div className="py-1.5">
                            {link.children.map((child: any, ci: number) => (
                              <a
                                key={ci}
                                href={child.url || "#"}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                                target={child.url?.startsWith("http") ? "_blank" : undefined}
                              >
                                {child.label}
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Regular link or repo link
                  return (
                    <a
                      key={i}
                      href={link.url || "#"}
                      className={linkClass}
                      target={link.url?.startsWith("http") ? "_blank" : undefined}
                      rel={link.url?.startsWith("http") ? "noopener noreferrer" : undefined}
                    >
                      {link.label}
                    </a>
                  );
                })}
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

      {/* Analytics tracking */}
      <PageTracker spaceSlug={spaceSlug} />
    </div>
  );
}
