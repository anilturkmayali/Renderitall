"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Save,
  ArrowLeft,
  Eye,
  Loader2,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TiptapEditor } from "@/components/editor/tiptap-editor";

interface Space {
  id: string;
  name: string;
  slug: string;
}

export default function EditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pageId = searchParams.get("page");

  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [content, setContent] = React.useState("");
  const [spaceId, setSpaceId] = React.useState("");
  const [spaces, setSpaces] = React.useState<Space[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [status, setStatus] = React.useState<"draft" | "published">("draft");
  const [loading, setLoading] = React.useState(!!pageId);
  const [error, setError] = React.useState("");
  const [pageSource, setPageSource] = React.useState<"NATIVE" | "GITHUB">(
    "NATIVE"
  );
  const [spaceSlug, setSpaceSlug] = React.useState("");

  // Load spaces
  React.useEffect(() => {
    fetch("/api/admin/spaces")
      .then((r) => r.json())
      .then((data) => {
        setSpaces(data);
        if (!pageId && data.length > 0 && !spaceId) {
          setSpaceId(data[0].id);
          setSpaceSlug(data[0].slug);
        }
      })
      .catch(() => {});
  }, []);

  // Load page data if editing existing page
  React.useEffect(() => {
    if (pageId) {
      setLoading(true);
      fetch(`/api/admin/pages/${pageId}`)
        .then((r) => r.json())
        .then((data) => {
          setTitle(data.title || "");
          setSlug(data.slug || "");
          setContent(data.content || "");
          setStatus(data.status?.toLowerCase() || "draft");
          setSpaceId(data.spaceId || "");
          setPageSource(data.source || "NATIVE");
          setSpaceSlug(data.space?.slug || "");
        })
        .catch(() => setError("Failed to load page"))
        .finally(() => setLoading(false));
    }
  }, [pageId]);

  // Auto-generate slug from title (only for new pages)
  React.useEffect(() => {
    if (!pageId) {
      setSlug(
        title
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
      );
    }
  }, [title, pageId]);

  const handleSave = async (newStatus?: "draft" | "published") => {
    setError("");
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!spaceId) {
      setError("Please select a space");
      return;
    }

    setSaving(true);
    try {
      const finalStatus = newStatus || status;
      const body = {
        title,
        slug,
        content,
        status: finalStatus.toUpperCase(),
        spaceId,
      };

      const url = pageId ? `/api/admin/pages/${pageId}` : "/api/admin/pages";
      const method = pageId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setStatus(finalStatus);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        const data = await res.json();
        if (!pageId && data.id) {
          router.replace(`/admin/editor?page=${data.id}`);
        }
        // Update spaceSlug for preview link
        const space = spaces.find((s) => s.id === spaceId);
        if (space) setSpaceSlug(space.slug);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save");
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!pageId) return;
    if (!confirm("Delete this page? This cannot be undone.")) return;

    await fetch(`/api/admin/pages/${pageId}`, { method: "DELETE" });
    router.push("/admin/pages");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isGitHub = pageSource === "GITHUB";
  const previewUrl =
    spaceSlug && slug ? `/docs/${spaceSlug}/${slug}` : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/pages")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">
              {pageId ? "Edit Page" : "New Page"}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant={status === "published" ? "success" : "secondary"}
              >
                {status}
              </Badge>
              {isGitHub && (
                <Badge variant="outline" className="text-xs">
                  GitHub source — read-only
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {previewUrl && (
            <a href={previewUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                Preview
              </Button>
            </a>
          )}
          {pageId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete
            </Button>
          )}
          {!isGitHub && (
            <>
              {status === "draft" && (
                <Button
                  variant="outline"
                  onClick={() => handleSave("published")}
                  disabled={saving || !title}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Publish
                </Button>
              )}
              <Button
                onClick={() => handleSave()}
                disabled={saving || !title}
              >
                {saved ? (
                  "Saved!"
                ) : saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 p-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Meta fields */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Page title"
            disabled={isGitHub}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Slug</label>
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="page-slug"
            disabled={isGitHub}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Space</label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
            value={spaceId}
            onChange={(e) => {
              setSpaceId(e.target.value);
              const space = spaces.find((s) => s.id === e.target.value);
              if (space) setSpaceSlug(space.slug);
            }}
            disabled={!!pageId}
          >
            <option value="">Select space...</option>
            {spaces.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Editor */}
      {isGitHub ? (
        <div className="rounded-lg border bg-card">
          <div className="border-b px-4 py-2 text-sm text-muted-foreground bg-muted/30">
            This page is synced from GitHub and cannot be edited here. Edit the
            source file in the repository.
          </div>
          <div className="prose prose-slate dark:prose-invert max-w-none p-6">
            <div
              dangerouslySetInnerHTML={{
                __html: content || "<p>No content</p>",
              }}
            />
          </div>
        </div>
      ) : (
        <TiptapEditor content={content} onChange={setContent} />
      )}
    </div>
  );
}
