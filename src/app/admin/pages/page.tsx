"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  FileText,
  Github as GithubIcon,
  Trash2,
  Search,
  Filter,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface Page {
  id: string;
  title: string;
  slug: string;
  status: string;
  source: string;
  position: number;
  updatedAt: string;
  parentId: string | null;
  githubPath: string | null;
  space: { name: string; slug: string };
}

interface Space {
  id: string;
  name: string;
  slug: string;
}

export default function AdminPagesPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSpace, setFilterSpace] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSource, setFilterSource] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [pagesRes, spacesRes] = await Promise.all([
      fetch("/api/admin/pages"),
      fetch("/api/admin/spaces"),
    ]);
    if (pagesRes.ok) setPages(await pagesRes.json());
    if (spacesRes.ok) setSpaces(await spacesRes.json());
    setLoading(false);
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await fetch(`/api/admin/pages/${id}`, { method: "DELETE" });
    setPages(pages.filter((p) => p.id !== id));
  }

  const filtered = pages.filter((p) => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()))
      return false;
    if (filterSpace && p.space.name !== filterSpace) return false;
    if (filterStatus && p.status !== filterStatus) return false;
    if (filterSource && p.source !== filterSource) return false;
    return true;
  });

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
          <h1 className="text-2xl font-bold tracking-tight">Pages</h1>
          <p className="text-muted-foreground">
            {pages.length} pages across {spaces.length} spaces.
          </p>
        </div>
        <Link href="/admin/editor">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Page
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search pages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          value={filterSpace}
          onChange={(e) => setFilterSpace(e.target.value)}
        >
          <option value="">All spaces</option>
          {spaces.map((s) => (
            <option key={s.id} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <select
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
        >
          <option value="">All sources</option>
          <option value="GITHUB">GitHub</option>
          <option value="NATIVE">Native</option>
        </select>
        {(search || filterSpace || filterStatus || filterSource) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setFilterSpace("");
              setFilterStatus("");
              setFilterSource("");
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Pages Table */}
      <Card>
        <CardContent className="p-0">
          {/* Header row */}
          <div className="flex items-center gap-4 px-6 py-3 border-b bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <div className="flex-1">Title</div>
            <div className="w-24 text-center">Status</div>
            <div className="w-20 text-center">Source</div>
            <div className="w-32">Space</div>
            <div className="w-24 text-right">Updated</div>
            <div className="w-20" />
          </div>

          <div className="divide-y">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <FileText className="mx-auto h-10 w-10 mb-3 opacity-50" />
                <p className="font-medium">
                  {pages.length === 0
                    ? "No pages yet"
                    : "No pages match your filters"}
                </p>
                <p className="text-sm mt-1">
                  {pages.length === 0
                    ? "Connect a GitHub repository or create a native page."
                    : "Try adjusting your search or filters."}
                </p>
              </div>
            ) : (
              filtered.map((page) => (
                <div
                  key={page.id}
                  className="flex items-center gap-4 px-6 py-3 hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/admin/editor?page=${page.id}`}
                      className="font-medium hover:text-primary truncate block"
                    >
                      {page.title}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      /{page.slug}
                    </p>
                  </div>
                  <div className="w-24 text-center">
                    <Badge
                      variant={
                        page.status === "PUBLISHED"
                          ? "success"
                          : page.status === "DRAFT"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {page.status.toLowerCase()}
                    </Badge>
                  </div>
                  <div className="w-20 text-center">
                    {page.source === "GITHUB" ? (
                      <Badge variant="outline" className="gap-1">
                        <GithubIcon className="h-3 w-3" />
                        GH
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Native</Badge>
                    )}
                  </div>
                  <div className="w-32 text-sm text-muted-foreground truncate">
                    {page.space.name}
                  </div>
                  <div className="w-24 text-right text-xs text-muted-foreground">
                    {new Date(page.updatedAt).toLocaleDateString()}
                  </div>
                  <div className="w-20 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={`/docs/${page.space.slug}/${page.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(page.id, page.title)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
