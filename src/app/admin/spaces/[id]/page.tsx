"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Loader2,
  Check,
  Palette,
  Globe,
  Eye,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLOR_PRESETS = [
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#10b981" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Orange", value: "#f97316" },
  { name: "Teal", value: "#0d9488" },
  { name: "Rose", value: "#f43f5e" },
];

export default function EditSpacePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    isPublic: true,
    primaryColor: "#3b82f6",
    accentColor: "#6366f1",
    defaultTheme: "SYSTEM",
    headerLayout: "default",
    seoTitle: "",
    seoDescription: "",
    customCss: "",
  });

  useEffect(() => {
    fetch(`/api/admin/spaces/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({
          name: data.name || "",
          slug: data.slug || "",
          description: data.description || "",
          isPublic: data.isPublic !== false,
          primaryColor: data.primaryColor || "#3b82f6",
          accentColor: data.accentColor || "#6366f1",
          defaultTheme: data.defaultTheme || "SYSTEM",
          headerLayout: data.headerLayout || "default",
          seoTitle: data.seoTitle || "",
          seoDescription: data.seoDescription || "",
          customCss: data.customCss || "",
        });
      })
      .catch(() => setError("Failed to load space"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    setError("");
    setSaving(true);
    const res = await fetch(`/api/admin/spaces/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      const data = await res.json();
      setError(data.error || "Failed to save");
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (
      !confirm(
        `Delete space "${form.name}" and ALL its pages? This cannot be undone.`
      )
    )
      return;
    await fetch(`/api/admin/spaces/${id}`, { method: "DELETE" });
    router.push("/admin/spaces");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/spaces")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Edit Space</h1>
            <p className="text-sm text-muted-foreground">{form.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/docs/${form.slug}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              Preview
            </Button>
          </a>
          <Button onClick={handleSave} disabled={saving}>
            {saved ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Saved!
              </>
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
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 p-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* General */}
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Name</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Slug</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">/docs/</span>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Description
            </label>
            <Input
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="A brief description"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium">Visibility:</label>
            <button
              onClick={() => setForm({ ...form, isPublic: true })}
              className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm ${
                form.isPublic
                  ? "border-primary bg-primary/10 text-primary"
                  : "hover:bg-muted"
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              Public
            </button>
            <button
              onClick={() => setForm({ ...form, isPublic: false })}
              className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm ${
                !form.isPublic
                  ? "border-primary bg-primary/10 text-primary"
                  : "hover:bg-muted"
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              Private
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Branding
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Primary Color
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() =>
                    setForm({ ...form, primaryColor: preset.value })
                  }
                  className={`h-8 w-8 rounded-full border-2 transition-transform ${
                    form.primaryColor === preset.value
                      ? "border-foreground scale-110"
                      : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: preset.value }}
                  title={preset.name}
                />
              ))}
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={form.primaryColor}
                onChange={(e) =>
                  setForm({ ...form, primaryColor: e.target.value })
                }
                className="h-9 w-12 rounded border cursor-pointer"
              />
              <Input
                value={form.primaryColor}
                onChange={(e) =>
                  setForm({ ...form, primaryColor: e.target.value })
                }
                className="w-32"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Template
            </label>
            <div className="flex gap-2">
              {["default", "modern", "minimal"].map((t) => (
                <button
                  key={t}
                  onClick={() => setForm({ ...form, headerLayout: t })}
                  className={`rounded-md border px-3 py-1.5 text-sm capitalize ${
                    form.headerLayout === t
                      ? "border-primary bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Default Theme
            </label>
            <div className="flex gap-2">
              {["LIGHT", "DARK", "SYSTEM"].map((t) => (
                <button
                  key={t}
                  onClick={() => setForm({ ...form, defaultTheme: t })}
                  className={`rounded-md border px-3 py-1.5 text-sm ${
                    form.defaultTheme === t
                      ? "border-primary bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  {t === "LIGHT" ? "Light" : t === "DARK" ? "Dark" : "System"}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEO */}
      <Card>
        <CardHeader>
          <CardTitle>SEO</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              SEO Title
            </label>
            <Input
              value={form.seoTitle}
              onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
              placeholder={form.name}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              SEO Description
            </label>
            <Input
              value={form.seoDescription}
              onChange={(e) =>
                setForm({ ...form, seoDescription: e.target.value })
              }
              placeholder="Description for search engines"
            />
          </div>
        </CardContent>
      </Card>

      {/* Custom Domain */}
      <DomainCard spaceId={id} />

      {/* Custom CSS */}
      <Card>
        <CardHeader>
          <CardTitle>Custom CSS</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="/* Custom styles */"
            value={form.customCss}
            onChange={(e) => setForm({ ...form, customCss: e.target.value })}
          />
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Delete this space</p>
              <p className="text-xs text-muted-foreground">
                Permanently delete this space and all its pages, repos, and
                navigation.
              </p>
            </div>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete Space
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Domain Management Card ──────────────────────────────────────────────────

function DomainCard({ spaceId }: { spaceId: string }) {
  const [domain, setDomain] = useState("");
  const [currentDomain, setCurrentDomain] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [instructions, setInstructions] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/admin/spaces/${spaceId}`)
      .then((r) => r.json())
      .then((data) => {
        setCurrentDomain(data.customDomain || null);
      })
      .catch(() => {});
  }, [spaceId]);

  async function handleAdd() {
    if (!domain.trim()) return;
    setError("");
    setAdding(true);

    const res = await fetch("/api/admin/domains", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spaceId, domain }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to add domain");
    } else {
      setCurrentDomain(domain.toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, ""));
      setInstructions(data.instructions);
      setDomain("");
    }
    setAdding(false);
  }

  async function handleRemove() {
    if (!currentDomain) return;
    if (!confirm(`Remove custom domain "${currentDomain}"?`)) return;

    await fetch("/api/admin/domains", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spaceId, domain: currentDomain }),
    });

    setCurrentDomain(null);
    setInstructions(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Custom Domain
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentDomain ? (
          <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
            <div>
              <p className="font-medium text-sm">{currentDomain}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Active custom domain
              </p>
            </div>
            <div className="flex gap-2">
              <a
                href={`https://${currentDomain}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm">
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  Visit
                </Button>
              </a>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              placeholder="docs.yourdomain.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleAdd} disabled={adding || !domain.trim()}>
              {adding ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Globe className="mr-2 h-4 w-4" />
              )}
              Add Domain
            </Button>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 p-2 rounded">
            {error}
          </p>
        )}

        {instructions && (
          <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/20 p-4 text-sm">
            <p className="font-medium mb-2">{instructions.message}</p>
            <div className="font-mono text-xs bg-background rounded border p-3 space-y-1">
              <div>
                <span className="text-muted-foreground">Type:</span>{" "}
                <span className="font-bold">{instructions.type}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Name:</span>{" "}
                <span className="font-bold">{instructions.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Value:</span>{" "}
                <span className="font-bold">{instructions.value}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              DNS changes can take up to 48 hours to propagate. SSL will be
              provisioned automatically once the domain is verified.
            </p>
          </div>
        )}

        {!currentDomain && !instructions && (
          <p className="text-xs text-muted-foreground">
            Add a custom domain to serve your documentation from your own URL.
            You&apos;ll need to configure a CNAME record with your DNS provider.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
