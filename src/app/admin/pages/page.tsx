import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Plus, FileText, Github as GithubIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function getPages() {
  return prisma.page.findMany({
    orderBy: [{ position: "asc" }],
    include: {
      space: { select: { name: true, slug: true } },
      githubRepo: { select: { owner: true, repo: true } },
    },
  });
}

export default async function AdminPagesPage() {
  const pages = await getPages();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pages</h1>
          <p className="text-muted-foreground">
            Manage all documentation pages across your spaces.
          </p>
        </div>
        <Link href="/admin/editor">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Page
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {pages.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <FileText className="mx-auto h-10 w-10 mb-3 opacity-50" />
                <p className="font-medium">No pages yet</p>
                <p className="text-sm mt-1">
                  Connect a GitHub repository or create a native page.
                </p>
              </div>
            ) : (
              pages.map((page) => (
                <div
                  key={page.id}
                  className="flex items-center gap-4 px-6 py-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/editor?page=${page.id}`}
                        className="font-medium hover:text-primary truncate"
                      >
                        {page.title}
                      </Link>
                      <Badge
                        variant={
                          page.status === "PUBLISHED"
                            ? "success"
                            : page.status === "DRAFT"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {page.status.toLowerCase()}
                      </Badge>
                      {page.source === "GITHUB" && (
                        <Badge variant="outline" className="gap-1">
                          <GithubIcon className="h-3 w-3" />
                          GitHub
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {page.space.name} · /{page.slug}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0">
                    {new Date(page.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
