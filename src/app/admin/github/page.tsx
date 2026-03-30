"use client";

import { useState, useEffect, useRef } from "react";
import {
  Github,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  ExternalLink,
  Trash2,
  Loader2,
  FolderGit2,
  GitBranch,
  FolderOpen,
  Search,
  Lock,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface ConnectedRepo {
  id: string;
  owner: string;
  repo: string;
  branch: string;
  docsPath: string;
  lastSyncAt: string | null;
  lastSyncStatus: "IDLE" | "SYNCING" | "SUCCESS" | "ERROR";
  lastSyncError: string | null;
  pageCount: number;
  space: { name: string; slug: string };
  _count: { pages: number };
}

interface GitHubRepoOption {
  id: number;
  fullName: string;
  owner: string;
  name: string;
  description: string | null;
  defaultBranch: string;
  isPrivate: boolean;
  language: string | null;
  stargazersCount: number;
}

interface Space {
  id: string;
  name: string;
  slug: string;
}

const statusConfig = {
  IDLE: { icon: Clock, color: "secondary" as const, label: "Idle" },
  SYNCING: { icon: RefreshCw, color: "warning" as const, label: "Syncing" },
  SUCCESS: { icon: CheckCircle2, color: "success" as const, label: "Synced" },
  ERROR: { icon: XCircle, color: "destructive" as const, label: "Error" },
};

export default function AdminGitHubPage() {
  const [repos, setRepos] = useState<ConnectedRepo[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [syncing, setSyncing] = useState<Set<string>>(new Set());

  // Repo picker state
  const [ghRepos, setGhRepos] = useState<GitHubRepoOption[]>([]);
  const [ghSearch, setGhSearch] = useState("");
  const [ghLoading, setGhLoading] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepoOption | null>(
    null
  );
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Form state
  const [form, setForm] = useState({
    branch: "",
    docsPath: "/",
    spaceId: "",
  });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchRepos();
    fetchSpaces();
  }, []);

  // Fetch GitHub repos when modal opens
  useEffect(() => {
    if (showModal) {
      fetchGitHubRepos("");
    }
  }, [showModal]);

  // Debounced search
  useEffect(() => {
    if (!showModal) return;
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      fetchGitHubRepos(ghSearch);
    }, 300);
    return () => clearTimeout(searchTimer.current);
  }, [ghSearch]);

  async function fetchRepos() {
    const res = await fetch("/api/admin/repos");
    if (res.ok) setRepos(await res.json());
    setLoading(false);
  }

  async function fetchSpaces() {
    const res = await fetch("/api/admin/spaces");
    if (res.ok) setSpaces(await res.json());
  }

  async function fetchGitHubRepos(query: string) {
    setGhLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    const res = await fetch(`/api/admin/github/repos?${params}`);
    if (res.ok) {
      setGhRepos(await res.json());
    }
    setGhLoading(false);
  }

  function selectRepo(repo: GitHubRepoOption) {
    setSelectedRepo(repo);
    setForm((prev) => ({
      ...prev,
      branch: repo.defaultBranch,
    }));
  }

  async function handleConnect() {
    setFormError("");
    if (!selectedRepo) {
      setFormError("Please select a repository.");
      return;
    }
    if (!form.spaceId) {
      setFormError("Please select a space.");
      return;
    }

    setCreating(true);
    const res = await fetch("/api/admin/repos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        owner: selectedRepo.owner,
        repo: selectedRepo.name,
        branch: form.branch || selectedRepo.defaultBranch,
        docsPath: form.docsPath,
        spaceId: form.spaceId,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setFormError(data.error || "Failed to connect repository");
      setCreating(false);
      return;
    }

    setShowModal(false);
    setSelectedRepo(null);
    setGhSearch("");
    setForm({ branch: "", docsPath: "/", spaceId: "" });
    setCreating(false);
    fetchRepos();
  }

  async function handleSync(repoId: string) {
    setSyncing((prev) => new Set([...prev, repoId]));
    await fetch(`/api/admin/repos/${repoId}/sync`, { method: "POST" });
    setSyncing((prev) => {
      const next = new Set(prev);
      next.delete(repoId);
      return next;
    });
    fetchRepos();
  }

  async function handleDelete(repoId: string) {
    if (!confirm("Delete this repository connection and all its synced pages?"))
      return;
    await fetch(`/api/admin/repos/${repoId}`, { method: "DELETE" });
    fetchRepos();
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
          <h1 className="text-2xl font-bold tracking-tight">
            GitHub Repositories
          </h1>
          <p className="text-muted-foreground">
            Connect GitHub repositories to import documentation automatically.
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Connect Repository
        </Button>
      </div>

      {/* Connection Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-xl border bg-background p-6 shadow-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            <h2 className="text-xl font-bold mb-1">Connect Repository</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Select a repository from your GitHub account to import its
              documentation.
            </p>

            <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
              {/* Step 1: Pick a repo */}
              {!selectedRepo ? (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search your repositories..."
                      value={ghSearch}
                      onChange={(e) => setGhSearch(e.target.value)}
                      className="pl-10"
                      autoFocus
                    />
                  </div>

                  <div className="flex-1 overflow-y-auto border rounded-lg min-h-0 max-h-[400px]">
                    {ghLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : ghRepos.length === 0 ? (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        No repositories found.
                      </div>
                    ) : (
                      <div className="divide-y">
                        {ghRepos.map((repo) => (
                          <button
                            key={repo.id}
                            onClick={() => selectRepo(repo)}
                            className="flex items-start gap-3 w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                          >
                            <Github className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm truncate">
                                  {repo.fullName}
                                </span>
                                {repo.isPrivate && (
                                  <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                                )}
                              </div>
                              {repo.description && (
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                  {repo.description}
                                </p>
                              )}
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                {repo.language && <span>{repo.language}</span>}
                                {repo.stargazersCount > 0 && (
                                  <span className="flex items-center gap-0.5">
                                    <Star className="h-3 w-3" />
                                    {repo.stargazersCount}
                                  </span>
                                )}
                                <span>
                                  Branch: {repo.defaultBranch}
                                </span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Step 2: Configure the selected repo */}
                  <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                    <Github className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <span className="font-medium text-sm">
                        {selectedRepo.fullName}
                      </span>
                      {selectedRepo.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {selectedRepo.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedRepo(null)}
                    >
                      Change
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">
                        Branch
                      </label>
                      <div className="relative">
                        <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder={selectedRepo.defaultBranch}
                          value={form.branch}
                          onChange={(e) =>
                            setForm({ ...form, branch: e.target.value })
                          }
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">
                        Docs Path
                      </label>
                      <div className="relative">
                        <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="/ (root) or /docs"
                          value={form.docsPath}
                          onChange={(e) =>
                            setForm({ ...form, docsPath: e.target.value })
                          }
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Target Space
                    </label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={form.spaceId}
                      onChange={(e) =>
                        setForm({ ...form, spaceId: e.target.value })
                      }
                    >
                      <option value="">Select a space...</option>
                      {spaces.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    {spaces.length === 0 && (
                      <p className="text-xs text-amber-600 mt-1">
                        No spaces yet. Create a space first in the Spaces
                        section.
                      </p>
                    )}
                  </div>
                </>
              )}

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
                  setSelectedRepo(null);
                  setGhSearch("");
                  setFormError("");
                }}
              >
                Cancel
              </Button>
              {selectedRepo && (
                <Button onClick={handleConnect} disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <FolderGit2 className="mr-2 h-4 w-4" />
                      Connect & Sync
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Repository list */}
      {repos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Github className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <h3 className="font-semibold text-lg mb-1">
              No repositories connected
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Connect a GitHub repository to automatically import Markdown
              documentation. Changes pushed to GitHub will sync instantly.
            </p>
            <Button className="mt-6" onClick={() => setShowModal(true)}>
              <Github className="mr-2 h-4 w-4" />
              Connect your first repository
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {repos.map((repo) => {
            const status = statusConfig[repo.lastSyncStatus];
            const StatusIcon = status.icon;
            const isSyncing = syncing.has(repo.id);

            return (
              <Card key={repo.id}>
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Github className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">
                        {repo.owner}/{repo.repo}
                      </h3>
                      <Badge variant={status.color}>
                        <StatusIcon
                          className={`mr-1 h-3 w-3 ${isSyncing ? "animate-spin" : ""}`}
                        />
                        {isSyncing ? "Syncing..." : status.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <GitBranch className="h-3 w-3" />
                        {repo.branch}
                      </span>
                      <span className="flex items-center gap-1">
                        <FolderOpen className="h-3 w-3" />
                        {repo.docsPath}
                      </span>
                      <span>Space: {repo.space.name}</span>
                      <span>{repo._count.pages} pages</span>
                    </div>
                    {repo.lastSyncAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Last synced:{" "}
                        {new Date(repo.lastSyncAt).toLocaleString()}
                      </p>
                    )}
                    {repo.lastSyncError && (
                      <p className="text-xs text-red-500 mt-1">
                        {repo.lastSyncError}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSync(repo.id)}
                      disabled={isSyncing}
                    >
                      <RefreshCw
                        className={`mr-1 h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`}
                      />
                      Sync
                    </Button>
                    <a
                      href={`https://github.com/${repo.owner}/${repo.repo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(repo.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
