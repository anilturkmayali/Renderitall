"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Save,
  Loader2,
  Check,
  Plus,
  Trash2,
  FileText,
  FolderOpen,
  Eye,
  ChevronUp,
  ChevronDown,
  Monitor,
  Smartphone,
  Tablet,
  RefreshCw,
  Palette,
  Github,
  PenTool,
  Link2,
  X,
  ArrowRight,
  CornerDownRight,
  CornerUpLeft,
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
  primaryColor: string | null;
  defaultTheme: string;
  headerLayout: string | null;
}
interface Repo {
  id: string;
  owner: string;
  repo: string;
  spaceId: string;
  _count: { pages: number };
}
interface PageItem {
  id: string;
  title: string;
  slug: string;
  source: string;
  githubRepoId: string | null;
}
interface NavItem {
  id?: string;
  label: string;
  type: "PAGE" | "SECTION" | "LINK";
  pageId: string | null;
  url: string | null;
  children: NavItem[];
}

const COLORS = [
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#10b981" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Orange", value: "#f97316" },
  { name: "Teal", value: "#0d9488" },
  { name: "Rose", value: "#f43f5e" },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function DesignPage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState("");
  const [repos, setRepos] = useState<Repo[]>([]);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Preview state
  const [showPreview, setShowPreview] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [previewKey, setPreviewKey] = useState(0);

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addTargetSection, setAddTargetSection] = useState<number | null>(null); // index of parent section, null = top level
  const [addType, setAddType] = useState<"github" | "custom" | "section" | "link">("github");
  const [addRepoId, setAddRepoId] = useState("");
  const [addPageId, setAddPageId] = useState("");
  const [addLabel, setAddLabel] = useState("");
  const [addUrl, setAddUrl] = useState("");

  // Branding
  const [branding, setBranding] = useState({ primaryColor: "#3b82f6", defaultTheme: "SYSTEM", headerLayout: "default" });
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [brandingSaved, setBrandingSaved] = useState(false);

  // ─── Data loading ──────────────────────────────────────────────

  useEffect(() => {
    fetch("/api/admin/spaces").then((r) => r.json()).then((d) => {
      setSpaces(d);
      if (d.length > 0) setSelectedSpaceId(d[0].id);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedSpaceId) loadSpaceData();
  }, [selectedSpaceId]);

  async function loadSpaceData() {
    setLoading(true);
    const [reposRes, pagesRes, navRes, spaceRes] = await Promise.all([
      fetch("/api/admin/repos"),
      fetch(`/api/admin/pages?spaceId=${selectedSpaceId}`),
      fetch(`/api/admin/nav/${selectedSpaceId}`),
      fetch(`/api/admin/spaces/${selectedSpaceId}`),
    ]);
    if (reposRes.ok) setRepos((await reposRes.json()).filter((r: any) => r.spaceId === selectedSpaceId));
    if (pagesRes.ok) setPages(await pagesRes.json());
    if (navRes.ok) setNavItems((await navRes.json()).map(mapNav));
    if (spaceRes.ok) {
      const s = await spaceRes.json();
      setBranding({ primaryColor: s.primaryColor || "#3b82f6", defaultTheme: s.defaultTheme || "SYSTEM", headerLayout: s.headerLayout || "default" });
    }
    setLoading(false);
    setHasChanges(false);
  }

  function mapNav(item: any): NavItem {
    return { id: item.id, label: item.label, type: item.type, pageId: item.pageId, url: item.url, children: (item.children || []).map(mapNav) };
  }

  // ─── Computed ──────────────────────────────────────────────────

  const ghPagesByRepo = useMemo(() => {
    const m = new Map<string, PageItem[]>();
    for (const p of pages) {
      if (p.source === "GITHUB" && p.githubRepoId) {
        const arr = m.get(p.githubRepoId) || [];
        arr.push(p);
        m.set(p.githubRepoId, arr);
      }
    }
    return m;
  }, [pages]);

  const customPages = useMemo(() => pages.filter((p) => p.source === "NATIVE"), [pages]);

  const pagesInNav = useMemo(() => {
    const ids = new Set<string>();
    function collect(items: NavItem[]) { for (const i of items) { if (i.pageId) ids.add(i.pageId); collect(i.children); } }
    collect(navItems);
    return ids;
  }, [navItems]);

  const selectedSpace = spaces.find((s) => s.id === selectedSpaceId);

  // ─── Menu actions ──────────────────────────────────────────────

  function openAddModal(parentSectionIndex: number | null) {
    setAddTargetSection(parentSectionIndex);
    setAddType("github");
    setAddRepoId(repos[0]?.id || "");
    setAddPageId("");
    setAddLabel("");
    setAddUrl("");
    setShowAddModal(true);
  }

  function addItem() {
    let newItem: NavItem | null = null;

    if (addType === "section") {
      if (!addLabel.trim()) return;
      newItem = { label: addLabel, type: "SECTION", pageId: null, url: null, children: [] };
    } else if (addType === "link") {
      if (!addLabel.trim() || !addUrl.trim()) return;
      newItem = { label: addLabel, type: "LINK", pageId: null, url: addUrl, children: [] };
    } else {
      if (!addPageId) return;
      const page = pages.find((p) => p.id === addPageId);
      if (!page) return;
      newItem = { label: page.title, type: "PAGE", pageId: page.id, url: null, children: [] };
    }
    if (!newItem) return;

    if (addTargetSection !== null && navItems[addTargetSection]?.type === "SECTION") {
      const updated = [...navItems];
      updated[addTargetSection] = { ...updated[addTargetSection], children: [...updated[addTargetSection].children, newItem] };
      setNavItems(updated);
    } else {
      setNavItems([...navItems, newItem]);
    }
    setHasChanges(true);
    setShowAddModal(false);
  }

  function removeItem(index: number) {
    setNavItems(navItems.filter((_, i) => i !== index));
    setHasChanges(true);
  }

  function removeChild(parentIndex: number, childIndex: number) {
    const updated = [...navItems];
    updated[parentIndex] = { ...updated[parentIndex], children: updated[parentIndex].children.filter((_, i) => i !== childIndex) };
    setNavItems(updated);
    setHasChanges(true);
  }

  function moveItem(index: number, dir: "up" | "down") {
    const items = [...navItems];
    const t = dir === "up" ? index - 1 : index + 1;
    if (t < 0 || t >= items.length) return;
    [items[index], items[t]] = [items[t], items[index]];
    setNavItems(items);
    setHasChanges(true);
  }

  function moveChild(parentIndex: number, childIndex: number, dir: "up" | "down") {
    const updated = [...navItems];
    const children = [...updated[parentIndex].children];
    const t = dir === "up" ? childIndex - 1 : childIndex + 1;
    if (t < 0 || t >= children.length) return;
    [children[childIndex], children[t]] = [children[t], children[childIndex]];
    updated[parentIndex] = { ...updated[parentIndex], children };
    setNavItems(updated);
    setHasChanges(true);
  }

  // Move a top-level item into the nearest section above it
  function indentItem(index: number) {
    for (let i = index - 1; i >= 0; i--) {
      if (navItems[i].type === "SECTION") {
        const item = { ...navItems[index] };
        const updated = navItems.filter((_, idx) => idx !== index);
        // After removal, the section index shifts if it was after the removed item (it won't be since i < index)
        updated[i] = { ...updated[i], children: [...updated[i].children, item] };
        setNavItems(updated);
        setHasChanges(true);
        return;
      }
    }
  }

  // Add all pages from a repo as a section
  function addAllFromRepo(repoId: string) {
    const repo = repos.find((r) => r.id === repoId);
    const repoPages = (ghPagesByRepo.get(repoId) || []).filter((p) => !pagesInNav.has(p.id));
    if (repoPages.length === 0) return;

    const section: NavItem = {
      label: repo ? `${repo.owner}/${repo.repo}` : "Imported Pages",
      type: "SECTION",
      pageId: null,
      url: null,
      children: repoPages.map((p) => ({
        label: p.title,
        type: "PAGE" as const,
        pageId: p.id,
        url: null,
        children: [],
      })),
    };
    setNavItems([...navItems, section]);
    setHasChanges(true);
  }

  // Move a child item out of its section to top level
  function outdentChild(parentIndex: number, childIndex: number) {
    const child = navItems[parentIndex].children[childIndex];
    const updated = [...navItems];
    updated[parentIndex] = { ...updated[parentIndex], children: updated[parentIndex].children.filter((_, i) => i !== childIndex) };
    // Insert after the parent section
    updated.splice(parentIndex + 1, 0, child);
    setNavItems(updated);
    setHasChanges(true);
  }

  // ─── Save ──────────────────────────────────────────────────────

  async function saveMenu() {
    setSaving(true);
    function strip(item: NavItem): any {
      return { label: item.label, type: item.type, pageId: item.pageId, url: item.url, children: item.children.map(strip) };
    }
    const res = await fetch(`/api/admin/nav/${selectedSpaceId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: navItems.map(strip) }),
    });
    if (res.ok) {
      setNavItems((await res.json()).map(mapNav));
      setHasChanges(false);
      setPreviewKey((k) => k + 1); // force preview refresh
    }
    setSaving(false);
  }

  async function saveStyle() {
    setBrandingSaving(true);
    await fetch(`/api/admin/spaces/${selectedSpaceId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(branding),
    });
    setBrandingSaved(true);
    setTimeout(() => setBrandingSaved(false), 2000);
    setBrandingSaving(false);
    setPreviewKey((k) => k + 1);
  }

  // ─── Render ────────────────────────────────────────────────────

  if (loading && spaces.length === 0) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Design</h1>
          <p className="text-muted-foreground text-sm">Build and customize your documentation site.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={showPreview ? "default" : "outline"} size="sm" onClick={() => setShowPreview(!showPreview)}>
            <Eye className="mr-1.5 h-3.5 w-3.5" />{showPreview ? "Hide Preview" : "Show Preview"}
          </Button>
          {hasChanges && (
            <Button onClick={saveMenu} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Menu
            </Button>
          )}
        </div>
      </div>

      {/* Space selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium">Site:</label>
        <select className="h-9 rounded-md border border-input bg-transparent px-3 text-sm font-medium" value={selectedSpaceId} onChange={(e) => setSelectedSpaceId(e.target.value)}>
          {spaces.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {selectedSpace && (
          <a href={`/docs/${selectedSpace.slug}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
            View live site →
          </a>
        )}
      </div>

      {loading ? <div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

          {/* ━━━ LEFT: Menu Builder ━━━ */}
          <div>
            <Card>
              <CardHeader className="py-3 flex flex-row items-center justify-between border-b">
                <CardTitle className="text-base">Menu Structure</CardTitle>
                <div className="flex gap-2">
                  {repos.length > 0 && (
                    <select
                      className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) {
                          addAllFromRepo(e.target.value);
                          e.target.value = "";
                        }
                      }}
                    >
                      <option value="">+ Add entire repo...</option>
                      {repos.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.owner}/{r.repo} ({r._count.pages} pages)
                        </option>
                      ))}
                    </select>
                  )}
                  <Button size="sm" onClick={() => openAddModal(null)}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" />Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {navItems.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <FolderOpen className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm font-medium mb-1">No menu items yet</p>
                    <p className="text-xs mb-4">Add pages from your repositories or create sections to organize content.</p>
                    <Button size="sm" onClick={() => openAddModal(null)}>
                      <Plus className="mr-1.5 h-3.5 w-3.5" />Add First Item
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y">
                    {navItems.map((item, i) => (
                      <div key={item.id || `n-${i}`}>
                        {/* Top-level item */}
                        <div className={`flex items-center gap-3 px-4 py-3 ${item.type === "SECTION" ? "bg-muted/30" : ""}`}>
                          {item.type === "SECTION" ? (
                            <FolderOpen className="h-4 w-4 text-primary shrink-0" />
                          ) : item.type === "LINK" ? (
                            <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                          ) : (
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}

                          <div className="flex-1 min-w-0">
                            <span className={`text-sm truncate block ${item.type === "SECTION" ? "font-semibold" : ""}`}>
                              {item.label}
                            </span>
                            {item.type === "LINK" && item.url && (
                              <span className="text-xs text-muted-foreground truncate block">{item.url}</span>
                            )}
                          </div>

                          <Badge variant="outline" className="text-[10px] shrink-0">
                            {item.type === "SECTION" ? "Section" : item.type === "LINK" ? "Link" : "Page"}
                          </Badge>

                          {/* Actions — always visible */}
                          <div className="flex items-center gap-1 shrink-0">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveItem(i, "up")} disabled={i === 0} title="Move up">
                              <ChevronUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveItem(i, "down")} disabled={i === navItems.length - 1} title="Move down">
                              <ChevronDown className="h-3.5 w-3.5" />
                            </Button>
                            {item.type !== "SECTION" && (
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => indentItem(i)} title="Move into section above">
                                <CornerDownRight className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={() => removeItem(i)} title="Remove">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Children of a section */}
                        {item.type === "SECTION" && (
                          <div className="border-l-2 border-primary/20 ml-6">
                            {item.children.map((child, ci) => (
                              <div key={child.id || `c-${ci}`} className="flex items-center gap-3 px-4 py-2.5 border-b last:border-0 hover:bg-muted/30">
                                <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span className="text-sm flex-1 truncate">{child.label}</span>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveChild(i, ci, "up")} disabled={ci === 0}>
                                    <ChevronUp className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveChild(i, ci, "down")} disabled={ci === item.children.length - 1}>
                                    <ChevronDown className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => outdentChild(i, ci)} title="Move out of section">
                                    <CornerUpLeft className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={() => removeChild(i, ci)} title="Remove">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                            {/* Add to section button */}
                            <button
                              onClick={() => openAddModal(i)}
                              className="flex items-center gap-2 w-full px-4 py-2 text-xs text-muted-foreground hover:text-primary hover:bg-muted/30 transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                              Add to &quot;{item.label}&quot;
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ━━━ RIGHT: Visual Style ━━━ */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="py-3 border-b">
                <CardTitle className="text-base flex items-center gap-2"><Palette className="h-4 w-4" />Visual Style</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div>
                  <label className="text-xs font-medium mb-2 block text-muted-foreground uppercase tracking-wider">Template</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["default", "modern", "minimal"].map((t) => (
                      <button key={t} onClick={() => setBranding({ ...branding, headerLayout: t })} className={`rounded-lg border-2 px-3 py-2 text-xs font-medium capitalize transition-all ${branding.headerLayout === t ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/30"}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium mb-2 block text-muted-foreground uppercase tracking-wider">Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {COLORS.map((c) => (
                      <button key={c.name} onClick={() => setBranding({ ...branding, primaryColor: c.value })} className={`h-7 w-7 rounded-full border-2 transition-all ${branding.primaryColor === c.value ? "border-foreground scale-110 ring-2 ring-offset-2 ring-primary/30" : "border-transparent hover:scale-105"}`} style={{ backgroundColor: c.value }} title={c.name} />
                    ))}
                    <div className="flex items-center gap-1.5 ml-1">
                      <input type="color" value={branding.primaryColor} onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })} className="h-7 w-7 rounded border cursor-pointer" />
                      <span className="text-xs text-muted-foreground font-mono">{branding.primaryColor}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium mb-2 block text-muted-foreground uppercase tracking-wider">Theme</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[{ id: "LIGHT", label: "Light" }, { id: "DARK", label: "Dark" }, { id: "SYSTEM", label: "Auto" }].map((t) => (
                      <button key={t.id} onClick={() => setBranding({ ...branding, defaultTheme: t.id })} className={`rounded-lg border-2 px-3 py-2 text-xs font-medium transition-all ${branding.defaultTheme === t.id ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/30"}`}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Button size="sm" onClick={saveStyle} disabled={brandingSaving} className="w-full">
                  {brandingSaved ? <><Check className="mr-1.5 h-3.5 w-3.5" />Saved!</> : brandingSaving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <><Save className="mr-1.5 h-3.5 w-3.5" />Save Style</>}
                </Button>
              </CardContent>
            </Card>

            {/* Quick stats */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <div className="text-xl font-bold">{navItems.length}</div>
                    <div className="text-[10px] text-muted-foreground uppercase">Menu Items</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <div className="text-xl font-bold">{pages.length}</div>
                    <div className="text-[10px] text-muted-foreground uppercase">Total Pages</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ━━━ PREVIEW (collapsible) ━━━ */}
      {showPreview && selectedSpace && (
        <Card>
          <CardHeader className="py-3 flex flex-row items-center justify-between border-b">
            <CardTitle className="text-base">Preview</CardTitle>
            <div className="flex items-center gap-1">
              {([{ id: "desktop" as const, icon: Monitor, label: "Desktop" }, { id: "tablet" as const, icon: Tablet, label: "Tablet" }, { id: "mobile" as const, icon: Smartphone, label: "Mobile" }]).map((d) => (
                <Button key={d.id} variant={previewDevice === d.id ? "default" : "ghost"} size="sm" onClick={() => setPreviewDevice(d.id)}>
                  <d.icon className="mr-1 h-3.5 w-3.5" />{d.label}
                </Button>
              ))}
              <Button variant="ghost" size="sm" onClick={() => setPreviewKey((k) => k + 1)}>
                <RefreshCw className="mr-1 h-3.5 w-3.5" />Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex justify-center">
              <div className={`border rounded-xl overflow-hidden shadow-lg bg-white transition-all ${previewDevice === "desktop" ? "w-full h-[550px]" : previewDevice === "tablet" ? "w-[768px] h-[550px]" : "w-[375px] h-[550px]"}`}>
                <iframe key={previewKey} src={`/docs/${selectedSpace.slug}`} className="w-full h-full border-0" title="Preview" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ━━━ ADD ITEM MODAL ━━━ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border bg-background p-5 shadow-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">
                {addTargetSection !== null ? `Add to "${navItems[addTargetSection]?.label}"` : "Add Menu Item"}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="rounded p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>

            {/* Type tabs */}
            <div className="grid grid-cols-4 gap-1.5 mb-5 p-1 bg-muted/50 rounded-lg">
              {([
                { id: "github" as const, label: "Repository", icon: Github },
                { id: "custom" as const, label: "Custom", icon: PenTool },
                { id: "section" as const, label: "Section", icon: FolderOpen },
                { id: "link" as const, label: "Link", icon: Link2 },
              ]).map((t) => (
                <button key={t.id} onClick={() => setAddType(t.id)} className={`flex flex-col items-center gap-1 rounded-md px-2 py-2 text-xs font-medium transition-all ${addType === t.id ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                  <t.icon className="h-4 w-4" />
                  {t.label}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {addType === "github" && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Repository</label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={addRepoId} onChange={(e) => { setAddRepoId(e.target.value); setAddPageId(""); }}>
                      <option value="">Select repository...</option>
                      {repos.map((r) => <option key={r.id} value={r.id}>{r.owner}/{r.repo} ({r._count.pages} pages)</option>)}
                    </select>
                    {repos.length === 0 && <p className="text-xs text-amber-600 mt-1">No repos connected. Go to Repositories to connect one first.</p>}
                  </div>
                  {addRepoId && (
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Page</label>
                      <select className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={addPageId} onChange={(e) => setAddPageId(e.target.value)}>
                        <option value="">Select page...</option>
                        {(ghPagesByRepo.get(addRepoId) || []).map((p) => (
                          <option key={p.id} value={p.id} disabled={pagesInNav.has(p.id)}>
                            {p.title}{pagesInNav.has(p.id) ? " (already in menu)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}

              {addType === "custom" && (
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Custom Page</label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={addPageId} onChange={(e) => setAddPageId(e.target.value)}>
                    <option value="">Select page...</option>
                    {customPages.map((p) => (
                      <option key={p.id} value={p.id} disabled={pagesInNav.has(p.id)}>
                        {p.title}{pagesInNav.has(p.id) ? " (already in menu)" : ""}
                      </option>
                    ))}
                  </select>
                  {customPages.length === 0 && <p className="text-xs text-amber-600 mt-1">No custom pages yet. Create one in the Pages module.</p>}
                </div>
              )}

              {addType === "section" && (
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Section Name</label>
                  <Input value={addLabel} onChange={(e) => setAddLabel(e.target.value)} placeholder="e.g. Getting Started, API Reference" className="h-10" autoFocus />
                  <p className="text-xs text-muted-foreground mt-1">Sections group menu items together under a heading.</p>
                </div>
              )}

              {addType === "link" && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Label</label>
                    <Input value={addLabel} onChange={(e) => setAddLabel(e.target.value)} placeholder="Link text" className="h-10" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">URL</label>
                    <Input value={addUrl} onChange={(e) => setAddUrl(e.target.value)} placeholder="https://..." className="h-10" />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button onClick={addItem}>
                <Plus className="mr-1.5 h-4 w-4" />Add to Menu
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
