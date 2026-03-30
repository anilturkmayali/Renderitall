import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  FileText,
  Github,
  Layers,
  Activity,
  Clock,
  Plus,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

async function getStats() {
  const [pages, repos, spaces, publishedPages] = await Promise.all([
    prisma.page.count(),
    prisma.gitHubRepo.count(),
    prisma.space.count(),
    prisma.page.count({ where: { status: "PUBLISHED" } }),
  ]);
  return { pages, repos, spaces, publishedPages };
}

async function getRecentRepos() {
  return prisma.gitHubRepo.findMany({
    orderBy: { updatedAt: "desc" },
    take: 5,
    include: {
      space: { select: { name: true } },
      _count: { select: { pages: true } },
    },
  });
}

async function getRecentPages() {
  return prisma.page.findMany({
    orderBy: { updatedAt: "desc" },
    take: 8,
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      source: true,
      updatedAt: true,
      space: { select: { name: true, slug: true } },
    },
  });
}

async function getRecentActivity() {
  return prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { user: { select: { name: true, image: true } } },
  });
}

export default async function AdminDashboard() {
  const [stats, recentRepos, recentPages, activities] = await Promise.all([
    getStats(),
    getRecentRepos(),
    getRecentPages(),
    getRecentActivity(),
  ]);

  const kpis = [
    {
      label: "Total Pages",
      value: stats.pages,
      sub: `${stats.publishedPages} published`,
      icon: FileText,
      href: "/admin/pages",
    },
    {
      label: "Spaces",
      value: stats.spaces,
      sub: "documentation sites",
      icon: Layers,
      href: "/admin/spaces",
    },
    {
      label: "GitHub Repos",
      value: stats.repos,
      sub: "connected",
      icon: Github,
      href: "/admin/github",
    },
  ];

  const syncStatusIcon = {
    SUCCESS: <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />,
    ERROR: <XCircle className="h-3.5 w-3.5 text-red-500" />,
    SYNCING: <RefreshCw className="h-3.5 w-3.5 text-amber-500 animate-spin" />,
    IDLE: <Clock className="h-3.5 w-3.5 text-muted-foreground" />,
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your documentation platform.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/spaces">
            <Button variant="outline" size="sm">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              New Space
            </Button>
          </Link>
          <Link href="/admin/editor">
            <Button size="sm">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              New Page
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => (
          <Link key={kpi.label} href={kpi.href}>
            <Card className="hover:border-primary/30 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.label}
                </CardTitle>
                <kpi.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{kpi.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Repos / Sync Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Github className="h-5 w-5" />
              Repo Sync Status
            </CardTitle>
            <Link href="/admin/github">
              <Button variant="ghost" size="sm">
                View all
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentRepos.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground">
                <Github className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No repos connected yet.</p>
                <Link href="/admin/github">
                  <Button variant="outline" size="sm" className="mt-3">
                    Connect a repository
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentRepos.map((repo) => (
                  <div
                    key={repo.id}
                    className="flex items-center gap-3 text-sm"
                  >
                    {syncStatusIcon[repo.lastSyncStatus]}
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">
                        {repo.owner}/{repo.repo}
                      </span>
                      <span className="text-muted-foreground ml-2">
                        {repo._count.pages} pages
                      </span>
                    </div>
                    {repo.lastSyncAt && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(repo.lastSyncAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Pages */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Pages
            </CardTitle>
            <Link href="/admin/pages">
              <Button variant="ghost" size="sm">
                View all
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentPages.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground">
                <FileText className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No pages yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentPages.map((page) => (
                  <Link
                    key={page.id}
                    href={`/admin/editor?page=${page.id}`}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors"
                  >
                    <span className="flex-1 truncate font-medium">
                      {page.title}
                    </span>
                    <Badge
                      variant={
                        page.status === "PUBLISHED" ? "success" : "secondary"
                      }
                      className="text-[10px] px-1.5 py-0"
                    >
                      {page.status.toLowerCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {page.space.name}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No activity yet. Connect a GitHub repository to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {activities.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-3 text-sm border-b pb-3 last:border-0 last:pb-0"
                >
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p>
                      <span className="font-medium">
                        {a.user?.name || "System"}
                      </span>{" "}
                      {a.action}{" "}
                      <span className="text-muted-foreground">{a.entity}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(a.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
