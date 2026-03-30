"use client";

import { useState, useEffect } from "react";
import {
  Palette,
  Monitor,
  Layout,
  Save,
  Loader2,
  Eye,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Space {
  id: string;
  name: string;
  slug: string;
  primaryColor: string | null;
  accentColor: string | null;
  defaultTheme: string;
  headerLayout: string | null;
  customCss: string | null;
}

const TEMPLATES = [
  {
    id: "default",
    name: "Classic Docs",
    description: "Clean sidebar layout inspired by GitBook. Left sidebar, content, right TOC.",
    preview: "bg-white dark:bg-zinc-900",
    headerLayout: "default",
    features: ["Left sidebar navigation", "Right table of contents", "Breadcrumbs", "Previous/Next"],
  },
  {
    id: "modern",
    name: "Modern",
    description: "Full-width hero sections, floating sidebar. Inspired by Stripe and Vercel docs.",
    preview: "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-zinc-900 dark:to-zinc-800",
    headerLayout: "modern",
    features: ["Floating sidebar", "Hero banners per section", "Tab navigation", "Card-based sections"],
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Content-focused with minimal chrome. Centered content, collapsible sidebar.",
    preview: "bg-stone-50 dark:bg-stone-950",
    headerLayout: "minimal",
    features: ["Centered content", "Collapsible sidebar", "Typography focused", "Distraction-free reading"],
  },
];

const COLOR_PRESETS = [
  { name: "Blue", primary: "#3b82f6", accent: "#6366f1" },
  { name: "Green", primary: "#10b981", accent: "#14b8a6" },
  { name: "Purple", primary: "#8b5cf6", accent: "#a855f7" },
  { name: "Orange", primary: "#f97316", accent: "#ef4444" },
  { name: "Teal", primary: "#0d9488", accent: "#06b6d4" },
  { name: "Rose", primary: "#f43f5e", accent: "#ec4899" },
];

export default function AdminSettingsPage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState("");
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    primaryColor: "",
    accentColor: "",
    defaultTheme: "SYSTEM",
    headerLayout: "default",
    customCss: "",
  });

  useEffect(() => {
    fetchSpaces();
  }, []);

  useEffect(() => {
    if (selectedSpaceId) {
      fetchSpace();
    }
  }, [selectedSpaceId]);

  async function fetchSpaces() {
    const res = await fetch("/api/admin/spaces");
    if (res.ok) {
      const data = await res.json();
      setSpaces(data);
      if (data.length > 0) {
        setSelectedSpaceId(data[0].id);
      }
    }
    setLoading(false);
  }

  async function fetchSpace() {
    const res = await fetch(`/api/admin/spaces/${selectedSpaceId}`);
    if (res.ok) {
      const space = await res.json();
      setSelectedSpace(space);
      setForm({
        primaryColor: space.primaryColor || "#3b82f6",
        accentColor: space.accentColor || "#6366f1",
        defaultTheme: space.defaultTheme || "SYSTEM",
        headerLayout: space.headerLayout || "default",
        customCss: space.customCss || "",
      });
    }
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/admin/spaces/${selectedSpaceId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Appearance & Settings
          </h1>
          <p className="text-muted-foreground">
            Customize the look and feel of your documentation site.
          </p>
        </div>
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
              Save Changes
            </>
          )}
        </Button>
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

      {/* Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            Template
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() =>
                  setForm({ ...form, headerLayout: template.id })
                }
                className={`group relative rounded-xl border-2 p-4 text-left transition-all ${
                  form.headerLayout === template.id
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {form.headerLayout === template.id && (
                  <div className="absolute -top-2 -right-2 rounded-full bg-primary p-1">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={`h-24 rounded-lg mb-3 ${template.preview} border`}
                >
                  {/* Mini preview layout */}
                  <div className="h-full flex p-2 gap-1">
                    <div className="w-1/4 bg-current opacity-5 rounded" />
                    <div className="flex-1 flex flex-col gap-1">
                      <div className="h-2 bg-current opacity-10 rounded w-3/4" />
                      <div className="h-1.5 bg-current opacity-5 rounded w-full" />
                      <div className="h-1.5 bg-current opacity-5 rounded w-5/6" />
                      <div className="h-1.5 bg-current opacity-5 rounded w-full" />
                    </div>
                    <div className="w-1/6 bg-current opacity-5 rounded hidden sm:block" />
                  </div>
                </div>
                <h3 className="font-semibold text-sm">{template.name}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {template.description}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {template.features.slice(0, 2).map((f) => (
                    <Badge
                      key={f}
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {f}
                    </Badge>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Color Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Colors
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() =>
                  setForm({
                    ...form,
                    primaryColor: preset.primary,
                    accentColor: preset.accent,
                  })
                }
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all ${
                  form.primaryColor === preset.primary
                    ? "border-primary ring-1 ring-primary/20"
                    : "hover:border-primary/50"
                }`}
              >
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: preset.primary }}
                />
                <div
                  className="h-4 w-4 rounded-full -ml-2"
                  style={{ backgroundColor: preset.accent }}
                />
                <span>{preset.name}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Primary Color
              </label>
              <div className="flex gap-2">
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
                  placeholder="#3b82f6"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Accent Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={form.accentColor}
                  onChange={(e) =>
                    setForm({ ...form, accentColor: e.target.value })
                  }
                  className="h-9 w-12 rounded border cursor-pointer"
                />
                <Input
                  value={form.accentColor}
                  onChange={(e) =>
                    setForm({ ...form, accentColor: e.target.value })
                  }
                  placeholder="#6366f1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Default Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Default Theme
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {["LIGHT", "DARK", "SYSTEM"].map((theme) => (
              <button
                key={theme}
                onClick={() => setForm({ ...form, defaultTheme: theme })}
                className={`rounded-lg border px-4 py-2 text-sm transition-all ${
                  form.defaultTheme === theme
                    ? "border-primary bg-primary/10 text-primary"
                    : "hover:bg-muted"
                }`}
              >
                {theme === "LIGHT" ? "Light" : theme === "DARK" ? "Dark" : "System"}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom CSS */}
      <Card>
        <CardHeader>
          <CardTitle>Custom CSS</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder={`/* Custom styles for your docs */\n.prose h1 {\n  color: var(--primary);\n}`}
            value={form.customCss}
            onChange={(e) => setForm({ ...form, customCss: e.target.value })}
          />
        </CardContent>
      </Card>
    </div>
  );
}
