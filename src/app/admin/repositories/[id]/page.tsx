"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft, Save, Loader2, Check, Github, FileText, Eye, EyeOff,
  Home, Trash2, RefreshCw, ExternalLink, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RepoPage {
  id: string;
  title: string;
  slug: string;
  status: string;
  githubPath: string | null;
  position: number;
}

interface Repo {
  id: string;
  owner: string;
  repo: string;
  slug: string | null;
  displayName: string | null;
  branch: string;
  docsPath: string;
  homePageId: string | null;
  config: any;
  lastSyncAt: string | null;
  lastSyncStatus: string;
  pageCount: number;
  webhookId: number | null;
  pages: RepoPage[];
  space: { name: string; slug: string };
}

export default function RepoDetailPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };

  const [repo, setRepo] = useState<Repo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");

  // Editable fields
  const [displayName, setDisplayName] = useState("");
  const [slug, setSlug] = useState("");
  const [homePageId, setHomePageId] = useState<string | null>(null);
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadRepo();
  }, [id]);

  async function loadRepo() {
    setLoading(true);
    const res = await fetch(`/api/admin/repos/${id}`);
    if (res.ok) {
      const data = await res.json();
      setRepo(data);
      setDisplayName(data.displayName || data.repo);
      setSlug(data.slug || data.repo.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
      setHomePageId(data.homePageId || null);
      const cfg = data.config || {};
      setExcludedIds(new Set(cfg.excludedPageIds || []));
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/admin/repos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName,
        slug,
        homePageId,
        config: { excludedPageIds: Array.from(excludedIds) },
      }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  }

  async function handleSync() {
    setSyncing(true);
    await fetch(`/api/admin/repos/${id}/sync`, { method: "POST" });
    setSyncing(false);
    loadRepo();
  }

  function toggleExclude(pageId: string) {
    setExcludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(pageId)) next.delete(pageId);
      else next.add(pageId);
      return next;
    });
  }

  function setAsHome(pageId: string) {
    setHomePageId(homePageId === pageId ? null : pageId);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!repo) {
    return <div className="p-6 text-muted-foreground">Repository not found</div>;
  }

  const allPages = repo.pages || [];
  const filteredPages = search
    ? allPages.filter(
        (p) =>
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.slug.toLowerCase().includes(search.toLowerCase())
      )
    : allPages;

  const includedCount = allPages.filter((p) => !excludedIds.has(p.id)).length;
  const excludedCount = excludedIds.size;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Github className="h-5 w-5" />
              {repo.owner}/{repo.repo}
            </h1>
            <p className="text-xs text-muted-foreground">
              {repo.branch} · {repo.docsPath} · {allPages.length} pages
              {repo.lastSyncAt &&
                ` · Last synced ${new Date(repo.lastSyncAt).toLocaleDateString()}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncing}
          >
            <RefreshCw
              className={`mr-1.5 h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`}
            />
            {syncing ? "Importing..." : "Import"}
          </Button>
          <a
            href={`https://github.com/${repo.owner}/${repo.repo}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              GitHub
            </Button>
          </a>
          <Button onClick={handleSave} disabled={saving}>
            {saved ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Display settings */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base">Display Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Display Name
              </label>
              <p className="text-xs text-muted-foreground mb-1.5">
                How this repo appears in menus and navigation.
              </p>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={repo.repo}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                URL Slug
              </label>
              <p className="text-xs text-muted-foreground mb-1.5">
                URL path for this repo section: /docs/site/<strong>{slug}</strong>/...
              </p>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder={repo.repo.toLowerCase()}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Auto-sync */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base">Auto-sync</CardTitle>
        </CardHeader>
        <CardContent>
          {repo.webhookId ? (
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm font-medium">Active</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Changes pushed to GitHub are automatically imported.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={async () => {
                await fetch(`/api/admin/repos/${id}/webhook`, { method: "DELETE" });
                loadRepo();
              }}>
                Disable auto-sync
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                  <span className="text-sm font-medium">Not active</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Content is only updated when you manually click Import. Enable auto-sync to get updates automatically when changes are pushed to GitHub.
                </p>
              </div>
              <Button size="sm" onClick={async () => {
                const res = await fetch(`/api/admin/repos/${id}/webhook`, { method: "POST" });
                const data = await res.json();
                if (!data.success) alert(data.message);
                loadRepo();
              }}>
                Enable auto-sync
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pages */}
      <Card>
        <CardHeader className="py-3 flex flex-row items-center justify-between border-b">
          <div>
            <CardTitle className="text-base">
              Pages ({includedCount} included, {excludedCount} excluded)
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Toggle pages on/off to control what appears on your site. Set one as the home page.
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search pages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 w-48 text-sm"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y max-h-[500px] overflow-y-auto">
            {filteredPages.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                {allPages.length === 0
                  ? "No pages imported yet. Click Import to bring content from GitHub."
                  : "No pages match your search."}
              </div>
            ) : (
              filteredPages.map((page) => {
                const isExcluded = excludedIds.has(page.id);
                const isHome = homePageId === page.id;

                return (
                  <div
                    key={page.id}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                      isExcluded ? "opacity-40 bg-muted/20" : "hover:bg-muted/30"
                    }`}
                  >
                    {/* Include/Exclude toggle */}
                    <button
                      onClick={() => toggleExclude(page.id)}
                      className={`shrink-0 rounded p-1 transition-colors ${
                        isExcluded
                          ? "text-muted-foreground hover:text-foreground"
                          : "text-green-600 hover:text-green-700"
                      }`}
                      title={isExcluded ? "Include this page" : "Exclude this page"}
                    >
                      {isExcluded ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>

                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />

                    <div className="flex-1 min-w-0">
                      <span
                        className={`text-sm font-medium block truncate ${
                          isExcluded ? "line-through" : ""
                        }`}
                      >
                        {page.title}
                      </span>
                      <span className="text-xs text-muted-foreground truncate block">
                        /{page.slug}
                      </span>
                    </div>

                    {/* Home badge / set as home */}
                    {isHome ? (
                      <Badge
                        variant="success"
                        className="text-[10px] shrink-0 cursor-pointer"
                        onClick={() => setAsHome(page.id)}
                      >
                        <Home className="mr-1 h-3 w-3" />
                        Home Page
                      </Badge>
                    ) : (
                      !isExcluded && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-muted-foreground shrink-0"
                          onClick={() => setAsHome(page.id)}
                        >
                          <Home className="mr-1 h-3 w-3" />
                          Set as Home
                        </Button>
                      )
                    )}

                    {/* Status */}
                    <Badge
                      variant={isExcluded ? "outline" : "secondary"}
                      className="text-[10px] shrink-0"
                    >
                      {isExcluded ? "Excluded" : "Included"}
                    </Badge>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setExcludedIds(new Set())}
        >
          Include All
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setExcludedIds(new Set(allPages.map((p) => p.id)))
          }
        >
          Exclude All
        </Button>
      </div>
    </div>
  );
}
