"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Save, ArrowLeft, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TiptapEditor } from "@/components/editor/tiptap-editor";

export default function EditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pageId = searchParams.get("page");

  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [content, setContent] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [status, setStatus] = React.useState<"draft" | "published">("draft");

  // Load page data if editing existing page
  React.useEffect(() => {
    if (pageId) {
      fetch(`/api/admin/pages/${pageId}`)
        .then((r) => r.json())
        .then((data) => {
          setTitle(data.title || "");
          setSlug(data.slug || "");
          setContent(data.content || "");
          setStatus(data.status?.toLowerCase() || "draft");
        })
        .catch(() => {});
    }
  }, [pageId]);

  // Auto-generate slug from title
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
    setSaving(true);
    try {
      const finalStatus = newStatus || status;
      const body = {
        title,
        slug,
        content,
        status: finalStatus.toUpperCase(),
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
        const data = await res.json();
        if (!pageId && data.id) {
          router.replace(`/admin/editor?page=${data.id}`);
        }
      }
    } catch {
      // Handle error
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/admin/pages")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">
              {pageId ? "Edit Page" : "New Page"}
            </h1>
            <Badge
              variant={status === "published" ? "success" : "secondary"}
              className="mt-1"
            >
              {status}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
          <Button onClick={() => handleSave()} disabled={saving || !title}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Meta fields */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Page title"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Slug</label>
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="page-slug"
          />
        </div>
      </div>

      {/* Editor */}
      <TiptapEditor content={content} onChange={setContent} />
    </div>
  );
}
