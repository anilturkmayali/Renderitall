import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || "https://renderitall.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/docs/",
        disallow: ["/admin/", "/api/", "/login"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
