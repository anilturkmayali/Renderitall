import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const hostname = req.headers.get("host") || "";
  const pathname = req.nextUrl.pathname;

  // Skip for admin, api, _next, and known paths
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/docs") ||
    pathname === "/" ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/sitemap") ||
    pathname.startsWith("/robots")
  ) {
    return NextResponse.next();
  }

  // Check if the hostname is a custom domain (not the main app domain)
  const appDomains = [
    "localhost:3000",
    "localhost",
    "renderitall.vercel.app",
    process.env.VERCEL_URL || "",
  ].filter(Boolean);

  const isCustomDomain = !appDomains.some(
    (d) => hostname === d || hostname.endsWith(`.${d}`)
  );

  if (isCustomDomain) {
    // Look up which space this domain belongs to
    // We can't use Prisma in middleware (edge runtime), so we call our own API
    const lookupUrl = new URL("/api/domain-lookup", req.url);
    lookupUrl.searchParams.set("domain", hostname);

    try {
      const res = await fetch(lookupUrl.toString());
      if (res.ok) {
        const { spaceSlug } = await res.json();
        if (spaceSlug) {
          // Rewrite to the docs path
          const url = req.nextUrl.clone();
          url.pathname = `/docs/${spaceSlug}${pathname === "/" ? "" : pathname}`;
          return NextResponse.rewrite(url);
        }
      }
    } catch {
      // If lookup fails, continue normally
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
