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

export default function SettingsPage() {
  const [account, setAccount] = useState<GitHubAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    fetchAccount();
  }, []);

  async function fetchAccount() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/github/account");
      if (res.ok) setAccount(await res.json());
    } catch {
      setAccount({ connected: false });
    }
    setLoading(false);
  }

  async function handleDisconnect() {
    if (!confirm("Disconnect your GitHub account? You won't be able to sync repos until you reconnect.")) return;
    setDisconnecting(true);
    await fetch("/api/admin/github/account", { method: "DELETE" });
    setAccount({ connected: false });
    setDisconnecting(false);
  }

  function handleReconnect() {
    window.location.href = "/api/auth/reconnect";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account connections and platform settings.
        </p>
      </div>

      {/* GitHub Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            GitHub Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!account?.connected ? (
            /* Not connected */
            <div className="flex items-start gap-4 p-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
              <XCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-sm">GitHub not connected</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Connect your GitHub account to browse and sync repositories.
                </p>
                <Button size="sm" className="mt-3" onClick={handleReconnect}>
                  <Github className="mr-1.5 h-3.5 w-3.5" />
                  Connect GitHub
                </Button>
              </div>
            </div>
          ) : account.tokenExpired || account.error ? (
            /* Token expired */
            <div className="flex items-start gap-4 p-4 rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-sm">Connection expired</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your GitHub token has expired. Please reconnect to continue syncing.
                </p>
                {account.error && (
                  <p className="text-xs text-red-500 mt-1">{account.error}</p>
                )}
                <Button size="sm" className="mt-3" onClick={handleReconnect}>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  Reconnect
                </Button>
              </div>
            </div>
          ) : (
            /* Connected */
            <>
              {/* Account info */}
              <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/30">
                {account.avatarUrl ? (
                  <img
                    src={account.avatarUrl}
                    alt={account.username || ""}
                    className="h-12 w-12 rounded-full border"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{account.name || account.username}</span>
                    <Badge variant="success" className="text-[10px]">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Connected
                    </Badge>
                  </div>
                  <a
                    href={`https://github.com/${account.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                  >
                    @{account.username}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={handleReconnect}>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    Reconnect
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <LogOut className="mr-1.5 h-3.5 w-3.5" />
                    Disconnect
                  </Button>
                </div>
              </div>

              {/* Permissions */}
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  Permissions
                </h3>
                <div className="flex flex-wrap gap-2">
                  <PermissionBadge
                    label="Repository access"
                    granted={account.hasRepoAccess}
                  />
                  <PermissionBadge
                    label="Organization access"
                    granted={account.hasOrgAccess}
                  />
                  {account.scopes?.map((scope) => (
                    <Badge key={scope} variant="outline" className="text-xs">
                      {scope}
                    </Badge>
                  ))}
                </div>
                {account.needsReconnect && (
                  <div className="flex items-start gap-2 mt-3 p-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Missing permissions</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Your current connection is missing some permissions needed to access
                        organization repos. Click &quot;Reconnect&quot; to grant the updated permissions.
                      </p>
                      <Button size="sm" className="mt-2" onClick={handleReconnect}>
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                        Reconnect with updated permissions
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Organizations */}
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Organizations ({account.organizations?.length || 0})
                </h3>
                {!account.organizations || account.organizations.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-3 rounded-lg border bg-muted/30">
                    <p>No organizations found.</p>
                    <p className="text-xs mt-1">
                      If you belong to organizations but don&apos;t see them here, click &quot;Reconnect&quot;
                      above. You may need to grant access to each organization during the GitHub
                      authorization step — look for the &quot;Grant&quot; button next to each org.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {account.organizations.map((org) => (
                      <div
                        key={org.login}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors"
                      >
                        <img
                          src={org.avatar_url}
                          alt={org.login}
                          className="h-8 w-8 rounded-md"
                        />
                        <div className="flex-1 min-w-0">
                          <a
                            href={`https://github.com/${org.login}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-sm hover:text-primary flex items-center gap-1"
                          >
                            {org.login}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          {org.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {org.description}
                            </p>
                          )}
                        </div>
                        <Badge variant="success" className="text-[10px] shrink-0">
                          Access granted
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Help */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground">I don&apos;t see my organization&apos;s repos</p>
            <p className="text-xs mt-1">
              1. Click &quot;Reconnect&quot; above.<br />
              2. On the GitHub authorization page, find your organization in the list.<br />
              3. Click &quot;Grant&quot; next to it (you may need org admin approval).<br />
              4. Complete the authorization.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">Sync is failing</p>
            <p className="text-xs mt-1">
              Try clicking &quot;Reconnect&quot; to refresh your GitHub token. If the repo is private,
              make sure you have access to it with the connected account.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PermissionBadge({ label, granted }: { label: string; granted?: boolean }) {
  return (
    <Badge
      variant={granted ? "success" : "destructive"}
      className="text-xs gap-1"
    >
      {granted ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : (
        <XCircle className="h-3 w-3" />
      )}
      {label}
    </Badge>
  );
}
