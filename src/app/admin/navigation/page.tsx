"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  GripVertical,
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown,
  FileText,
  FolderOpen,
  ExternalLink,
  Loader2,
  Save,
  Undo2,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface NavItem {
  id?: string;
  label: string;
  type: "PAGE" | "SECTION" | "LINK";
  pageId: string | null;
  url: string | null;
  children: NavItem[];
  _expanded?: boolean;
  _editing?: boolean;
}

interface Space {
  id: string;
  name: string;
  slug: string;
}

interface PageOption {
  id: string;
  title: string;
  slug: string;
}

export default function AdminNavigationPage() {
  const searchParams = useSearchParams();
  const spaceIdParam = searchParams.get("space");

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState(spaceIdParam || "");
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [originalItems, setOriginalItems] = useState<NavItem[]>([]);
  const [pages, setPages] = useState<PageOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Add item modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addParentId, setAddParentId] = useState<string | null>(null);
  const [addForm, setAddForm] = useState({
    label: "",
    type: "PAGE" as "PAGE" | "SECTION" | "LINK",
    pageId: "",
    url: "",
  });

  useEffect(() => {
    fetchSpaces();
  }, []);

  useEffect(() => {
    if (selectedSpaceId) {
      fetchNav();
      fetchPages();
    }
  }, [selectedSpaceId]);

  async function fetchSpaces() {
    const res = await fetch("/api/admin/spaces");
    if (res.ok) {
      const data = await res.json();
      setSpaces(data);
      if (!selectedSpaceId && data.length > 0) {
        setSelectedSpaceId(data[0].id);
      }
    }
    setLoading(false);
  }

  async function fetchNav() {
    const res = await fetch(`/api/admin/nav/${selectedSpaceId}`);
    if (res.ok) {
      const data = await res.json();
      const items = mapNavItems(data);
      setNavItems(items);
      setOriginalItems(JSON.parse(JSON.stringify(items)));
      setHasChanges(false);
    }
  }

  async function fetchPages() {
    const res = await fetch(`/api/admin/pages?spaceId=${selectedSpaceId}`);
    if (res.ok) {
      const data = await res.json();
      setPages(data);
    }
  }

  function mapNavItems(items: any[]): NavItem[] {
    return items.map((item) => ({
      id: item.id,
      label: item.label,
      type: item.type,
      pageId: item.pageId,
      url: item.url,
      children: item.children ? mapNavItems(item.children) : [],
      _expanded: true,
    }));
  }

  function updateItems(
    items: NavItem[],
    updater: (items: NavItem[]) => NavItem[]
  ) {
    const newItems = updater([...items]);
    setNavItems(newItems);
    setHasChanges(true);
  }

  function addItem(parentItems: NavItem[] | null) {
    const newItem: NavItem = {
      label: addForm.label || "New Item",
      type: addForm.type,
      pageId: addForm.type === "PAGE" ? addForm.pageId || null : null,
      url: addForm.type === "LINK" ? addForm.url || null : null,
      children: [],
      _expanded: true,
    };

    if (!addParentId) {
      setNavItems([...navItems, newItem]);
    } else {
      setNavItems(addItemToParent(navItems, addParentId, newItem));
    }

    setHasChanges(true);
    setShowAddModal(false);
    setAddForm({ label: "", type: "PAGE", pageId: "", url: "" });
    setAddParentId(null);
  }

  function addItemToParent(
    items: NavItem[],
    parentId: string,
    newItem: NavItem
  ): NavItem[] {
    return items.map((item) => {
      if (item.id === parentId) {
        return { ...item, children: [...item.children, newItem], _expanded: true };
      }
      if (item.children.length > 0) {
        return {
          ...item,
          children: addItemToParent(item.children, parentId, newItem),
        };
      }
      return item;
    });
  }

  function removeItem(items: NavItem[], targetId: string): NavItem[] {
    return items
      .filter((item) => item.id !== targetId)
      .map((item) => ({
        ...item,
        children: removeItem(item.children, targetId),
      }));
  }

  function moveItem(
    items: NavItem[],
    index: number,
    direction: "up" | "down"
  ): NavItem[] {
    const newItems = [...items];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return items;
    [newItems[index], newItems[targetIndex]] = [
      newItems[targetIndex],
      newItems[index],
    ];
    return newItems;
  }

  function toggleExpand(items: NavItem[], targetId: string): NavItem[] {
    return items.map((item) => {
      if (item.id === targetId) {
        return { ...item, _expanded: !item._expanded };
      }
      return {
        ...item,
        children: toggleExpand(item.children, targetId),
      };
    });
  }

  function updateLabel(
    items: NavItem[],
    targetId: string,
    label: string
  ): NavItem[] {
    return items.map((item) => {
      if (item.id === targetId) {
        return { ...item, label };
      }
      return {
        ...item,
        children: updateLabel(item.children, targetId, label),
      };
    });
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/admin/nav/${selectedSpaceId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: stripInternalFields(navItems) }),
    });

    if (res.ok) {
      const data = await res.json();
      const items = mapNavItems(data);
      setNavItems(items);
      setOriginalItems(JSON.parse(JSON.stringify(items)));
      setHasChanges(false);
    }
    setSaving(false);
  }

  function stripInternalFields(items: NavItem[]): any[] {
    return items.map((item) => ({
      label: item.label,
      type: item.type,
      pageId: item.pageId,
      url: item.url,
      children: stripInternalFields(item.children),
    }));
  }

  function handleReset() {
    setNavItems(JSON.parse(JSON.stringify(originalItems)));
    setHasChanges(false);
  }

  const typeIcon = {
    PAGE: FileText,
    SECTION: FolderOpen,
    LINK: ExternalLink,
  };

  function renderNavItem(item: NavItem, index: number, parentItems: NavItem[]) {
    const Icon = typeIcon[item.type];

    return (
      <div key={item.id || `new-${index}`} className="group">
        <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 hover:bg-muted/50 transition-colors">
          <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab" />

          {item.children.length > 0 ? (
            <button
              onClick={() =>
                item.id && setNavItems(toggleExpand(navItems, item.id))
              }
              className="p-0.5"
            >
              {item._expanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>
          ) : (
            <div className="w-4" />
          )}

          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />

          {item._editing ? (
            <Input
              className="h-7 text-sm flex-1"
              value={item.label}
              onChange={(e) =>
                item.id &&
                setNavItems(updateLabel(navItems, item.id, e.target.value))
              }
              onBlur={() =>
                setNavItems(
                  navItems.map((i) =>
                    i.id === item.id ? { ...i, _editing: false } : i
                  )
                )
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setNavItems(
                    navItems.map((i) =>
                      i.id === item.id ? { ...i, _editing: false } : i
                    )
                  );
                }
              }}
              autoFocus
            />
          ) : (
            <span
              className="text-sm flex-1 cursor-pointer"
              onDoubleClick={() =>
                setNavItems(
                  navItems.map((i) =>
                    i.id === item.id ? { ...i, _editing: true } : i
                  )
                )
              }
            >
              {item.label}
            </span>
          )}

          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {item.type}
          </Badge>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                updateItems(navItems, (items) =>
                  moveItem(items, index, "up")
                );
              }}
              disabled={index === 0}
            >
              <span className="text-xs">^</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                updateItems(navItems, (items) =>
                  moveItem(items, index, "down")
                );
              }}
              disabled={index === parentItems.length - 1}
            >
              <span className="text-xs">v</span>
            </Button>
            {item.type === "SECTION" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                  setAddParentId(item.id || null);
                  setShowAddModal(true);
                }}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => {
                if (item.id) {
                  setNavItems(removeItem(navItems, item.id));
                  setHasChanges(true);
                }
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {item._expanded && item.children.length > 0 && (
          <div className="ml-6 mt-1 space-y-1 border-l-2 border-muted pl-3">
            {item.children.map((child, i) =>
              renderNavItem(child, i, item.children)
            )}
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Navigation</h1>
          <p className="text-muted-foreground">
            Customize the sidebar navigation for your documentation. Drag to
            reorder, double-click to rename.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <>
              <Button variant="outline" onClick={handleReset}>
                <Undo2 className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Navigation
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Space selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium">Space:</label>
        <select
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={selectedSpaceId}
          onChange={(e) => setSelectedSpaceId(e.target.value)}
        >
          {spaces.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-2xl mx-4">
            <h2 className="text-lg font-bold mb-4">Add Navigation Item</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Type</label>
                <div className="flex gap-2">
                  {(["PAGE", "SECTION", "LINK"] as const).map((type) => {
                    const Icon = typeIcon[type];
                    return (
                      <button
                        key={type}
                        onClick={() =>
                          setAddForm({ ...addForm, type })
                        }
                        className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                          addForm.type === type
                            ? "border-primary bg-primary/10 text-primary"
                            : "hover:bg-muted"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {type === "PAGE"
                          ? "Page"
                          : type === "SECTION"
                            ? "Section"
                            : "Link"}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Label</label>
                <Input
                  placeholder="Navigation label"
                  value={addForm.label}
                  onChange={(e) =>
                    setAddForm({ ...addForm, label: e.target.value })
                  }
                />
              </div>

              {addForm.type === "PAGE" && (
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Link to Page
                  </label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={addForm.pageId}
                    onChange={(e) =>
                      setAddForm({ ...addForm, pageId: e.target.value })
                    }
                  >
                    <option value="">Select a page...</option>
                    {pages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.slug})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {addForm.type === "LINK" && (
                <div>
                  <label className="text-sm font-medium mb-1.5 block">URL</label>
                  <Input
                    placeholder="https://..."
                    value={addForm.url}
                    onChange={(e) =>
                      setAddForm({ ...addForm, url: e.target.value })
                    }
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  setAddParentId(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={() => addItem(null)}>Add Item</Button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tree */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Navigation Tree</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAddParentId(null);
              setShowAddModal(true);
            }}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent>
          {navItems.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <FolderOpen className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">
                No navigation items yet. Add items manually or sync a repository
                with a SUMMARY.md file.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {navItems.map((item, i) => renderNavItem(item, i, navItems))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-sidebar p-4 max-w-xs">
            {navItems.map((item, i) => (
              <PreviewItem key={i} item={item} depth={0} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PreviewItem({ item, depth }: { item: NavItem; depth: number }) {
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
        ) : item.type === "LINK" ? (
          <Link2 className="h-3.5 w-3.5" />
        ) : (
          <FileText className="h-3.5 w-3.5 opacity-50" />
        )}
        <span className="truncate">{item.label}</span>
      </div>
      {item.children.map((child, i) => (
        <PreviewItem key={i} item={child} depth={depth + 1} />
      ))}
    </div>
  );
}
