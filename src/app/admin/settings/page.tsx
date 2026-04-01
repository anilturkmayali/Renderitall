"use client";

import { useState, useEffect } from "react";
import {
  Github, CheckCircle2, Loader2, LogOut,
  Building2, User, ExternalLink, Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AVAILABLE_FONTS } from "@/lib/fonts";

interface GitHubAccount {
  connected: boolean;
  username?: string;
  name?: string;
  avatarUrl?: string;
  organizations?: { login: string; avatar_url: string; description: string | null }[];
  tokenExpired?: boolean;
  error?: string;
}

const GITHUB_CLIENT_ID = "Ov23liAmf1feDEIF8oNd";

export default function SettingsPage() {
  const [account, setAccount] = useState<GitHubAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [corporateFont, setCorporateFont] = useState("");
  const [fontSaving, setFontSaving] = useState(false);
  const [fontSaved, setFontSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/github/account")
      .then((r) => r.json())
      .then((d) => setAccount(d))
      .catch(() => setAccount({ connected: false }))
      .finally(() => setLoading(false));

    // Load corporate font
    fetch("/api/admin/settings/font")
      .then((r) => r.json())
      .then((d) => { if (d.font) setCorporateFont(d.font); })
      .catch(() => {});
  }, []);

  async function handleSignOut() {
    if (!confirm("Sign out? You won't be able to sync repos until you sign in again.")) return;
    await fetch("/api/admin/github/account", { method: "DELETE" });
    window.location.href = "/login";
  }

  async function saveCorporateFont(font: string) {
    setCorporateFont(font);
    setFontSaving(true);
    await fetch("/api/admin/settings/font", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ font }),
    });
    setFontSaved(true);
    setTimeout(() => setFontSaved(false), 2000);
    setFontSaving(false);
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Your account, GitHub connection, and platform defaults.</p>
      </div>

      {/* Corporate Font */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Type className="h-5 w-5" />Corporate Font</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-4">Set a default font for all new Sites. Each Site can override this in its Appearance settings.</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {AVAILABLE_FONTS.map((f) => (
              <button
                key={f.name}
                onClick={() => saveCorporateFont(f.name)}
                className={`rounded-lg border-2 px-3 py-2.5 text-left transition-all ${
                  corporateFont === f.name
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border hover:border-primary/40"
                }`}
                style={f.name ? { fontFamily: f.type === "system" ? `"${f.name}", sans-serif` : `"${f.name}", sans-serif` } : undefined}
              >
                <span className="text-sm font-medium block truncate">{f.label}</span>
                <span className="text-[10px] text-muted-foreground">{f.type === "system" ? "System" : "Google"}</span>
              </button>
            ))}
          </div>
          {fontSaved && <p className="text-xs text-green-600 mt-2">Corporate font saved.</p>}
        </CardContent>
      </Card>

      {/* GitHub Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Github className="h-5 w-5" />GitHub Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {!account?.connected || account.tokenExpired ? (
            <div className="p-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
              <p className="font-medium text-sm">{account?.tokenExpired ? "Session expired" : "Not connected"}</p>
              <p className="text-xs text-muted-foreground mt-1">Sign in to connect your GitHub account.</p>
              <a href="/login"><Button size="sm" className="mt-3"><Github className="mr-1.5 h-3.5 w-3.5" />Sign in with GitHub</Button></a>
            </div>
          ) : (
            <>
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
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2"><Building2 className="h-4 w-4" />Organizations</h3>
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
                    <a href={`https://github.com/settings/connections/applications/${GITHUB_CLIENT_ID}`} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground mt-1 inline-flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />Manage or revoke organization access on GitHub
                    </a>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg border bg-muted/30">
                    <p className="text-sm font-medium mb-2">Grant access to your organizations</p>
                    <p className="text-xs text-muted-foreground mb-3">To import repositories from your organizations:</p>
                    <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside mb-3">
                      <li>Click the button below to open your GitHub settings</li>
                      <li>Find <strong>Renderitall</strong> and click on it</li>
                      <li>Under &quot;Organization access&quot;, click <strong>&quot;Grant&quot;</strong> next to each org</li>
                      <li>Come back here and refresh the page</li>
                    </ol>
                    <a href={`https://github.com/settings/connections/applications/${GITHUB_CLIENT_ID}`} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline"><ExternalLink className="mr-1.5 h-3.5 w-3.5" />Open GitHub Settings</Button>
                    </a>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-2">Manage Connection</h3>
                <div className="flex flex-wrap gap-2">
                  <a href={`https://github.com/settings/connections/applications/${GITHUB_CLIENT_ID}`} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline"><ExternalLink className="mr-1.5 h-3.5 w-3.5" />Manage on GitHub</Button>
                  </a>
                  <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={handleSignOut}>
                    <LogOut className="mr-1.5 h-3.5 w-3.5" />Disconnect & Sign Out
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">To fully revoke access, click &quot;Manage on GitHub&quot; and then &quot;Revoke access&quot;.</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
