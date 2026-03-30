"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Loader2,
  Check,
  Palette,
  Globe,
  Eye,
  EyeOff,
  ExternalLink,
  Trash2,
  Github,
  GitBranch,
  FolderOpen,
  Plus,
  FileText,
  Search,
  RefreshCw,
  GripVertical,
  ChevronDown,
  ChevronRight,
  FolderGit2,
  Lock,
  Star,
  Settings,
  Monitor,
  Smartphone,
  Tablet,
  ArrowUpDown,
  PenTool,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Space {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isPublic: boolean;
  primaryColor: string | null;
  accentColor: string | null;
  defaultTheme: string;
  headerLayout: string | null;
  customDomain: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  customCss: string | null;
}

interface ConnectedRepo {
  id: string;
  owner: string;
  repo: string;
  branch: string;
  docsPath: string;
  lastSyncAt: string | null;
  lastSyncStatus: string;
  lastSyncError: string | null;
  _count: { pages: number };
}

interface PageItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  source: string;
  githubRepoId: string | null;
  updatedAt: string;
}

interface GitHubRepoOption {
  id: number;
  fullName: string;
  owner: string;
  name: string;
  description: string | null;
  defaultBranch: string;
  isPrivate: boolean;
  language: string | null;
  stargazersCount: number;
}

interface NavItem {
  id?: string;
  label: string;
  type: "PAGE" | "SECTION" | "LINK";
  pageId: string | null;
  url: string | null;
  children: NavItem[];
  _visible: boolean;
  _expanded: boolean;
}

