"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Eye,
  EyeOff,
  ChevronRight,
  ChevronDown,
  FileText,
  FolderOpen,
  Github,
  GripVertical,
  Search,
  Loader2,
  Save,
  Undo2,
  ExternalLink,
  Plus,
  Trash2,
  ArrowUpDown,
  Monitor,
  Smartphone,
  Tablet,
  BookOpen,
  RefreshCw,
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
}

interface PageItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  source: string;
  githubPath: string | null;
  githubRepoId: string | null;
  position: number;
  excerpt: string | null;
}

interface RepoInfo {
  id: string;
  owner: string;
  repo: string;
  branch: string;
  _count: { pages: number };
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

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SiteBuilderPage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState("");
  const [pages, setPages] = useState<PageItem[]>([]);
  const [repos, setRepos] = useState<RepoInfo[]>([]);
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [search, setSearch] = useState("");
  const [previewDevice, setPreviewDevice] = useState<
    "desktop" | "tablet" | "mobile"
  >("desktop");
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"content" | "navigation" | "preview">("content");

  useEffect(() => {
    fetchSpaces();
  }, []);

  useEffect(() => {
    if (selectedSpaceId) {
      fetchSpaceData();
    }
  }, [selectedSpaceId]);

  async function fetchSpaces() {
    const res = await fetch("/api/admin/spaces");
    if (res.ok) {
      const data = await res.json();
      setSpaces(data);
      if (data.length > 0) setSelectedSpaceId(data[0].id);
    }
    setLoading(false);
  }

  async function fetchSpaceData() {
    setLoading(true);
    const [pagesRes, reposRes, navRes] = await Promise.all([
      fetch(`/api/admin/pages?spaceId=${selectedSpaceId}`),
      fetch("/api/admin/repos"),
      fetch(`/api/admin/nav/${selectedSpaceId}`),
    ]);

    if (pagesRes.ok) setPages(await pagesRes.json());
    if (reposRes.ok) {
      const allRepos = await reposRes.json();
      setRepos(
        allRepos.filter((r: any) => r.spaceId === selectedSpaceId || r.space?.id === selectedSpaceId)
      );
    }
    if (navRes.ok) {
      const data = await navRes.json();
      setNavItems(
        data.map((item: any) => mapNavItem(item))
      );
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

  // Filter pages by search
  const filteredPages = useMemo(() => {
    if (!search) return pages;
    const q = search.toLowerCase();
    return pages.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q)
    );
  }, [pages, search]);

  // Group pages by repo
  const pagesByRepo = useMemo(() => {
    const groups = new Map<string, PageItem[]>();
    groups.set("__native__", []);

    for (const page of filteredPages) {
      if (page.source === "GITHUB" && page.githubRepoId) {
        const existing = groups.get(page.githubRepoId) || [];
        existing.push(page);
        groups.set(page.githubRepoId, existing);
      } else {
        groups.get("__native__")!.push(page);
      }
    }

    return groups;
  }, [filteredPages]);

