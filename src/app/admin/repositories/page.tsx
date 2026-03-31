"use client";

import { useState, useEffect, useRef } from "react";
import { SyncModal as SyncModalForExisting } from "@/components/admin/sync-modal";
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
  FileText,
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
  webhookId: number | null;
  _count: { pages: number };
  space: { name: string; slug: string };
}


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
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [syncRepoId, setSyncRepoId] = useState<string|null>(null);
  const [syncRepoName, setSyncRepoName] = useState("");

  useEffect(() => {
    fetch("/api/admin/repos").then((r) => r.json()).then((r) => {
      setRepos(r);
      setLoading(false);
    });
  }, []);

  async function refresh() {
    const r = await fetch("/api/admin/repos").then((r) => r.json());
    setRepos(r);
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
          <h1 className="text-2xl font-bold tracking-tight">Import from GitHub</h1>
          <p className="text-muted-foreground">Connect repositories and import their content. Imported pages can be used in any Site.</p>
        </div>
        <Button onClick={() => setShowModal(true)}><Plus className="mr-2 h-4 w-4" />Connect Repo</Button>
      </div>

      {repos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Github className="mx-auto h-10 w-10 mb-3 opacity-50" />
            <h3 className="font-semibold mb-1">No repositories connected</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">Connect a GitHub repo and choose which markdown files to import.</p>
            <Button onClick={() => setShowModal(true)}><Github className="mr-2 h-4 w-4" />Connect your first repo</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {repos.map((repo) => {
            return (
              <Card key={repo.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <Github className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{repo.owner}/{repo.repo}</span>
                      <Badge variant={repo.lastSyncStatus === "SUCCESS" ? "success" : repo.lastSyncStatus === "ERROR" ? "destructive" : "secondary"} className="text-[10px]">
                        {repo._count.pages} pages
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1"><GitBranch className="h-3 w-3" />{repo.branch}</span>
                      <span>{repo.docsPath}</span>
                      {repo.lastSyncAt && <span>· Imported {new Date(repo.lastSyncAt).toLocaleDateString()}</span>}
                      {repo.webhookId ? (
                        <Badge variant="success" className="text-[10px]">Auto-sync on</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">Manual only</Badge>
                      )}
                      {repo.lastSyncStatus === "ERROR" && (
                        <Badge variant="destructive" className="text-[10px]">Import failed</Badge>
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
                    <Button variant="outline" size="sm" onClick={() => {setSyncRepoId(repo.id);setSyncRepoName(`${repo.owner}/${repo.repo}`)}}>
                      <RefreshCw className="mr-1 h-3 w-3" />Import
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

      {syncRepoId && (
        <SyncModalForExisting repoId={syncRepoId} repoName={syncRepoName} onClose={()=>setSyncRepoId(null)} onDone={()=>{setSyncRepoId(null);refresh()}} />
      )}

      {showModal && (
        <ConnectModal
          onClose={() => setShowModal(false)}
          onDone={() => { setShowModal(false); refresh(); }}
        />
      )}
    </div>
  );
}

interface FilePreview { path: string; sha: string; slug: string; title: string; alreadySynced: boolean; unchanged: boolean; }

function ConnectModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  // Step: browse → configure → selectFiles → importing → done
  const [step, setStep] = useState<"browse"|"configure"|"selectFiles"|"importing"|"done">("browse");

  // Browse
  const [ghRepos, setGhRepos] = useState<GHRepo[]>([]);
  const [ghSearch, setGhSearch] = useState("");
  const [ghLoading, setGhLoading] = useState(true);
  const [orgs, setOrgs] = useState<{login:string}[]>([]);
  const [selectedOrg, setSelectedOrg] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Configure
  const [selected, setSelected] = useState<GHRepo|null>(null);
  const [branch, setBranch] = useState("");
  const [docsPath, setDocsPath] = useState("/");
  // spaceId auto-assigned by API
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [connectedRepoId, setConnectedRepoId] = useState("");

  // File selection
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [filesLoading, setFilesLoading] = useState(false);

  // Import progress
  const [importedCount, setImportedCount] = useState(0);
  const [importTotal, setImportTotal] = useState(0);
  const [currentFile, setCurrentFile] = useState("");
  const [failedFiles, setFailedFiles] = useState<string[]>([]);

  useEffect(() => {
    fetchGH("","");
    fetch("/api/admin/github/account").then(r=>r.json()).then(d=>{if(d.organizations)setOrgs(d.organizations)}).catch(()=>{});
  }, []);

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(()=>fetchGH(ghSearch,selectedOrg),300);
    return ()=>clearTimeout(timer.current);
  }, [ghSearch, selectedOrg]);

  async function fetchGH(q:string, org:string) {
    setGhLoading(true);
    const p = new URLSearchParams(); if(q)p.set("q",q); if(org)p.set("org",org);
    const res = await fetch(`/api/admin/github/repos?${p}`);
    if(res.ok) setGhRepos(await res.json());
    setGhLoading(false);
  }

  async function handleConnect() {
    if(!selected) return;
    setCreating(true); setError("");
    const res = await fetch("/api/admin/repos", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ owner:selected.owner, repo:selected.name, branch:branch||selected.defaultBranch, docsPath }),
    });
    if(!res.ok) { setError((await res.json()).error||"Failed"); setCreating(false); return; }
    const repo = await res.json();
    setConnectedRepoId(repo.id);
    setCreating(false);
    // Move to file selection
    loadFiles(repo.id);
  }

  async function loadFiles(repoId: string) {
    setStep("selectFiles");
    setFilesLoading(true);
    try {
      const res = await fetch(`/api/admin/repos/${repoId}/preview`);
      if(res.ok) {
        const data = await res.json();
        setFiles(data.files);
        setSelectedFiles(new Set(data.files.map((f:FilePreview)=>f.path)));
      }
    } catch {}
    setFilesLoading(false);
  }

  async function startImport() {
    const toImport = files.filter(f=>selectedFiles.has(f.path));
    setStep("importing");
    setImportTotal(toImport.length);
    setImportedCount(0);
    setFailedFiles([]);

    const failed:string[] = [];
    for(let i=0; i<toImport.length; i++) {
      const file = toImport[i];
      setCurrentFile(file.title);
      try {
        const res = await fetch(`/api/admin/repos/${connectedRepoId}/sync-file`, {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ filePath:file.path, position:i }),
        });
        if(!res.ok) failed.push(file.path);
      } catch { failed.push(file.path); }
      setImportedCount(i+1);
      setFailedFiles([...failed]);
    }

    await fetch(`/api/admin/repos/${connectedRepoId}/sync-done`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ pagesSynced: toImport.length - failed.length }),
    }).catch(()=>{});

    setStep("done");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-xl border bg-background shadow-2xl mx-4 max-h-[85vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0 border-b">
          <div>
            <h2 className="text-lg font-bold">
              {step==="browse"?"Connect Repository":step==="configure"?"Configure":step==="selectFiles"?"Choose files to import":step==="importing"?"Importing...":"Import complete"}
            </h2>
            {selected && <p className="text-xs text-muted-foreground">{selected.fullName}</p>}
          </div>
          {step!=="importing" && <button onClick={step==="done"?onDone:onClose} className="rounded-md p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>}
        </div>

        {/* Step 1: Browse repos */}
        {step==="browse" && <>
          {orgs.length>0 && (
            <div className="px-6 py-3 shrink-0">
              <div className="flex gap-2 p-1 rounded-lg bg-muted/50 overflow-x-auto">
                <button onClick={()=>setSelectedOrg("")} className={`rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${selectedOrg===""?"bg-background shadow-sm text-primary":"text-muted-foreground hover:text-foreground"}`}>All Repos</button>
                {orgs.map(o=><button key={o.login} onClick={()=>setSelectedOrg(o.login)} className={`rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${selectedOrg===o.login?"bg-background shadow-sm text-primary":"text-muted-foreground hover:text-foreground"}`}>{o.login}</button>)}
              </div>
            </div>
          )}
          <div className="px-6 pb-3 shrink-0">
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder={selectedOrg?`Search ${selectedOrg}...`:"Search all repositories..."} value={ghSearch} onChange={e=>setGhSearch(e.target.value)} className="pl-10" autoFocus /></div>
          </div>
          <div className="flex-1 overflow-y-auto border-t min-h-0">
            {ghLoading?<div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>:ghRepos.length===0?(
              <div className="py-8 text-center text-sm text-muted-foreground"><p>No repos found.</p>{!orgs.length&&<p className="text-xs mt-2">Go to <strong>Settings</strong> to grant organization access.</p>}</div>
            ):(
              <div className="divide-y">{ghRepos.map(r=>(
                <button key={r.id} onClick={()=>{setSelected(r);setBranch(r.defaultBranch);setStep("configure")}} className="flex items-start gap-3 w-full px-5 py-3 text-left hover:bg-muted/50">
                  <Github className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><span className="font-medium text-sm">{r.fullName}</span>{r.isPrivate&&<Lock className="h-3 w-3 text-muted-foreground" />}</div>
                    {r.description&&<p className="text-xs text-muted-foreground line-clamp-1">{r.description}</p>}
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground">{r.language&&<span>{r.language}</span>}{r.stargazersCount>0&&<span className="flex items-center gap-0.5"><Star className="h-3 w-3" />{r.stargazersCount}</span>}<span>{r.defaultBranch}</span></div>
                  </div>
                </button>
              ))}</div>
            )}
          </div>
        </>}

        {/* Step 2: Configure */}
        {step==="configure" && selected && (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
              <Github className="h-5 w-5" /><span className="flex-1 font-medium text-sm">{selected.fullName}</span>
              <Button variant="ghost" size="sm" onClick={()=>{setSelected(null);setStep("browse")}}>Change</Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium mb-1.5 block">Branch</label><Input value={branch} onChange={e=>setBranch(e.target.value)} /></div>
              <div><label className="text-sm font-medium mb-1.5 block">Docs Path</label><Input value={docsPath} onChange={e=>setDocsPath(e.target.value)} placeholder="/" /></div>
            </div>
            {error&&<p className="text-sm text-red-500">{error}</p>}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={()=>setStep("browse")}>Back</Button>
              <Button onClick={handleConnect} disabled={creating}>{creating?<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Connecting...</>:<><FolderGit2 className="mr-2 h-4 w-4" />Connect & Choose Files</>}</Button>
            </div>
          </div>
        )}

        {/* Step 3: Select files */}
        {step==="selectFiles" && (
          <>
            {filesLoading ? (
              <div className="flex items-center justify-center py-16"><div className="text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground mb-3" /><p className="text-sm text-muted-foreground">Scanning for markdown files...</p></div></div>
            ) : (
              <>
                <div className="px-5 py-3 border-b bg-muted/30 shrink-0 flex items-center justify-between">
                  <span className="text-xs font-medium">{files.length} files found</span>
                  <div className="flex gap-2">
                    <button onClick={()=>setSelectedFiles(new Set(files.map(f=>f.path)))} className="text-primary text-xs hover:underline">Select all</button>
                    <button onClick={()=>setSelectedFiles(new Set())} className="text-xs text-muted-foreground hover:underline">Deselect all</button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto min-h-0">
                  {files.map(file=>(
                    <label key={file.path} className={`flex items-center gap-3 px-5 py-2.5 cursor-pointer border-b last:border-0 transition-colors ${selectedFiles.has(file.path)?"bg-primary/5":"hover:bg-muted/30"}`}>
                      <input type="checkbox" checked={selectedFiles.has(file.path)} onChange={()=>{
                        setSelectedFiles(prev=>{const n=new Set(prev);if(n.has(file.path))n.delete(file.path);else n.add(file.path);return n;})
                      }} className="rounded border-input h-4 w-4" />
                      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium block truncate">{file.title}</span>
                        <span className="text-[11px] text-muted-foreground truncate block">{file.path}</span>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="px-5 py-3 border-t flex items-center justify-between shrink-0">
                  <span className="text-xs text-muted-foreground">{selectedFiles.size} selected</span>
                  <Button size="sm" onClick={startImport} disabled={selectedFiles.size===0}>Import {selectedFiles.size} file{selectedFiles.size!==1?"s":""}</Button>
                </div>
              </>
            )}
          </>
        )}

        {/* Step 4: Importing */}
        {step==="importing" && (
          <div className="p-6">
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium">Importing files...</span>
                <span className="text-muted-foreground">{importedCount}/{importTotal}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-300" style={{width:`${importTotal?Math.round((importedCount/importTotal)*100):0}%`}} />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
              <span className="truncate">{currentFile}</span>
            </div>
            {failedFiles.length>0&&<p className="text-xs text-red-500 mt-2">{failedFiles.length} file(s) failed</p>}
          </div>
        )}

        {/* Step 5: Done */}
        {step==="done" && (
          <div className="p-6 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-green-500 mb-3" />
            <p className="text-lg font-semibold mb-1">Import complete!</p>
            <p className="text-sm text-muted-foreground">{importedCount-failedFiles.length} of {importTotal} files imported.</p>
            {failedFiles.length>0&&<p className="text-xs text-red-500 mt-1">{failedFiles.length} failed — retry later.</p>}
            <Button size="sm" className="mt-4" onClick={onDone}>Done</Button>
          </div>
        )}
      </div>
    </div>
  );
}
