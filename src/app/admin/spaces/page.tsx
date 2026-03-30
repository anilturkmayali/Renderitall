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
  Settings,
  Trash2,
  Loader2,
  ExternalLink,
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
  createdAt: string;
  _count: { pages: number; githubRepos: number };
}

export default function AdminSpacesPage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({ name: "", slug: "", description: "" });

  useEffect(() => {
    fetchSpaces();
  }, []);

  async function fetchSpaces() {
    const res = await fetch("/api/admin/spaces");
    if (res.ok) setSpaces(await res.json());
    setLoading(false);
  }

  function autoSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }

  async function handleCreate() {
    setFormError("");
    if (!form.name.trim()) {
      setFormError("Name is required");
      return;
    }
    const slug = form.slug || autoSlug(form.name);
    setCreating(true);

    const res = await fetch("/api/admin/spaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        slug,
        description: form.description || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setFormError(data.error || "Failed to create space");
      setCreating(false);
      return;
    }

    setShowModal(false);
    setForm({ name: "", slug: "", description: "" });
    setCreating(false);
    fetchSpaces();
  }

  async function handleDelete(id: string, name: string) {
    if (
      !confirm(
        `Delete space "${name}" and all its pages? This cannot be undone.`
      )
    )
      return;
    await fetch(`/api/admin/spaces/${id}`, { method: "DELETE" });
    fetchSpaces();
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
          <h1 className="text-2xl font-bold tracking-tight">Spaces</h1>
          <p className="text-muted-foreground">
            Each space is an independent documentation site with its own repos,
            pages, and navigation.
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Space
        </Button>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl border bg-background p-6 shadow-2xl mx-4">
            <h2 className="text-xl font-bold mb-1">Create Space</h2>
            <p className="text-sm text-muted-foreground mb-6">
              A space is a self-contained documentation site. You can connect
              GitHub repos and add native pages to it.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Name</label>
                <Input
                  placeholder="e.g. IDS Knowledge Base"
                  value={form.name}
                  onChange={(e) => {
                    setForm({
                      ...form,
                      name: e.target.value,
                      slug: autoSlug(e.target.value),
                    });
                  }}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Slug</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">/docs/</span>
                  <Input
                    placeholder="knowledge-base"
                    value={form.slug}
                    onChange={(e) =>
                      setForm({ ...form, slug: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Description (optional)
                </label>
                <Input
                  placeholder="A brief description of this documentation space"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>

              {formError && (
                <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 p-2 rounded">
                  {formError}
                </p>
              )}
            </div>

            <div className="flex gap-3 mt-6 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowModal(false);
                  setFormError("");
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Space"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Spaces list */}
      {spaces.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Layers className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <h3 className="font-semibold text-lg mb-1">No spaces yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Create your first documentation space. Then connect GitHub repos
              or create native pages.
            </p>
            <Button className="mt-6" onClick={() => setShowModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create your first space
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {spaces.map((space) => (
            <Card key={space.id} className="group relative hover:border-primary/30 transition-colors">
              <CardContent className="p-6">
                <Link href={`/admin/spaces/${space.id}`} className="absolute inset-0 z-0" />
                <div className="flex items-start justify-between mb-3 relative z-10">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor: space.primaryColor
                        ? `${space.primaryColor}20`
                        : undefined,
                    }}
                  >
                    <Layers
                      className="h-5 w-5"
                      style={{
                        color: space.primaryColor || undefined,
                      }}
                    />
                  </div>
                  <Badge variant={space.isPublic ? "secondary" : "outline"}>
                    {space.isPublic ? (
                      <Globe className="mr-1 h-3 w-3" />
                    ) : (
                      <Lock className="mr-1 h-3 w-3" />
                    )}
                    {space.isPublic ? "Public" : "Private"}
                  </Badge>
                </div>

                <h3 className="font-semibold text-lg mb-1">{space.name}</h3>
                {space.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {space.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    {space._count.pages} pages
                  </span>
                  <span className="flex items-center gap-1">
                    <Github className="h-3.5 w-3.5" />
                    {space._count.githubRepos} repos
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/docs/${space.slug}`} target="_blank">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="mr-1 h-3.5 w-3.5" />
                      View
                    </Button>
                  </Link>
                  <Link href={`/admin/navigation?space=${space.id}`}>
                    <Button variant="outline" size="sm">
                      <Settings className="mr-1 h-3.5 w-3.5" />
                      Navigation
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(space.id, space.name)}
                    className="ml-auto text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
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
