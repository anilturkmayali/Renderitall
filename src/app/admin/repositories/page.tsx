"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Github,
  Settings,
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
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface Repo {
  id: string;
  owner: string;
  repo: string;
  branch: string;
  docsPath: string;
  spaceId: string;
  lastSyncAt: string | null;
  lastSyncStatus: string;
  lastSyncError: string | null;
  pageCount: number;
  config: any;
  _count: { pages: number };
  space: { name: string; slug: string };
}

interface Space { id: string; name: string; slug: string; }

interface GHRepo {
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

export default function RepositoriesPage() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/repos").then((r) => r.json()),
      fetch("/api/admin/spaces").then((r) => r.json()),
    ]).then(([r, s]) => {
      setRepos(r);
      setSpaces(s);
      setLoading(false);
    });
  }, []);

  async function refresh() {
    const r = await fetch("/api/admin/repos").then((r) => r.json());
    setRepos(r);
  }

  async function handleSync(id: string) {
    setSyncing((s) => new Set([...s, id]));
    fetch(`/api/admin/repos/${id}/sync`, { method: "POST" }).catch(() => {});
    let attempts = 0;
    const poll = setInterval(async () => {
      attempts++;
      const res = await fetch(`/api/admin/repos/${id}`);
      if (res.ok) {
        const repo = await res.json();
        // Update the repo in our list with latest progress
        setRepos(prev => prev.map(r => r.id === id ? { ...r, pageCount: repo.pageCount, config: repo.config, lastSyncStatus: repo.lastSyncStatus, lastSyncError: repo.lastSyncError, _count: { pages: repo.pages?.length || repo.pageCount || r._count.pages } } : r));
        if (repo.lastSyncStatus !== "SYNCING" || attempts > 60) {
          clearInterval(poll);
          setSyncing((s) => { const n = new Set(s); n.delete(id); return n; });
          refresh();
        }
      }
      if (attempts > 60) {
        clearInterval(poll);
        setSyncing((s) => { const n = new Set(s); n.delete(id); return n; });
        refresh();
      }
    }, 3000);
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this repository and all its synced pages?")) return;
    await fetch(`/api/admin/repos/${id}`, { method: "DELETE" });
    refresh();
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Repositories</h1>
          <p className="text-muted-foreground">Connect GitHub repositories to import documentation content.</p>
        </div>
        <Button onClick={() => setShowModal(true)}><Plus className="mr-2 h-4 w-4" />Connect Repo</Button>
      </div>

      {repos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Github className="mx-auto h-10 w-10 mb-3 opacity-50" />
            <h3 className="font-semibold mb-1">No repositories connected</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">Connect a GitHub repo to import its markdown files as documentation pages.</p>
            <Button onClick={() => setShowModal(true)}><Github className="mr-2 h-4 w-4" />Connect your first repo</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {repos.map((repo) => {
            const isSyncing = syncing.has(repo.id) || repo.lastSyncStatus === "SYNCING";
            return (
              <Card key={repo.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <Github className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{repo.owner}/{repo.repo}</span>
                      {(() => {
                        const progress = repo.config?.syncProgress;
                        if (isSyncing || repo.lastSyncStatus === "SYNCING") {
                          return (
                            <Badge variant="warning" className="text-[10px] gap-1">
                              <RefreshCw className="h-3 w-3 animate-spin" />
                              {progress?.total ? `Syncing ${progress.synced || 0}/${progress.total}...` : "Starting sync..."}
                            </Badge>
                          );
                        }
                        return (
                          <Badge variant={repo.lastSyncStatus === "SUCCESS" ? "success" : repo.lastSyncStatus === "ERROR" ? "destructive" : "secondary"} className="text-[10px]">
                            {repo._count.pages} pages{repo.lastSyncStatus === "SUCCESS" ? " synced" : ""}
                          </Badge>
                        );
                      })()}
                    </div>
                    {/* Progress bar during sync */}
                    {(isSyncing || repo.lastSyncStatus === "SYNCING") && repo.config?.syncProgress?.total > 0 && (
                      <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${Math.round(((repo.config.syncProgress.synced || 0) / repo.config.syncProgress.total) * 100)}%` }} />
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1"><GitBranch className="h-3 w-3" />{repo.branch}</span>
                      <span>{repo.docsPath}</span>
                      <span>→ {repo.space.name}</span>
                      {repo.lastSyncAt && <span>· Synced {new Date(repo.lastSyncAt).toLocaleDateString()}</span>}
                      {repo.lastSyncStatus === "ERROR" && (
                        <Badge variant="destructive" className="text-[10px]">Sync failed</Badge>
                      )}
                      {repo.lastSyncStatus === "SYNCING" && (
                        <Badge variant="warning" className="text-[10px]">Syncing...</Badge>
                      )}
                    </div>
                    {repo.lastSyncError && (
                      <p className="text-xs text-red-500 mt-1 bg-red-50 dark:bg-red-950/20 rounded px-2 py-1">
                        {repo.lastSyncError}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Link href={`/admin/repositories/${repo.id}`}>
                      <Button variant="outline" size="sm"><Settings className="mr-1 h-3 w-3" />Customize</Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={() => handleSync(repo.id)} disabled={isSyncing}>
                      <RefreshCw className={`mr-1 h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />{isSyncing ? "Syncing..." : "Sync"}
                    </Button>
                    <a href={`https://github.com/${repo.owner}/${repo.repo}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="h-8 w-8"><ExternalLink className="h-3.5 w-3.5" /></Button>
                    </a>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(repo.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showModal && (
        <ConnectModal
          spaces={spaces}
          onClose={() => setShowModal(false)}
          onDone={() => { setShowModal(false); refresh(); }}
        />
      )}
    </div>
  );
}

function ConnectModal({ spaces, onClose, onDone }: { spaces: Space[]; onClose: () => void; onDone: () => void }) {
  const [ghRepos, setGhRepos] = useState<GHRepo[]>([]);
  const [ghSearch, setGhSearch] = useState("");
  const [ghLoading, setGhLoading] = useState(true);
  const [selected, setSelected] = useState<GHRepo | null>(null);
  const [branch, setBranch] = useState("");
  const [docsPath, setDocsPath] = useState("/");
  const [spaceId, setSpaceId] = useState(spaces[0]?.id || "");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Org tabs
  const [orgs, setOrgs] = useState<{ login: string }[]>([]);
  const [selectedOrg, setSelectedOrg] = useState(""); // "" = all

  useEffect(() => {
    fetchGH("", "");
    // Fetch orgs for tabs
    fetch("/api/admin/github/account").then((r) => r.json()).then((data) => {
      if (data.organizations) setOrgs(data.organizations);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => fetchGH(ghSearch, selectedOrg), 300);
    return () => clearTimeout(timer.current);
  }, [ghSearch, selectedOrg]);

  async function fetchGH(q: string, org: string) {
    setGhLoading(true);
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (org) p.set("org", org);
    const res = await fetch(`/api/admin/github/repos?${p}`);
    if (res.ok) setGhRepos(await res.json());
    setGhLoading(false);
  }

  async function handleConnect() {
    if (!selected || !spaceId) return;
    setCreating(true); setError("");
    const res = await fetch("/api/admin/repos", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ owner: selected.owner, repo: selected.name, branch: branch || selected.defaultBranch, docsPath, spaceId }),
    });
    if (!res.ok) { setError((await res.json()).error || "Failed"); setCreating(false); return; }
    onDone();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-xl border bg-background p-6 shadow-2xl mx-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Connect Repository</h2>
          <button onClick={onClose}><X className="h-4 w-4" /></button>
        </div>
        {!selected ? (
          <>
            {/* Org tabs */}
            {orgs.length > 0 && (
              <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
                <button onClick={() => setSelectedOrg("")} className={`rounded-md border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all ${selectedOrg === "" ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"}`}>
                  All Repos
                </button>
                {orgs.map((org) => (
                  <button key={org.login} onClick={() => setSelectedOrg(org.login)} className={`rounded-md border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all ${selectedOrg === org.login ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"}`}>
                    {org.login}
                  </button>
                ))}
              </div>
            )}

            <div className="relative mb-3"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder={selectedOrg ? `Search ${selectedOrg} repos...` : "Search all repositories..."} value={ghSearch} onChange={(e) => setGhSearch(e.target.value)} className="pl-10" autoFocus /></div>
            <div className="flex-1 overflow-y-auto border rounded-lg min-h-0">
              {ghLoading ? <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : ghRepos.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <p>No repos found.</p>
                  {!orgs.length && <p className="text-xs mt-2">If you don&apos;t see organization repos, go to <strong>Settings</strong> and click &quot;Reconnect&quot; to grant organization access.</p>}
                </div>
              ) : (
                <div className="divide-y">{ghRepos.map((r) => (
                  <button key={r.id} onClick={() => { setSelected(r); setBranch(r.defaultBranch); }} className="flex items-start gap-3 w-full px-4 py-3 text-left hover:bg-muted/50">
                    <Github className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2"><span className="font-medium text-sm">{r.fullName}</span>{r.isPrivate && <Lock className="h-3 w-3 text-muted-foreground" />}</div>
                      {r.description && <p className="text-xs text-muted-foreground line-clamp-1">{r.description}</p>}
                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground">{r.language && <span>{r.language}</span>}{r.stargazersCount > 0 && <span className="flex items-center gap-0.5"><Star className="h-3 w-3" />{r.stargazersCount}</span>}<span>{r.defaultBranch}</span></div>
                    </div>
                  </button>
                ))}</div>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
              <Github className="h-5 w-5" /><div className="flex-1"><span className="font-medium text-sm">{selected.fullName}</span></div>
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Change</Button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-sm font-medium mb-1.5 block">Branch</label><Input value={branch} onChange={(e) => setBranch(e.target.value)} /></div>
              <div><label className="text-sm font-medium mb-1.5 block">Docs Path</label><Input value={docsPath} onChange={(e) => setDocsPath(e.target.value)} placeholder="/" /></div>
              <div><label className="text-sm font-medium mb-1.5 block">Space</label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={spaceId} onChange={(e) => setSpaceId(e.target.value)}>
                  {spaces.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleConnect} disabled={creating}>{creating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Connecting...</> : <><FolderGit2 className="mr-2 h-4 w-4" />Connect & Sync</>}</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