const COLOR_PRESETS = [
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#10b981" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Orange", value: "#f97316" },
  { name: "Teal", value: "#0d9488" },
  { name: "Rose", value: "#f43f5e" },
];

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SpaceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [space, setSpace] = useState<Space | null>(null);
  const [repos, setRepos] = useState<ConnectedRepo[]>([]);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"content" | "customize" | "settings">("content");

  // Content tab state
  const [showRepoModal, setShowRepoModal] = useState(false);
  const [syncing, setSyncing] = useState<Set<string>>(new Set());
  const [pageSearch, setPageSearch] = useState("");

  // Customize tab state
  const [navHasChanges, setNavHasChanges] = useState(false);
  const [navSaving, setNavSaving] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");

  // Settings tab state
  const [settingsForm, setSettingsForm] = useState({
    name: "",
    slug: "",
    description: "",
    isPublic: true,
    primaryColor: "#3b82f6",
    accentColor: "#6366f1",
    defaultTheme: "SYSTEM",
    headerLayout: "default",
    seoTitle: "",
    seoDescription: "",
    customCss: "",
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Domain state
  const [domainInput, setDomainInput] = useState("");
  const [domainAdding, setDomainAdding] = useState(false);
  const [domainInstructions, setDomainInstructions] = useState<any>(null);

  useEffect(() => {
    fetchAll();
  }, [id]);

  async function fetchAll() {
    setLoading(true);
    const [spaceRes, reposRes, pagesRes, navRes] = await Promise.all([
      fetch(`/api/admin/spaces/${id}`),
      fetch("/api/admin/repos"),
      fetch(`/api/admin/pages?spaceId=${id}`),
      fetch(`/api/admin/nav/${id}`),
    ]);

    if (spaceRes.ok) {
      const s = await spaceRes.json();
      setSpace(s);
      setSettingsForm({
        name: s.name || "",
        slug: s.slug || "",
        description: s.description || "",
        isPublic: s.isPublic !== false,
        primaryColor: s.primaryColor || "#3b82f6",
        accentColor: s.accentColor || "#6366f1",
        defaultTheme: s.defaultTheme || "SYSTEM",
        headerLayout: s.headerLayout || "default",
        seoTitle: s.seoTitle || "",
        seoDescription: s.seoDescription || "",
        customCss: s.customCss || "",
      });
    }
    if (reposRes.ok) {
      const allRepos = await reposRes.json();
      setRepos(allRepos.filter((r: any) => r.spaceId === id));
    }
    if (pagesRes.ok) setPages(await pagesRes.json());
    if (navRes.ok) {
      setNavItems((await navRes.json()).map(mapNavItem));
    }
    setLoading(false);
  }

  function mapNavItem(item: any): NavItem {
    return {
      id: item.id,
      label: item.label,
      type: item.type,
      pageId: item.pageId,
      url: item.url,
      _visible: true,
      _expanded: true,
      children: (item.children || []).map(mapNavItem),
    };
  }

  // ─── Content helpers ─────────────────────────────────────────────

  async function handleSync(repoId: string) {
    setSyncing((prev) => new Set([...prev, repoId]));
    await fetch(`/api/admin/repos/${repoId}/sync`, { method: "POST" });
    setSyncing((prev) => {
      const next = new Set(prev);
      next.delete(repoId);
      return next;
    });
    fetchAll();
  }

  async function handleDeleteRepo(repoId: string) {
    if (!confirm("Delete this repo connection and all its synced pages?")) return;
    await fetch(`/api/admin/repos/${repoId}`, { method: "DELETE" });
    fetchAll();
  }

  async function handleDeletePage(pageId: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    await fetch(`/api/admin/pages/${pageId}`, { method: "DELETE" });
    setPages(pages.filter((p) => p.id !== pageId));
  }

  const filteredPages = useMemo(() => {
    if (!pageSearch) return pages;
    const q = pageSearch.toLowerCase();
    return pages.filter((p) => p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q));
  }, [pages, pageSearch]);

  // ─── Nav helpers ─────────────────────────────────────────────────

  const pagesInNav = useMemo(() => {
    const ids = new Set<string>();
    function collect(items: NavItem[]) {
      for (const item of items) {
        if (item.pageId) ids.add(item.pageId);
        collect(item.children);
      }
    }
    collect(navItems);
    return ids;
  }, [navItems]);

  function addPageToNav(page: PageItem) {
    setNavItems((prev) => [...prev, {
      label: page.title, type: "PAGE" as const, pageId: page.id,
      url: null, children: [], _visible: true, _expanded: false,
    }]);
    setNavHasChanges(true);
  }

  function addAllRepoPages(repoId: string) {
    const repoPages = pages.filter((p) => p.githubRepoId === repoId && !pagesInNav.has(p.id));
    const repo = repos.find((r) => r.id === repoId);
    const section: NavItem = {
      label: repo ? `${repo.owner}/${repo.repo}` : "Imported",
      type: "SECTION", pageId: null, url: null, _visible: true, _expanded: true,
      children: repoPages.map((p) => ({
        label: p.title, type: "PAGE" as const, pageId: p.id,
        url: null, children: [], _visible: true, _expanded: false,
      })),
    };
    setNavItems((prev) => [...prev, section]);
    setNavHasChanges(true);
  }

  function removeNavItem(index: number) {
    setNavItems((prev) => prev.filter((_, i) => i !== index));
    setNavHasChanges(true);
  }

  function moveNavItem(index: number, dir: "up" | "down") {
    setNavItems((prev) => {
      const items = [...prev];
      const target = dir === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= items.length) return prev;
      [items[index], items[target]] = [items[target], items[index]];
      return items;
    });
    setNavHasChanges(true);
  }

  async function saveNav() {
    setNavSaving(true);
    const res = await fetch(`/api/admin/nav/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: navItems.filter((i) => i._visible).map(function strip(item: NavItem): any {
          return { label: item.label, type: item.type, pageId: item.pageId, url: item.url,
            children: item.children.filter((i) => i._visible).map(strip) };
        }),
      }),
    });
    if (res.ok) {
      setNavItems((await res.json()).map(mapNavItem));
      setNavHasChanges(false);
    }
    setNavSaving(false);
  }

  // ─── Settings helpers ────────────────────────────────────────────

  async function saveSettings() {
    setSettingsSaving(true);
    const res = await fetch(`/api/admin/spaces/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settingsForm),
    });
    if (res.ok) {
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2000);
    }
    setSettingsSaving(false);
  }

  async function addDomain() {
    if (!domainInput.trim()) return;
    setDomainAdding(true);
    const res = await fetch("/api/admin/domains", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spaceId: id, domain: domainInput }),
    });
    const data = await res.json();
    if (res.ok) {
      setSpace((s) => s ? { ...s, customDomain: domainInput.toLowerCase() } : s);
      setDomainInstructions(data.instructions);
      setDomainInput("");
    }
    setDomainAdding(false);
  }

  async function removeDomain() {
    if (!space?.customDomain || !confirm("Remove custom domain?")) return;
    await fetch("/api/admin/domains", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spaceId: id, domain: space.customDomain }),
    });
    setSpace((s) => s ? { ...s, customDomain: null } : s);
    setDomainInstructions(null);
  }

  async function deleteSpace() {
    if (!confirm(`Delete "${space?.name}" and ALL its content? This cannot be undone.`)) return;
    await fetch(`/api/admin/spaces/${id}`, { method: "DELETE" });
    router.push("/admin/spaces");
  }

  // ─── Render ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!space) {
    return <div className="p-6 text-muted-foreground">Space not found</div>;
  }

  const previewUrl = `/docs/${space.slug}`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/admin/spaces")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{space.name}</h1>
            <p className="text-sm text-muted-foreground">/docs/{space.slug}</p>
          </div>
        </div>
        <a href={previewUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm">
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            View Live
          </Button>
        </a>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        {([
          { id: "content" as const, label: "Content", icon: FileText },
          { id: "customize" as const, label: "Customize", icon: Palette },
          { id: "settings" as const, label: "Settings", icon: Settings },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ━━━ CONTENT TAB ━━━ */}
      {activeTab === "content" && (
        <div className="space-y-6">
          {/* Connected Repos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Connected Repositories</h2>
              <Button size="sm" onClick={() => setShowRepoModal(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Connect Repo
              </Button>
            </div>

            {repos.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Github className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">No repositories connected yet.</p>
                  <Button size="sm" className="mt-3" onClick={() => setShowRepoModal(true)}>
                    <Github className="mr-1.5 h-3.5 w-3.5" />
                    Connect your first repo
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {repos.map((repo) => {
                  const isSyncing = syncing.has(repo.id);
                  return (
                    <Card key={repo.id}>
                      <CardContent className="flex items-center gap-4 p-4">
                        <Github className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{repo.owner}/{repo.repo}</span>
                            <Badge variant={repo.lastSyncStatus === "SUCCESS" ? "success" : repo.lastSyncStatus === "ERROR" ? "destructive" : "secondary"} className="text-[10px]">
                              {repo._count.pages} pages
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {repo.branch} · {repo.docsPath}
                            {repo.lastSyncAt && ` · Synced ${new Date(repo.lastSyncAt).toLocaleDateString()}`}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" onClick={() => handleSync(repo.id)} disabled={isSyncing}>
                            <RefreshCw className={`mr-1 h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
                            Sync
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteRepo(repo.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pages */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Pages ({pages.length})</h2>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input placeholder="Search..." value={pageSearch} onChange={(e) => setPageSearch(e.target.value)} className="pl-8 h-8 w-48 text-sm" />
                </div>
                <Link href={`/admin/editor?spaceId=${id}`}>
                  <Button size="sm" variant="outline">
                    <PenTool className="mr-1.5 h-3.5 w-3.5" />
                    New Page
                  </Button>
                </Link>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="divide-y max-h-[400px] overflow-y-auto">
                  {filteredPages.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground text-sm">
                      {pages.length === 0 ? "No pages yet. Connect a repo or create a page." : "No pages match your search."}
                    </div>
                  ) : (
                    filteredPages.map((page) => {
                      const inNav = pagesInNav.has(page.id);
                      return (
                        <div key={page.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 group text-sm">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="font-medium truncate block">{page.title}</span>
                            <span className="text-xs text-muted-foreground">/{page.slug}</span>
                          </div>
                          <Badge variant={page.source === "GITHUB" ? "outline" : "secondary"} className="text-[10px] shrink-0">
                            {page.source === "GITHUB" ? "GitHub" : "Native"}
                          </Badge>
                          {inNav ? (
                            <Badge variant="success" className="text-[10px] shrink-0">In Menu</Badge>
                          ) : (
                            <Button variant="ghost" size="sm" className="h-7 text-xs opacity-0 group-hover:opacity-100" onClick={() => addPageToNav(page)}>
                              <Plus className="mr-1 h-3 w-3" />
                              Add to Menu
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" onClick={() => handleDeletePage(page.id, page.title)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ━━━ CUSTOMIZE TAB ━━━ */}
      {activeTab === "customize" && (
        <div className="space-y-6">
          {/* Nav builder */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Menu / Navigation</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => {
                  const label = prompt("Section name:");
                  if (label) {
                    setNavItems((prev) => [...prev, { label, type: "SECTION", pageId: null, url: null, children: [], _visible: true, _expanded: true }]);
                    setNavHasChanges(true);
                  }
                }}>
                  <FolderOpen className="mr-1.5 h-3.5 w-3.5" />
                  Add Section
                </Button>
                {repos.length > 0 && (
                  <Button variant="outline" size="sm" onClick={() => repos.forEach((r) => addAllRepoPages(r.id))}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Import All Pages
                  </Button>
                )}
                {navHasChanges && (
                  <Button size="sm" onClick={saveNav} disabled={navSaving}>
                    {navSaving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
                    Save Menu
                  </Button>
                )}
              </div>
            </div>

            <Card>
              <CardContent className="p-4">
                {navItems.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground text-sm">
                    <ArrowUpDown className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    <p>No menu items yet. Add pages from the Content tab or click "Import All Pages".</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {navItems.map((item, i) => (
                      <div key={item.id || `n-${i}`} className={!item._visible ? "opacity-40" : ""}>
                        <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 group hover:bg-muted/50">
                          <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                          {item.type === "SECTION" ? <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" /> : <FileText className="h-4 w-4 text-muted-foreground shrink-0" />}
                          <span className="text-sm flex-1 truncate">{item.label}</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{item.type}</Badge>
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveNavItem(i, "up")} disabled={i === 0}><span className="text-xs">^</span></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveNavItem(i, "down")} disabled={i === navItems.length - 1}><span className="text-xs">v</span></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { const u = [...navItems]; u[i] = { ...u[i], _visible: !u[i]._visible }; setNavItems(u); setNavHasChanges(true); }}>
                              {item._visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeNavItem(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </div>
                        {item.children.length > 0 && (
                          <div className="ml-6 mt-1 space-y-1 border-l-2 border-muted pl-3">
                            {item.children.map((child, ci) => (
                              <div key={child.id || `c-${ci}`} className="flex items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-sm group hover:bg-muted/50">
                                <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span className="flex-1 truncate">{child.label}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" onClick={() => {
                                  const u = [...navItems];
                                  u[i] = { ...u[i], children: u[i].children.filter((_, j) => j !== ci) };
                                  setNavItems(u);
                                  setNavHasChanges(true);
                                }}><Trash2 className="h-3 w-3" /></Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Branding */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Branding & Template</h2>
            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Template</label>
                  <div className="flex gap-2">
                    {["default", "modern", "minimal"].map((t) => (
                      <button key={t} onClick={() => { setSettingsForm({ ...settingsForm, headerLayout: t }); }} className={`rounded-md border px-3 py-1.5 text-sm capitalize ${settingsForm.headerLayout === t ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"}`}>{t}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Primary Color</label>
                  <div className="flex gap-2">
                    {COLOR_PRESETS.map((p) => (
                      <button key={p.name} onClick={() => setSettingsForm({ ...settingsForm, primaryColor: p.value })} className={`h-8 w-8 rounded-full border-2 ${settingsForm.primaryColor === p.value ? "border-foreground scale-110" : "border-transparent"}`} style={{ backgroundColor: p.value }} title={p.name} />
                    ))}
                    <input type="color" value={settingsForm.primaryColor} onChange={(e) => setSettingsForm({ ...settingsForm, primaryColor: e.target.value })} className="h-8 w-8 rounded border cursor-pointer" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Theme</label>
                  <div className="flex gap-2">
                    {["LIGHT", "DARK", "SYSTEM"].map((t) => (
                      <button key={t} onClick={() => setSettingsForm({ ...settingsForm, defaultTheme: t })} className={`rounded-md border px-3 py-1.5 text-sm ${settingsForm.defaultTheme === t ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"}`}>{t === "SYSTEM" ? "System" : t === "LIGHT" ? "Light" : "Dark"}</button>
                    ))}
                  </div>
                </div>
                <Button onClick={saveSettings} disabled={settingsSaving}>
                  {settingsSaved ? <><Check className="mr-2 h-4 w-4" />Saved!</> : settingsSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />Save Branding</>}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Preview</h2>
              <div className="flex gap-1">
                {([{ id: "desktop" as const, icon: Monitor }, { id: "tablet" as const, icon: Tablet }, { id: "mobile" as const, icon: Smartphone }]).map((d) => (
                  <Button key={d.id} variant={previewDevice === d.id ? "default" : "outline"} size="sm" onClick={() => setPreviewDevice(d.id)}><d.icon className="h-3.5 w-3.5" /></Button>
                ))}
              </div>
            </div>
            <div className="flex justify-center">
              <div className={`border rounded-xl overflow-hidden shadow-lg bg-white transition-all ${previewDevice === "desktop" ? "w-full h-[500px]" : previewDevice === "tablet" ? "w-[768px] h-[500px]" : "w-[375px] h-[500px]"}`}>
                <iframe src={previewUrl} className="w-full h-full border-0" title="Preview" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ━━━ SETTINGS TAB ━━━ */}
      {activeTab === "settings" && (
        <div className="space-y-6 max-w-2xl">
          {/* General */}
          <Card>
            <CardHeader><CardTitle>General</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Name</label>
                  <Input value={settingsForm.name} onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Slug</label>
                  <div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">/docs/</span><Input value={settingsForm.slug} onChange={(e) => setSettingsForm({ ...settingsForm, slug: e.target.value })} /></div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Description</label>
                <Input value={settingsForm.description} onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })} />
              </div>
              <Button onClick={saveSettings} disabled={settingsSaving}>
                {settingsSaved ? <><Check className="mr-2 h-4 w-4" />Saved!</> : <><Save className="mr-2 h-4 w-4" />Save</>}
              </Button>
            </CardContent>
          </Card>

          {/* Domain */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" />Custom Domain</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {space.customDomain ? (
                <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                  <div><p className="font-medium text-sm">{space.customDomain}</p><p className="text-xs text-muted-foreground">Active</p></div>
                  <Button variant="ghost" size="sm" onClick={removeDomain} className="text-muted-foreground hover:text-destructive"><Trash2 className="mr-1.5 h-3.5 w-3.5" />Remove</Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input placeholder="docs.yourdomain.com" value={domainInput} onChange={(e) => setDomainInput(e.target.value)} />
                  <Button onClick={addDomain} disabled={domainAdding || !domainInput.trim()}>
                    {domainAdding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Globe className="mr-2 h-4 w-4" />}
                    Add
                  </Button>
                </div>
              )}
              {domainInstructions && (
                <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/20 p-3 text-sm">
                  <p className="font-medium mb-1">{domainInstructions.message}</p>
                  <div className="font-mono text-xs bg-background rounded border p-2">
                    <div>Type: <strong>{domainInstructions.type}</strong></div>
                    <div>Name: <strong>{domainInstructions.name}</strong></div>
                    <div>Value: <strong>{domainInstructions.value}</strong></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader><CardTitle>SEO</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><label className="text-sm font-medium mb-1.5 block">SEO Title</label><Input value={settingsForm.seoTitle} onChange={(e) => setSettingsForm({ ...settingsForm, seoTitle: e.target.value })} placeholder={settingsForm.name} /></div>
              <div><label className="text-sm font-medium mb-1.5 block">SEO Description</label><Input value={settingsForm.seoDescription} onChange={(e) => setSettingsForm({ ...settingsForm, seoDescription: e.target.value })} /></div>
              <Button onClick={saveSettings} disabled={settingsSaving}>{settingsSaved ? <><Check className="mr-2 h-4 w-4" />Saved!</> : <><Save className="mr-2 h-4 w-4" />Save</>}</Button>
            </CardContent>
          </Card>

          {/* Custom CSS */}
          <Card>
            <CardHeader><CardTitle>Custom CSS</CardTitle></CardHeader>
            <CardContent>
              <textarea className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono" placeholder="/* Custom styles */" value={settingsForm.customCss} onChange={(e) => setSettingsForm({ ...settingsForm, customCss: e.target.value })} />
              <Button onClick={saveSettings} disabled={settingsSaving} className="mt-3">{settingsSaved ? "Saved!" : "Save"}</Button>
            </CardContent>
          </Card>

          {/* Danger */}
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader><CardTitle className="text-red-600">Danger Zone</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div><p className="font-medium text-sm">Delete this space</p><p className="text-xs text-muted-foreground">All pages, repos, and navigation will be permanently deleted.</p></div>
                <Button variant="destructive" size="sm" onClick={deleteSpace}><Trash2 className="mr-1.5 h-3.5 w-3.5" />Delete</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ━━━ CONNECT REPO MODAL ━━━ */}
      {showRepoModal && <ConnectRepoModal spaceId={id} onClose={() => setShowRepoModal(false)} onConnected={() => { setShowRepoModal(false); fetchAll(); }} />}
    </div>
  );
}

// ─── Connect Repo Modal ──────────────────────────────────────────────────────

function ConnectRepoModal({ spaceId, onClose, onConnected }: { spaceId: string; onClose: () => void; onConnected: () => void }) {
  const [ghRepos, setGhRepos] = useState<GitHubRepoOption[]>([]);
  const [ghSearch, setGhSearch] = useState("");
  const [ghLoading, setGhLoading] = useState(true);
  const [selected, setSelected] = useState<GitHubRepoOption | null>(null);
  const [branch, setBranch] = useState("");
  const [docsPath, setDocsPath] = useState("/");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => { fetchGH(""); }, []);
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchGH(ghSearch), 300);
    return () => clearTimeout(searchTimer.current);
  }, [ghSearch]);

  async function fetchGH(q: string) {
    setGhLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    const res = await fetch(`/api/admin/github/repos?${params}`);
    if (res.ok) setGhRepos(await res.json());
    setGhLoading(false);
  }

  async function handleConnect() {
    if (!selected) return;
    setCreating(true);
    setError("");
    const res = await fetch("/api/admin/repos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ owner: selected.owner, repo: selected.name, branch: branch || selected.defaultBranch, docsPath, spaceId }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed");
      setCreating(false);
      return;
    }
    onConnected();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-xl border bg-background p-6 shadow-2xl mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Connect Repository</h2>
          <button onClick={onClose}><X className="h-4 w-4" /></button>
        </div>

        {!selected ? (
          <>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search your repositories..." value={ghSearch} onChange={(e) => setGhSearch(e.target.value)} className="pl-10" autoFocus />
            </div>
            <div className="flex-1 overflow-y-auto border rounded-lg min-h-0">
              {ghLoading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : ghRepos.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No repositories found.</div>
              ) : (
                <div className="divide-y">
                  {ghRepos.map((repo) => (
                    <button key={repo.id} onClick={() => { setSelected(repo); setBranch(repo.defaultBranch); }} className="flex items-start gap-3 w-full px-4 py-3 text-left hover:bg-muted/50">
                      <Github className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2"><span className="font-medium text-sm truncate">{repo.fullName}</span>{repo.isPrivate && <Lock className="h-3 w-3 text-muted-foreground" />}</div>
                        {repo.description && <p className="text-xs text-muted-foreground line-clamp-1">{repo.description}</p>}
                        <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                          {repo.language && <span>{repo.language}</span>}
                          {repo.stargazersCount > 0 && <span className="flex items-center gap-0.5"><Star className="h-3 w-3" />{repo.stargazersCount}</span>}
                          <span>{repo.defaultBranch}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
              <Github className="h-5 w-5" />
              <div className="flex-1"><span className="font-medium text-sm">{selected.fullName}</span></div>
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Change</Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Branch</label>
                <Input value={branch} onChange={(e) => setBranch(e.target.value)} placeholder={selected.defaultBranch} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Docs Path</label>
                <Input value={docsPath} onChange={(e) => setDocsPath(e.target.value)} placeholder="/ or /docs" />
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleConnect} disabled={creating}>
                {creating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Connecting...</> : <><FolderGit2 className="mr-2 h-4 w-4" />Connect & Sync</>}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
