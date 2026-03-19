import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  FileText,
  Github,
  Layers,
  Users,
  Activity,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function getStats() {
  const [pages, repos, spaces] = await Promise.all([
    prisma.page.count(),
    prisma.gitHubRepo.count(),
    prisma.space.count(),
  ]);
  return { pages, repos, spaces };
}

async function getRecentActivity() {
  return prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { user: { select: { name: true, image: true } } },
  });
}

export default async function AdminDashboard() {
  const [stats, activities] = await Promise.all([
    getStats(),
    getRecentActivity(),
  ]);

  const kpis = [
    { label: "Total Pages", value: stats.pages, icon: FileText },
    { label: "Spaces", value: stats.spaces, icon: Layers },
    { label: "GitHub Repos", value: stats.repos, icon: Github },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your documentation platform.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.label}
              </CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
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
                      <span className="font-medium">{a.user?.name || "System"}</span>{" "}
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
