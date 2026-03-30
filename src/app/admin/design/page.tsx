"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Save,
  Loader2,
  Check,
  Plus,
  Trash2,
  GripVertical,
  FileText,
  FolderOpen,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Monitor,
  Smartphone,
  Tablet,
  RefreshCw,
  Palette,
  Github,
  PenTool,
  Link2,
  ArrowUpDown,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Space { id: string; name: string; slug: string; primaryColor: string | null; accentColor: string | null; defaultTheme: string; headerLayout: string | null; }
interface Repo { id: string; owner: string; repo: string; _count: { pages: number }; spaceId: string; }
interface PageItem { id: string; title: string; slug: string; source: string; githubRepoId: string | null; spaceId?: string; space?: { name: string; slug: string }; }
interface NavItem { id?: string; label: string; type: "PAGE" | "SECTION" | "LINK"; pageId: string | null; url: string | null; children: NavItem[]; _visible: boolean; }

const COLOR_PRESETS = [
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#10b981" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Orange", value: "#f97316" },
  { name: "Teal", value: "#0d9488" },
  { name: "Rose", value: "#f43f5e" },
];

export default function DesignPage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState("");
  const [repos, setRepos] = useState<Repo[]>([]);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [navSaving, setNavSaving] = useState(false);
  const [navHasChanges, setNavHasChanges] = useState(false);
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [brandingSaved, setBrandingSaved] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");

  // Add menu item modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<"github" | "custom" | "section" | "link">("github");
  const [addRepoId, setAddRepoId] = useState("");
  const [addPageId, setAddPageId] = useState("");
  const [addLabel, setAddLabel] = useState("");
  const [addUrl, setAddUrl] = useState("");
  const [addParentIndex, setAddParentIndex] = useState<number | null>(null);

  // Branding
  const [branding, setBranding] = useState({ primaryColor: "#3b82f6", defaultTheme: "SYSTEM", headerLayout: "default" });

  useEffect(() => {
    fetch("/api/admin/spaces").then((r) => r.json()).then((d) => {
      setSpaces(d);
      if (d.length > 0) setSelectedSpaceId(d[0].id);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedSpaceId) fetchSpaceData();
  }, [selectedSpaceId]);

  async function fetchSpaceData() {
    setLoading(true);
    const [reposRes, pagesRes, navRes, spaceRes] = await Promise.all([
      fetch("/api/admin/repos"),
      fetch(`/api/admin/pages?spaceId=${selectedSpaceId}`),
      fetch(`/api/admin/nav/${selectedSpaceId}`),
      fetch(`/api/admin/spaces/${selectedSpaceId}`),
    ]);
    if (reposRes.ok) {
      const all = await reposRes.json();
      setRepos(all.filter((r: any) => r.spaceId === selectedSpaceId));
    }
    if (pagesRes.ok) setPages(await pagesRes.json());
    if (navRes.ok) setNavItems((await navRes.json()).map(mapNav));
    if (spaceRes.ok) {
      const s = await spaceRes.json();
      setBranding({ primaryColor: s.primaryColor || "#3b82f6", defaultTheme: s.defaultTheme || "SYSTEM", headerLayout: s.headerLayout || "default" });
    }
    setLoading(false);
  }

  function mapNav(item: any): NavItem {
    return { id: item.id, label: item.label, type: item.type, pageId: item.pageId, url: item.url, _visible: true, children: (item.children || []).map(mapNav) };
  }

  // Filter pages by repo
  const ghPagesByRepo = useMemo(() => {
    const m = new Map<string, PageItem[]>();
    for (const p of pages) {
      if (p.source === "GITHUB" && p.githubRepoId) {
        const existing = m.get(p.githubRepoId) || [];
        existing.push(p);
        m.set(p.githubRepoId, existing);
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

  // ─── Add menu item ──────────────────────────────────────────────

  function handleAddItem() {
    let newItem: NavItem | null = null;

    if (addType === "section") {
      if (!addLabel.trim()) return;
      newItem = { label: addLabel, type: "SECTION", pageId: null, url: null, children: [], _visible: true };
    } else if (addType === "link") {
      if (!addLabel.trim() || !addUrl.trim()) return;
      newItem = { label: addLabel, type: "LINK", pageId: null, url: addUrl, children: [], _visible: true };
    } else {
      // GitHub or Custom page
      if (!addPageId) return;
      const page = pages.find((p) => p.id === addPageId);
      if (!page) return;
      newItem = { label: page.title, type: "PAGE", pageId: page.id, url: null, children: [], _visible: true };
    }

    if (!newItem) return;

    if (addParentIndex !== null && addParentIndex >= 0 && navItems[addParentIndex]?.type === "SECTION") {
      const updated = [...navItems];
      updated[addParentIndex] = { ...updated[addParentIndex], children: [...updated[addParentIndex].children, newItem] };
      setNavItems(updated);
    } else {
      setNavItems([...navItems, newItem]);
    }

    setNavHasChanges(true);
    setShowAddModal(false);
    resetAddForm();
  }

  function resetAddForm() {
    setAddType("github");
    setAddRepoId(repos[0]?.id || "");
    setAddPageId("");
    setAddLabel("");
    setAddUrl("");
    setAddParentIndex(null);
  }

  function removeNavItem(index: number) {
    setNavItems(navItems.filter((_, i) => i !== index));
    setNavHasChanges(true);
  }

  function removeChildNavItem(parentIndex: number, childIndex: number) {
    const updated = [...navItems];
    updated[parentIndex] = { ...updated[parentIndex], children: updated[parentIndex].children.filter((_, i) => i !== childIndex) };
    setNavItems(updated);
    setNavHasChanges(true);
  }

  function moveNavItem(index: number, dir: "up" | "down") {
    const items = [...navItems];
    const t = dir === "up" ? index - 1 : index + 1;
    if (t < 0 || t >= items.length) return;
    [items[index], items[t]] = [items[t], items[index]];
    setNavItems(items);
    setNavHasChanges(true);
  }

  async function saveNav() {
    setNavSaving(true);
    function strip(item: NavItem): any {
      return { label: item.label, type: item.type, pageId: item.pageId, url: item.url, children: item.children.filter((i) => i._visible).map(strip) };
    }
    const res = await fetch(`/api/admin/nav/${selectedSpaceId}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: navItems.filter((i) => i._visible).map(strip) }),
    });
    if (res.ok) { setNavItems((await res.json()).map(mapNav)); setNavHasChanges(false); }
    setNavSaving(false);
  }

  async function saveBranding() {
    setBrandingSaving(true);
    await fetch(`/api/admin/spaces/${selectedSpaceId}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(branding),
    });
    setBrandingSaved(true);
    setTimeout(() => setBrandingSaved(false), 2000);
    setBrandingSaving(false);
  }

  const selectedSpace = spaces.find((s) => s.id === selectedSpaceId);
  const previewUrl = selectedSpace ? `/docs/${selectedSpace.slug}` : null;

  if (loading && spaces.length === 0) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Design</h1>
          <p className="text-muted-foreground">Build your documentation site visually.</p>
        </div>
        {navHasChanges && (
          <Button onClick={saveNav} disabled={navSaving}>
            {navSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Menu
          </Button>
        )}
      </div>

      {/* Space selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium">Space:</label>
        <select className="h-9 rounded-md border border-input bg-transparent px-3 text-sm font-medium" value={selectedSpaceId} onChange={(e) => setSelectedSpaceId(e.target.value)}>
          {spaces.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {previewUrl && (
          <a href={previewUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm"><Eye className="mr-1.5 h-3.5 w-3.5" />View Live</Button>
          </a>
        )}
      </div>

      {loading ? <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div> : (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_450px] gap-6">
          {/* Left: Preview */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Preview</h2>
              <div className="flex gap-1">
                {([{ id: "desktop" as const, icon: Monitor }, { id: "tablet" as const, icon: Tablet }, { id: "mobile" as const, icon: Smartphone }]).map((d) => (
                  <Button key={d.id} variant={previewDevice === d.id ? "default" : "ghost"} size="icon" className="h-7 w-7" onClick={() => setPreviewDevice(d.id)}><d.icon className="h-3.5 w-3.5" /></Button>
                ))}
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { const f = document.getElementById("design-preview") as HTMLIFrameElement; if (f) f.src = f.src; }}><RefreshCw className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
            <div className="flex justify-center">
              <div className={`border rounded-xl overflow-hidden shadow-lg bg-white transition-all ${previewDevice === "desktop" ? "w-full h-[600px]" : previewDevice === "tablet" ? "w-[768px] h-[600px]" : "w-[375px] h-[600px]"}`}>
                {previewUrl ? <iframe id="design-preview" src={previewUrl} className="w-full h-full border-0" title="Preview" /> : <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Select a space</div>}
              </div>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="space-y-4">
            {/* Menu Builder */}
            <Card>
              <CardHeader className="py-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold">Menu Items</CardTitle>
                <Button size="sm" variant="outline" onClick={() => { resetAddForm(); setShowAddModal(true); }}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />Add Item
                </Button>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                {navItems.length === 0 ? (
                  <div className="py-6 text-center text-muted-foreground text-sm">
                    <ArrowUpDown className="mx-auto h-6 w-6 mb-2 opacity-50" />
                    No menu items yet. Click "Add Item" to start building.
                  </div>
                ) : (
                  <div className="space-y-1 max-h-[300px] overflow-y-auto">
                    {navItems.map((item, i) => (
                      <div key={item.id || `n-${i}`}>
                        <div className={`flex items-center gap-1.5 rounded border px-2 py-1.5 text-sm group hover:bg-muted/50 ${!item._visible ? "opacity-40" : ""}`}>
                          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                          {item.type === "SECTION" ? <FolderOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : item.type === "LINK" ? <Link2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                          <span className="flex-1 truncate text-xs">{item.label}</span>
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 shrink-0">
                            <button className="p-0.5 rounded hover:bg-muted" onClick={() => moveNavItem(i, "up")} disabled={i === 0}><ChevronDown className="h-3 w-3 rotate-180" /></button>
                            <button className="p-0.5 rounded hover:bg-muted" onClick={() => moveNavItem(i, "down")} disabled={i === navItems.length - 1}><ChevronDown className="h-3 w-3" /></button>
                            {item.type === "SECTION" && <button className="p-0.5 rounded hover:bg-muted" onClick={() => { resetAddForm(); setAddParentIndex(i); setShowAddModal(true); }}><Plus className="h-3 w-3" /></button>}
                            <button className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive" onClick={() => removeNavItem(i)}><Trash2 className="h-3 w-3" /></button>
                          </div>
                        </div>
                        {item.children.length > 0 && (
                          <div className="ml-5 mt-0.5 space-y-0.5 border-l border-muted pl-2">
                            {item.children.map((child, ci) => (
                              <div key={child.id || `c-${ci}`} className="flex items-center gap-1.5 rounded border px-2 py-1 text-xs group hover:bg-muted/50">
                                <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="flex-1 truncate">{child.label}</span>
                                <button className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted-foreground hover:text-destructive" onClick={() => removeChildNavItem(i, ci)}><Trash2 className="h-3 w-3" /></button>
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

            {/* Visual Settings */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><Palette className="h-4 w-4" />Visual Style</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-3">
                <div>
                  <label className="text-xs font-medium mb-1.5 block">Template</label>
                  <div className="flex gap-1.5">
                    {["default", "modern", "minimal"].map((t) => (
                      <button key={t} onClick={() => setBranding({ ...branding, headerLayout: t })} className={`rounded border px-2.5 py-1 text-xs capitalize ${branding.headerLayout === t ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"}`}>{t}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block">Color</label>
                  <div className="flex gap-1.5 items-center">
                    {COLOR_PRESETS.map((c) => (
                      <button key={c.name} onClick={() => setBranding({ ...branding, primaryColor: c.value })} className={`h-6 w-6 rounded-full border-2 ${branding.primaryColor === c.value ? "border-foreground scale-110" : "border-transparent"}`} style={{ backgroundColor: c.value }} />
                    ))}
                    <input type="color" value={branding.primaryColor} onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })} className="h-6 w-6 rounded border cursor-pointer" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block">Theme</label>
                  <div className="flex gap-1.5">
                    {["LIGHT", "DARK", "SYSTEM"].map((t) => (
                      <button key={t} onClick={() => setBranding({ ...branding, defaultTheme: t })} className={`rounded border px-2.5 py-1 text-xs ${branding.defaultTheme === t ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"}`}>{t === "SYSTEM" ? "Auto" : t === "LIGHT" ? "Light" : "Dark"}</button>
                    ))}
                  </div>
                </div>
                <Button size="sm" onClick={saveBranding} disabled={brandingSaving} className="w-full">
                  {brandingSaved ? <><Check className="mr-1.5 h-3.5 w-3.5" />Saved!</> : brandingSaving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <><Save className="mr-1.5 h-3.5 w-3.5" />Save Style</>}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ─── Add Menu Item Modal ─────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border bg-background p-5 shadow-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Add Menu Item</h3>
              <button onClick={() => setShowAddModal(false)}><X className="h-4 w-4" /></button>
            </div>

            {/* Type selector */}
            <div className="flex gap-1.5 mb-4">
              {([
                { id: "github" as const, label: "From Repository", icon: Github },
                { id: "custom" as const, label: "Custom Page", icon: PenTool },
                { id: "section" as const, label: "Section", icon: FolderOpen },
                { id: "link" as const, label: "External Link", icon: Link2 },
              ]).map((t) => (
                <button key={t.id} onClick={() => setAddType(t.id)} className={`flex items-center gap-1.5 rounded border px-2.5 py-1.5 text-xs font-medium ${addType === t.id ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"}`}>
                  <t.icon className="h-3.5 w-3.5" />{t.label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {addType === "github" && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Repository</label>
                    <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={addRepoId} onChange={(e) => { setAddRepoId(e.target.value); setAddPageId(""); }}>
                      <option value="">Select repo...</option>
                      {repos.map((r) => <option key={r.id} value={r.id}>{r.owner}/{r.repo} ({r._count.pages} pages)</option>)}
                    </select>
                  </div>
                  {addRepoId && (
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Page</label>
                      <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={addPageId} onChange={(e) => setAddPageId(e.target.value)}>
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
                  <label className="text-sm font-medium mb-1.5 block">Page</label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={addPageId} onChange={(e) => setAddPageId(e.target.value)}>
                    <option value="">Select page...</option>
                    {customPages.map((p) => (
                      <option key={p.id} value={p.id} disabled={pagesInNav.has(p.id)}>
                        {p.title}{pagesInNav.has(p.id) ? " (already in menu)" : ""}
                      </option>
                    ))}
                  </select>
                  {customPages.length === 0 && <p className="text-xs text-muted-foreground mt-1">No custom pages yet. Create one in the Pages module.</p>}
                </div>
              )}

              {addType === "section" && (
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Section Name</label>
                  <Input value={addLabel} onChange={(e) => setAddLabel(e.target.value)} placeholder="e.g. Getting Started" />
                </div>
              )}

              {addType === "link" && (
                <>
                  <div><label className="text-sm font-medium mb-1.5 block">Label</label><Input value={addLabel} onChange={(e) => setAddLabel(e.target.value)} placeholder="Link text" /></div>
                  <div><label className="text-sm font-medium mb-1.5 block">URL</label><Input value={addUrl} onChange={(e) => setAddUrl(e.target.value)} placeholder="https://..." /></div>
                </>
              )}

              {addParentIndex !== null && (
                <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
                  Adding inside section: <strong>{navItems[addParentIndex]?.label}</strong>
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <Button variant="outline" size="sm" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button size="sm" onClick={handleAddItem}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />Add to Menu
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
