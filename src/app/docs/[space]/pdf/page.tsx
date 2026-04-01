import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MarkdownRenderer } from "@/components/reader/markdown-renderer";
import { PrintButton } from "./print-button";

interface PageProps {
  params: Promise<{ space: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function PdfPage({ params: paramsPromise, searchParams: searchParamsPromise }: PageProps) {
  const { space: spaceSlug } = await paramsPromise;
  const { page: pageSlug } = await searchParamsPromise;

  const space = await prisma.space.findFirst({
    where: { slug: spaceSlug, isPublic: true },
    include: { org: { select: { name: true, logo: true } } },
  });

  if (!space) notFound();

  let pages;
  if (pageSlug) {
    const page = await prisma.page.findFirst({
      where: { spaceId: space.id, slug: pageSlug, status: "PUBLISHED" },
      select: { title: true, content: true, slug: true },
    });
    if (!page) {
      // Try case-insensitive
      const p2 = await prisma.page.findFirst({
        where: { spaceId: space.id, slug: { equals: pageSlug, mode: "insensitive" }, status: "PUBLISHED" },
        select: { title: true, content: true, slug: true },
      });
      pages = p2 ? [p2] : [];
    } else {
      pages = [page];
    }
  } else {
    pages = await prisma.page.findMany({
      where: { spaceId: space.id, status: "PUBLISHED" },
      orderBy: { position: "asc" },
      select: { title: true, content: true, slug: true },
    });
  }

  if (pages.length === 0) notFound();

  const logo = space.org?.logo;
  const siteName = space.name;
  const primaryColor = space.primaryColor || "#3b82f6";
  const now = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Print-specific styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .pdf-page { padding: 0 !important; max-width: 100% !important; }
          .page-section { page-break-inside: avoid; }
          .page-section:not(:first-child) { page-break-before: always; }
        }
        @page { margin: 2cm; }
      `}} />

      {/* Print button - floating */}
      <PrintButton color={primaryColor} />

      {/* PDF Content */}
      <div className="pdf-page max-w-4xl mx-auto px-8 py-12">
        {/* Header with logo */}
        <div className="flex items-center gap-3 pb-4 mb-8" style={{ borderBottom: `2px solid ${primaryColor}` }}>
          {logo ? (
            <img src={logo} alt={siteName} className="h-8 w-auto" />
          ) : (
            <div className="h-8 w-8 rounded-md flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: primaryColor }}>
              {siteName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-lg font-bold text-gray-800">{siteName}</span>
          <span className="ml-auto text-xs text-gray-400">{now}</span>
        </div>

        {/* Table of contents (for full document) */}
        {!pageSlug && pages.length > 1 && (
          <div className="mb-12 p-6 bg-gray-50 rounded-lg">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">Table of Contents</h2>
            <ol className="space-y-1">
              {pages.map((page, i) => (
                <li key={i} className="text-sm text-gray-600">
                  <span className="text-gray-400 mr-2">{i + 1}.</span>
                  {page.title}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Pages */}
        {pages.map((page, i) => (
          <div key={i} className="page-section mb-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-1 pb-2" style={{ borderBottom: "1px solid #eee" }}>
              {page.title}
            </h1>
            {page.content && (
              <div className="prose prose-sm max-w-none prose-headings:text-gray-800 prose-p:text-gray-700 prose-a:text-blue-600">
                <MarkdownRenderer content={page.content} />
              </div>
            )}
          </div>
        ))}

        {/* Footer */}
        <div className="mt-12 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-2">
            {logo ? (
              <img src={logo} alt="" className="h-4 w-auto opacity-50" />
            ) : null}
            <span>{siteName}</span>
          </div>
          <span>Generated on {now}</span>
        </div>
      </div>
    </div>
  );
}
