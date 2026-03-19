import { prisma } from "@/lib/prisma";
import {
  Github,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function getRepos() {
  return prisma.gitHubRepo.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      space: { select: { name: true, slug: true } },
      _count: { select: { pages: true } },
    },
  });
}

const statusConfig = {
  IDLE: { icon: Clock, color: "secondary", label: "Idle" },
  SYNCING: { icon: RefreshCw, color: "warning", label: "Syncing" },
  SUCCESS: { icon: CheckCircle2, color: "success", label: "Synced" },
  ERROR: { icon: XCircle, color: "destructive", label: "Error" },
} as const;

export default async function AdminGitHubPage() {
  const repos = await getRepos();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">GitHub Repositories</h1>
          <p className="text-muted-foreground">
            Connect GitHub repositories to import documentation automatically.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Connect Repository
        </Button>
      </div>

      {repos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Github className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <h3 className="font-semibold text-lg mb-1">No repositories connected</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Connect a GitHub repository to automatically import Markdown
              documentation. Changes pushed to GitHub will sync instantly.
            </p>
            <Button className="mt-6">
              <Github className="mr-2 h-4 w-4" />
              Connect your first repository
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {repos.map((repo) => {
            const status = statusConfig[repo.lastSyncStatus];
            const StatusIcon = status.icon;

            return (
              <Card key={repo.id}>
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Github className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">
                        {repo.owner}/{repo.repo}
                      </h3>
                      <Badge variant={status.color as any}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {status.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span>Branch: {repo.branch}</span>
                      <span>Path: {repo.docsPath}</span>
                      <span>Space: {repo.space.name}</span>
                      <span>{repo._count.pages} pages</span>
                    </div>
                    {repo.lastSyncAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Last synced: {new Date(repo.lastSyncAt).toLocaleString()}
                      </p>
                    )}
                    {repo.lastSyncError && (
                      <p className="text-xs text-red-500 mt-1">{repo.lastSyncError}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <RefreshCw className="mr-1 h-3.5 w-3.5" />
                      Sync
                    </Button>
                    <a
                      href={`https://github.com/${repo.owner}/${repo.repo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
