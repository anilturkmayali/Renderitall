"use client";

import { useState, useEffect } from "react";
import {
  Github,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  LogOut,
  RefreshCw,
  Shield,
  Building2,
  User,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GitHubAccount {
  connected: boolean;
  username?: string;
  name?: string;
  avatarUrl?: string;
  email?: string;
  organizations?: { login: string; avatar_url: string; description: string | null }[];
  scopes?: string[];
  hasOrgAccess?: boolean;
  hasRepoAccess?: boolean;
  needsReconnect?: boolean;
  tokenExpired?: boolean;
  error?: string;
}

const GITHUB_CLIENT_ID = "Ov23liAmf1feDEIF8oNd";

export default function SettingsPage() {
  const [account, setAccount] = useState<GitHubAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => { fetchAccount(); }, []);

  async function fetchAccount() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/github/account");
      if (res.ok) setAccount(await res.json());
      else setAccount({ connected: false });
    } catch {
      setAccount({ connected: false });
    }
    setLoading(false);
  }

  async function handleDisconnect() {
    if (!confirm("Disconnect GitHub? You won't be able to sync repos.")) return;
    setDisconnecting(true);
    await fetch("/api/admin/github/account", { method: "DELETE" });
    setAccount({ connected: false });
    setDisconnecting(false);
  }

  function handleReconnect() {
    window.location.href = "/api/auth/reconnect";
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your GitHub connection and platform settings.</p>
      </div>

      {/* GitHub Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Github className="h-5 w-5" />GitHub Connection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {!account?.connected ? (
            <div className="p-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm">GitHub not connected</p>
                  <p className="text-xs text-muted-foreground mt-1">Connect your GitHub account to browse and sync repositories.</p>
                  <Button size="sm" className="mt-3" onClick={handleReconnect}>
                    <Github className="mr-1.5 h-3.5 w-3.5" />Connect GitHub
                  </Button>
                </div>
              </div>
            </div>
          ) : account.tokenExpired || account.error ? (
            <div className="p-4 rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm">Connection issue</p>
                  <p className="text-xs text-muted-foreground mt-1">Your GitHub token may have expired. Reconnect to fix this.</p>
                  {account.error && <p className="text-xs text-red-500 mt-1">{account.error}</p>}
                  <Button size="sm" className="mt-3" onClick={handleReconnect}>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />Reconnect
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Account info */}
              <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/30">
                {account.avatarUrl ? (
                  <img src={account.avatarUrl} alt="" className="h-12 w-12 rounded-full border" />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center"><User className="h-6 w-6 text-muted-foreground" /></div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{account.name || account.username}</span>
                    <Badge variant="success" className="text-[10px]"><CheckCircle2 className="mr-1 h-3 w-3" />Connected</Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">@{account.username}</span>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={handleReconnect}><RefreshCw className="mr-1.5 h-3.5 w-3.5" />Reconnect</Button>
                  <Button variant="ghost" size="sm" onClick={handleDisconnect} disabled={disconnecting} className="text-muted-foreground hover:text-destructive">
                    <LogOut className="mr-1.5 h-3.5 w-3.5" />Disconnect
                  </Button>
                </div>
              </div>

              {/* Permissions */}
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2"><Shield className="h-4 w-4" />Permissions</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={account.hasRepoAccess ? "success" : "destructive"} className="text-xs gap-1">
                    {account.hasRepoAccess ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    Repository access
                  </Badge>
                  <Badge variant={account.hasOrgAccess ? "success" : "destructive"} className="text-xs gap-1">
                    {account.hasOrgAccess ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    Organization access
                  </Badge>
                </div>
                {account.needsReconnect && (
                  <div className="mt-3 p-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
                    <p className="text-sm font-medium">Missing permissions</p>
                    <p className="text-xs text-muted-foreground mt-1">Click &quot;Reconnect&quot; above to grant updated permissions.</p>
                  </div>
                )}
              </div>

              {/* Organizations */}
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2"><Building2 className="h-4 w-4" />Organizations ({account.organizations?.length || 0})</h3>
                {account.organizations && account.organizations.length > 0 ? (
                  <div className="grid gap-2">
                    {account.organizations.map((org) => (
                      <div key={org.login} className="flex items-center gap-3 p-3 rounded-lg border">
                        <img src={org.avatar_url} alt="" className="h-8 w-8 rounded-md" />
                        <div className="flex-1">
                          <span className="font-medium text-sm">{org.login}</span>
                          {org.description && <p className="text-xs text-muted-foreground">{org.description}</p>}
                        </div>
                        <Badge variant="success" className="text-[10px]">Access granted</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
                    <p className="text-sm font-medium">No organizations visible</p>
                    <p className="text-xs text-muted-foreground">
                      To access organization repositories, you need to grant this app access to your organization. Follow these steps:
                    </p>
                    <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside">
                      <li>
                        <a
                          href={`https://github.com/settings/connections/applications/${GITHUB_CLIENT_ID}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1"
                        >
                          Open your GitHub Authorized Apps page
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </li>
                      <li>Find <strong>Renderitall</strong> in the list and click on it</li>
                      <li>Under &quot;Organization access&quot;, click <strong>&quot;Grant&quot;</strong> next to each organization you want to use</li>
                      <li>If you see &quot;Request&quot; instead of &quot;Grant&quot;, your org admin needs to approve the request</li>
                      <li>Come back here and click <strong>&quot;Reconnect&quot;</strong> above to refresh</li>
                    </ol>
                    <div className="flex gap-2 pt-2">
                      <a
                        href={`https://github.com/settings/connections/applications/${GITHUB_CLIENT_ID}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button size="sm" variant="outline">
                          <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                          Open GitHub Settings
                        </Button>
                      </a>
                      <Button size="sm" variant="outline" onClick={() => { handleReconnect(); }}>
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                        Reconnect
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
