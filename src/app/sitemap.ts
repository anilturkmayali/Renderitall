import { prisma } from "@/lib/prisma";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || "https://renderitall.vercel.app";

  const entries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  // Add all public spaces
  const spaces = await prisma.space.findMany({
    where: { isPublic: true },
    select: { slug: true, updatedAt: true },
  });

  for (const space of spaces) {
    entries.push({
      url: `${baseUrl}/docs/${space.slug}`,
      lastModified: space.updatedAt,
      changeFrequency: "daily",
      priority: 0.9,
    });
  }

  // Add all published pages in public spaces
  const pages = await prisma.page.findMany({
    where: {
      status: "PUBLISHED",
      space: { isPublic: true },
    },
    select: {
      slug: true,
      updatedAt: true,
      space: { select: { slug: true } },
    },
  });

  for (const page of pages) {
    entries.push({
      url: `${baseUrl}/docs/${page.space.slug}/${page.slug}`,
      lastModified: page.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  return entries;
}