  // Check if a page is in the navigation
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
    setNavItems((prev) => [
      ...prev,
      {
        label: page.title,
        type: "PAGE" as const,
        pageId: page.id,
        url: null,
        children: [],
        _visible: true,
        _expanded: false,
      },
    ]);
    setHasChanges(true);
  }

  function addSectionToNav(label: string) {
    setNavItems((prev) => [
      ...prev,
      {
        label,
        type: "SECTION" as const,
        pageId: null,
        url: null,
        children: [],
        _visible: true,
        _expanded: true,
      },
    ]);
    setHasChanges(true);
  }

  function removeFromNav(index: number) {
    setNavItems((prev) => prev.filter((_, i) => i !== index));
    setHasChanges(true);
  }

  function moveNavItem(index: number, direction: "up" | "down") {
    setNavItems((prev) => {
      const items = [...prev];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= items.length) return prev;
      [items[index], items[target]] = [items[target], items[index]];
      return items;
    });
    setHasChanges(true);
  }

  function addAllRepoPages(repoId: string) {
    const repoPages = pages.filter(
      (p) => p.githubRepoId === repoId && !pagesInNav.has(p.id)
    );
    const repo = repos.find((r) => r.id === repoId);
    const sectionLabel = repo ? `${repo.owner}/${repo.repo}` : "Imported Pages";

    const newSection: NavItem = {
      label: sectionLabel,
      type: "SECTION",
      pageId: null,
      url: null,
      _visible: true,
      _expanded: true,
      children: repoPages.map((p) => ({
        label: p.title,
        type: "PAGE" as const,
        pageId: p.id,
        url: null,
        children: [],
        _visible: true,
        _expanded: false,
      })),
    };

    setNavItems((prev) => [...prev, newSection]);
    setHasChanges(true);
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/admin/nav/${selectedSpaceId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: navItems
          .filter((i) => i._visible)
          .map(stripInternal),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setNavItems(data.map(mapNavItem));
      setHasChanges(false);
    }
    setSaving(false);
  }

  function stripInternal(item: NavItem): any {
    return {
      label: item.label,
      type: item.type,
      pageId: item.pageId,
      url: item.url,
      children: item.children.filter((i) => i._visible).map(stripInternal),
    };
  }

  const selectedSpace = spaces.find((s) => s.id === selectedSpaceId);
  const previewUrl = selectedSpace
    ? `/docs/${selectedSpace.slug}`
    : null;

  if (loading && spaces.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Site Builder</h1>
          <p className="text-muted-foreground">
            Import content from repos, build your navigation, and preview the
            final site.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <Button
              variant="outline"
              onClick={() => fetchSpaceData()}
            >
              <Undo2 className="mr-2 h-4 w-4" />
              Reset
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save & Publish
          </Button>
        </div>
      </div>

      {/* Space selector */}
      <div className="flex items-center gap-3">
        <select
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm font-medium"
          value={selectedSpaceId}
          onChange={(e) => setSelectedSpaceId(e.target.value)}
        >
          {spaces.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {previewUrl && (
          <a href={previewUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              View Live Site
            </Button>
          </a>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        {(
          [
            { id: "content", label: "Content", icon: FileText },
            { id: "navigation", label: "Navigation Builder", icon: ArrowUpDown },
            { id: "preview", label: "Preview", icon: Eye },
          ] as const
        ).map((tab) => (
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

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* ─── Content Tab ───────────────────────────────────────────── */}
          {activeTab === "content" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search pages..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Badge variant="secondary">
                  {pages.length} pages from {repos.length} repos
                </Badge>
              </div>

              {/* Connected repos */}
              {repos.map((repo) => {
                const repoPages = pagesByRepo.get(repo.id) || [];
                if (repoPages.length === 0 && search) return null;

                return (
                  <Card key={repo.id}>
                    <CardHeader className="flex flex-row items-center justify-between py-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Github className="h-4 w-4" />
                        {repo.owner}/{repo.repo}
                        <Badge variant="outline" className="text-xs">
                          {repoPages.length} pages
                        </Badge>
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addAllRepoPages(repo.id)}
                      >
                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                        Add All to Nav
                      </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y max-h-[300px] overflow-y-auto">
                        {repoPages.map((page) => {
                          const inNav = pagesInNav.has(page.id);
                          return (
                            <div
                              key={page.id}
                              className={`flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors ${
                                selectedPageId === page.id
                                  ? "bg-primary/5"
                                  : ""
                              }`}
                            >
                              <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <div
                                className="flex-1 min-w-0 cursor-pointer"
                                onClick={() =>
                                  setSelectedPageId(
                                    selectedPageId === page.id
                                      ? null
                                      : page.id
                                  )
                                }
                              >
                                <span className="font-medium truncate block">
                                  {page.title}
                                </span>
                                <span className="text-xs text-muted-foreground truncate block">
                                  /{page.slug}
                                </span>
                              </div>
                              {inNav ? (
                                <Badge
                                  variant="success"
                                  className="text-[10px] shrink-0"
                                >
                                  In Nav
                                </Badge>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="shrink-0 h-7 text-xs"
                                  onClick={() => addPageToNav(page)}
                                >
                                  <Plus className="mr-1 h-3 w-3" />
                                  Add
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Native pages */}
              {(pagesByRepo.get("__native__") || []).length > 0 && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Native Pages
                      <Badge variant="outline" className="text-xs">
                        {(pagesByRepo.get("__native__") || []).length} pages
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {(pagesByRepo.get("__native__") || []).map((page) => {
                        const inNav = pagesInNav.has(page.id);
                        return (
                          <div
                            key={page.id}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/50"
                          >
                            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="flex-1 truncate font-medium">
                              {page.title}
                            </span>
                            {inNav ? (
                              <Badge variant="success" className="text-[10px]">
                                In Nav
                              </Badge>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => addPageToNav(page)}
                              >
                                <Plus className="mr-1 h-3 w-3" />
                                Add
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ─── Navigation Builder Tab ────────────────────────────────── */}
          {activeTab === "navigation" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const label = prompt("Section name:");
                    if (label) addSectionToNav(label);
                  }}
                >
                  <FolderOpen className="mr-1.5 h-3.5 w-3.5" />
                  Add Section
                </Button>
                <p className="text-xs text-muted-foreground">
                  Drag to reorder. Click the eye icon to hide/show items. Add
                  pages from the Content tab.
                </p>
              </div>

              <Card>
                <CardContent className="p-4">
                  {navItems.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <ArrowUpDown className="mx-auto h-8 w-8 mb-2 opacity-50" />
                      <p className="text-sm font-medium">
                        No navigation items yet
                      </p>
                      <p className="text-xs mt-1">
                        Go to the Content tab and add pages to build your
                        navigation.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {navItems.map((item, i) => (
                        <NavItemRow
                          key={item.id || `new-${i}`}
                          item={item}
                          index={i}
                          total={navItems.length}
                          onMove={(dir) => moveNavItem(i, dir)}
                          onRemove={() => removeFromNav(i)}
                          onToggleVisibility={() => {
                            const updated = [...navItems];
                            updated[i] = {
                              ...updated[i],
                              _visible: !updated[i]._visible,
                            };
                            setNavItems(updated);
                            setHasChanges(true);
                          }}
                          onToggleExpand={() => {
                            const updated = [...navItems];
                            updated[i] = {
                              ...updated[i],
                              _expanded: !updated[i]._expanded,
                            };
                            setNavItems(updated);
                          }}
                          onUpdateLabel={(label) => {
                            const updated = [...navItems];
                            updated[i] = { ...updated[i], label };
                            setNavItems(updated);
                            setHasChanges(true);
                          }}
                          onAddChild={(child) => {
                            const updated = [...navItems];
                            updated[i] = {
                              ...updated[i],
                              children: [...updated[i].children, child],
                            };
                            setNavItems(updated);
                            setHasChanges(true);
                          }}
                          onRemoveChild={(childIndex) => {
                            const updated = [...navItems];
                            updated[i] = {
                              ...updated[i],
                              children: updated[i].children.filter(
                                (_, ci) => ci !== childIndex
                              ),
                            };
                            setNavItems(updated);
                            setHasChanges(true);
                          }}
                          onMoveChild={(childIndex, dir) => {
                            const updated = [...navItems];
                            const children = [...updated[i].children];
                            const target =
                              dir === "up"
                                ? childIndex - 1
                                : childIndex + 1;
                            if (target < 0 || target >= children.length) return;
                            [children[childIndex], children[target]] = [
                              children[target],
                              children[childIndex],
                            ];
                            updated[i] = { ...updated[i], children };
                            setNavItems(updated);
                            setHasChanges(true);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Live sidebar preview */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Sidebar Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border bg-sidebar p-4 max-w-xs">
                    {navItems
                      .filter((i) => i._visible)
                      .map((item, i) => (
                        <SidebarPreviewItem key={i} item={item} depth={0} />
                      ))}
                    {navItems.filter((i) => i._visible).length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        Empty navigation
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ─── Preview Tab ───────────────────────────────────────────── */}
          {activeTab === "preview" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {(
                  [
                    { id: "desktop", icon: Monitor, label: "Desktop" },
                    { id: "tablet", icon: Tablet, label: "Tablet" },
                    { id: "mobile", icon: Smartphone, label: "Mobile" },
                  ] as const
                ).map((device) => (
                  <Button
                    key={device.id}
                    variant={
                      previewDevice === device.id ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setPreviewDevice(device.id)}
                  >
                    <device.icon className="mr-1.5 h-3.5 w-3.5" />
                    {device.label}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={() => {
                    const iframe = document.getElementById(
                      "preview-frame"
                    ) as HTMLIFrameElement;
                    if (iframe) iframe.src = iframe.src;
                  }}
                >
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  Refresh
                </Button>
              </div>

              <div className="flex justify-center">
                <div
                  className={`border rounded-xl overflow-hidden shadow-lg bg-white transition-all ${
                    previewDevice === "desktop"
                      ? "w-full h-[700px]"
                      : previewDevice === "tablet"
                        ? "w-[768px] h-[700px]"
                        : "w-[375px] h-[700px]"
                  }`}
                >
                  {previewUrl ? (
                    <iframe
                      id="preview-frame"
                      src={previewUrl}
                      className="w-full h-full border-0"
                      title="Site Preview"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <BookOpen className="mx-auto h-8 w-8 mb-2 opacity-50" />
                        <p className="text-sm">
                          Select a space to preview
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Nav Item Row ────────────────────────────────────────────────────────────

function NavItemRow({
  item,
  index,
  total,
  onMove,
  onRemove,
  onToggleVisibility,
  onToggleExpand,
  onUpdateLabel,
  onAddChild,
  onRemoveChild,
  onMoveChild,
}: {
  item: NavItem;
  index: number;
  total: number;
  onMove: (dir: "up" | "down") => void;
  onRemove: () => void;
  onToggleVisibility: () => void;
  onToggleExpand: () => void;
  onUpdateLabel: (label: string) => void;
  onAddChild: (child: NavItem) => void;
  onRemoveChild: (index: number) => void;
  onMoveChild: (index: number, dir: "up" | "down") => void;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className={!item._visible ? "opacity-40" : ""}>
      <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 group hover:bg-muted/50 transition-colors">
        <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab shrink-0" />

        {item.type === "SECTION" && item.children.length > 0 && (
          <button onClick={onToggleExpand} className="p-0.5 shrink-0">
            {item._expanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        )}

        {item.type === "SECTION" ? (
          <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
        )}

        {editing ? (
          <Input
            className="h-7 text-sm flex-1"
            value={item.label}
            onChange={(e) => onUpdateLabel(e.target.value)}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => e.key === "Enter" && setEditing(false)}
            autoFocus
          />
        ) : (
          <span
            className="text-sm flex-1 cursor-pointer truncate"
            onDoubleClick={() => setEditing(true)}
          >
            {item.label}
          </span>
        )}

        <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
          {item.type}
        </Badge>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onMove("up")}
            disabled={index === 0}
            title="Move up"
          >
            <span className="text-xs">^</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onMove("down")}
            disabled={index === total - 1}
            title="Move down"
          >
            <span className="text-xs">v</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onToggleVisibility}
            title={item._visible ? "Hide" : "Show"}
          >
            {item._visible ? (
              <Eye className="h-3.5 w-3.5" />
            ) : (
              <EyeOff className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
            title="Remove"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Children */}
      {item._expanded && item.children.length > 0 && (
        <div className="ml-6 mt-1 space-y-1 border-l-2 border-muted pl-3">
          {item.children.map((child, ci) => (
            <div
              key={child.id || `child-${ci}`}
              className={`flex items-center gap-2 rounded-md border bg-card px-3 py-1.5 group hover:bg-muted/50 text-sm ${
                !child._visible ? "opacity-40" : ""
              }`}
            >
              <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="flex-1 truncate">{child.label}</span>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onMoveChild(ci, "up")}
                  disabled={ci === 0}
                >
                  <span className="text-[10px]">^</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onMoveChild(ci, "down")}
                  disabled={ci === item.children.length - 1}
                >
                  <span className="text-[10px]">v</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={() => onRemoveChild(ci)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sidebar Preview ─────────────────────────────────────────────────────────

function SidebarPreviewItem({
  item,
  depth,
}: {
  item: NavItem;
  depth: number;
}) {
  if (!item._visible) return null;

  return (
    <div>
      <div
        className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
          item.type === "SECTION"
            ? "font-semibold text-foreground mt-3 first:mt-0"
            : "text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {item.type === "SECTION" ? (
          <FolderOpen className="h-3.5 w-3.5" />
        ) : (
          <FileText className="h-3.5 w-3.5 opacity-50" />
        )}
        <span className="truncate">{item.label}</span>
      </div>
      {item.children
        .filter((c) => c._visible)
        .map((child, i) => (
          <SidebarPreviewItem key={i} item={child} depth={depth + 1} />
        ))}
    </div>
  );
}
