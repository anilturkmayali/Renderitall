"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  FileText,
  Trash2,
  Search,
  Loader2,
  ExternalLink,
  PenTool,
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
  updatedAt: string;
  space: { name: string; slug: string };
}

export default function PagesPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState("");

  useEffect(() => {
    fetch("/api/admin/pages").then((r) => r.json()).then((d) => { setPages(d); setLoading(false); });
  }, []);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    await fetch(`/api/admin/pages/${id}`, { method: "DELETE" });
    setPages(pages.filter((p) => p.id !== id));
  }

  // Only show custom (NATIVE) pages in this module
  const customOnly = pages.filter((p) => p.source === "NATIVE");
  const filtered = customOnly.filter((p) => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Custom Pages</h1>
          <p className="text-muted-foreground">
            Create and manage your own content pages. These can be added to any Site.
          </p>
        </div>
        <Link href="/admin/editor">
          <Button><Plus className="mr-2 h-4 w-4" />Create Page</Button>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search pages..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <FileText className="mx-auto h-10 w-10 mb-3 opacity-50" />
                <p className="font-medium">{pages.length === 0 ? "No pages yet" : "No pages match"}</p>
                {pages.length === 0 && (
                  <Link href="/admin/editor"><Button size="sm" className="mt-3"><PenTool className="mr-1.5 h-3.5 w-3.5" />Create your first page</Button></Link>
                )}
              </div>
            ) : (
              filtered.map((page) => (
                <div key={page.id} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/50 group">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Link href={`/admin/editor?page=${page.id}`} className="font-medium text-sm hover:text-primary block truncate">{page.title}</Link>
                    <span className="text-xs text-muted-foreground">/{page.slug} · {page.space.name}</span>
                  </div>
                  <Badge variant={page.status === "PUBLISHED" ? "success" : "secondary"} className="text-[10px]">{page.status.toLowerCase()}</Badge>
                  <span className="text-xs text-muted-foreground shrink-0">{new Date(page.updatedAt).toLocaleDateString()}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                    <a href={`/docs/${page.space.slug}/${page.slug}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="h-7 w-7"><ExternalLink className="h-3.5 w-3.5" /></Button>
                    </a>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(page.id, page.title)}><Trash2 className="h-3.5 w-3.5" /></Button>
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
