"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Layers,
  Plus,
  Globe,
  Lock,
  FileText,
  Github,
  Trash2,
  Loader2,
  ExternalLink,
  Settings,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface Space {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isPublic: boolean;
  primaryColor: string | null;
  headerLayout: string | null;
  createdAt: string;
  _count: { pages: number; githubRepos: number };
}

const TEMPLATES = [
  { id: "default", name: "Classic", description: "Clean sidebar layout" },
  { id: "modern", name: "Modern", description: "Full-width hero sections" },
  { id: "minimal", name: "Minimal", description: "Content-focused, centered" },
];

export default function SitesPage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    headerLayout: "default",
  });

  useEffect(() => {
    fetchSpaces();
  }, []);

  async function fetchSpaces() {
    const res = await fetch("/api/admin/spaces");
    if (res.ok) setSpaces(await res.json());
    setLoading(false);
  }

  function autoSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
  }

  async function handleCreate() {
    setFormError("");
    if (!form.name.trim()) { setFormError("Name is required"); return; }
    setCreating(true);

    const res = await fetch("/api/admin/spaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        slug: form.slug || autoSlug(form.name),
        description: form.description || null,
        headerLayout: form.headerLayout,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setFormError(data.error || "Failed to create site");
      setCreating(false);
      return;
    }

    setShowModal(false);
    setForm({ name: "", slug: "", description: "", headerLayout: "default" });
    setCreating(false);
    fetchSpaces();
  }

  async function handleDelete(e: React.MouseEvent, id: string, name: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete site "${name}" and all its pages? This cannot be undone.`)) return;
    await fetch(`/api/admin/spaces/${id}`, { method: "DELETE" });
    fetchSpaces();
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sites</h1>
          <p className="text-muted-foreground">Each site is an independent documentation website with its own content and design.</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="mr-2 h-4 w-4" />Create Site
        </Button>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl border bg-background p-6 shadow-2xl mx-4">
            <h2 className="text-xl font-bold mb-1">Create Site</h2>
            <p className="text-sm text-muted-foreground mb-6">A site is a documentation website. Connect repos and add pages to it.</p>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Site Name</label>
                <Input placeholder="e.g. IDS Knowledge Base" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: autoSlug(e.target.value) })} autoFocus />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">URL Slug</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">/docs/</span>
                  <Input placeholder="knowledge-base" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Description (optional)</label>
                <Input placeholder="Brief description of this documentation" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>

              {/* Template chooser */}
              <div>
                <label className="text-sm font-medium mb-2 block">Template</label>
                <div className="grid grid-cols-3 gap-3">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setForm({ ...form, headerLayout: t.id })}
                      className={`rounded-xl border-2 p-3 text-left transition-all ${
                        form.headerLayout === t.id
                          ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      {/* Mini preview */}
                      <div className="h-14 rounded-md bg-muted/50 mb-2 flex p-1.5 gap-1">
                        {t.id === "default" && (
                          <>
                            <div className="w-1/4 bg-primary/10 rounded" />
                            <div className="flex-1 flex flex-col gap-0.5">
                              <div className="h-1.5 bg-primary/10 rounded w-3/4" />
                              <div className="h-1 bg-muted rounded w-full" />
                              <div className="h-1 bg-muted rounded w-5/6" />
                            </div>
                            <div className="w-1/6 bg-muted rounded" />
                          </>
                        )}
                        {t.id === "modern" && (
                          <div className="flex-1 flex flex-col gap-0.5">
                            <div className="h-4 bg-primary/10 rounded w-full" />
                            <div className="h-1 bg-muted rounded w-3/4 mx-auto" />
                            <div className="h-1 bg-muted rounded w-5/6 mx-auto" />
                          </div>
                        )}
                        {t.id === "minimal" && (
                          <div className="flex-1 flex flex-col items-center gap-0.5 pt-1">
                            <div className="h-1.5 bg-primary/10 rounded w-1/2" />
                            <div className="h-1 bg-muted rounded w-2/3" />
                            <div className="h-1 bg-muted rounded w-1/2" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-semibold">{t.name}</p>
                      <p className="text-[10px] text-muted-foreground">{t.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {formError && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 p-2 rounded">{formError}</p>}
            </div>

            <div className="flex gap-3 mt-6 justify-end">
              <Button variant="outline" onClick={() => { setShowModal(false); setFormError(""); }}>Cancel</Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : "Create Site"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sites list */}
      {spaces.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Layers className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <h3 className="font-semibold text-lg mb-1">No sites yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">Create your first documentation site, then connect repos and start designing.</p>
            <Button className="mt-6" onClick={() => setShowModal(true)}>
              <Plus className="mr-2 h-4 w-4" />Create your first site
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {spaces.map((space) => (
            <Card key={space.id} className="group relative overflow-hidden hover:border-primary/30 transition-colors">
              {/* Color strip at top */}
              <div className="h-1" style={{ backgroundColor: space.primaryColor || "#3b82f6" }} />
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{space.name}</h3>
                    {space.headerLayout && (
                      <Badge variant="outline" className="text-[10px]">
                        {TEMPLATES.find((t) => t.id === space.headerLayout)?.name || space.headerLayout}
                      </Badge>
                    )}
                  </div>
                  <Badge variant={space.isPublic ? "secondary" : "outline"} className="text-[10px]">
                    {space.isPublic ? <Globe className="mr-1 h-3 w-3" /> : <Lock className="mr-1 h-3 w-3" />}
                    {space.isPublic ? "Public" : "Private"}
                  </Badge>
                </div>

                {space.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{space.description}</p>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                  <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{space._count.pages} pages</span>
                  <span className="flex items-center gap-1"><Github className="h-3 w-3" />{space._count.githubRepos} repos</span>
                </div>

                <div className="flex items-center gap-2">
                  <a href={`/docs/${space.slug}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm"><ExternalLink className="mr-1 h-3 w-3" />View</Button>
                  </a>
                  <Link href={`/admin/spaces/${space.id}`}>
                    <Button variant="outline" size="sm"><Settings className="mr-1 h-3 w-3" />Manage</Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={(e) => handleDelete(e, space.id, space.name)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
