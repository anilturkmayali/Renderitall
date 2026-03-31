"use client";

import { useState, useEffect } from "react";
import {
  X, Loader2, Check, FileText, RefreshCw, CheckCircle2,
  Circle, AlertTriangle, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FileInfo {
  path: string;
  sha: string;
  slug: string;
  title: string;
  alreadySynced: boolean;
  unchanged: boolean;
}

interface SyncModalProps {
  repoId: string;
  repoName: string;
  onClose: () => void;
  onDone: () => void;
}

type Phase = "loading" | "select" | "syncing" | "done" | "error";

export function SyncModal({ repoId, repoName, onClose, onDone }: SyncModalProps) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({ total: 0, newFiles: 0, changedFiles: 0, unchangedFiles: 0 });
  const [error, setError] = useState("");

  // Sync progress
  const [syncing, setSyncing] = useState(false);
  const [syncedCount, setSyncedCount] = useState(0);
  const [syncTotal, setSyncTotal] = useState(0);
  const [currentFile, setCurrentFile] = useState("");
  const [failedFiles, setFailedFiles] = useState<string[]>([]);

  // Load file list
  useEffect(() => {
    loadPreview();
  }, []);

  async function loadPreview() {
    setPhase("loading");
    setError("");
    try {
      const res = await fetch(`/api/admin/repos/${repoId}/preview`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch files");
      }
      const data = await res.json();
      setFiles(data.files);
      setStats({ total: data.total, newFiles: data.newFiles, changedFiles: data.changedFiles, unchangedFiles: data.unchangedFiles });

      // Pre-select new and changed files
      const toSelect = new Set<string>();
      data.files.forEach((f: FileInfo) => {
        if (!f.unchanged) toSelect.add(f.path);
      });
      // If nothing changed, select all
      if (toSelect.size === 0) {
        data.files.forEach((f: FileInfo) => toSelect.add(f.path));
      }
      setSelected(toSelect);
      setPhase("select");
    } catch (err: any) {
      setError(err.message);
      setPhase("error");
    }
  }

  function toggleFile(path: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(files.map((f) => f.path)));
  }

  function deselectAll() {
    setSelected(new Set());
  }

  async function startSync() {
    const filesToSync = files.filter((f) => selected.has(f.path));
    if (filesToSync.length === 0) return;

    setPhase("syncing");
    setSyncTotal(filesToSync.length);
    setSyncedCount(0);
    setFailedFiles([]);

    // Mark repo as syncing
    await fetch(`/api/admin/repos/${repoId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lastSyncStatus: "SYNCING" }),
    }).catch(() => {});

    // Sync files one by one — each is its own API call so no timeout issues
    let synced = 0;
    const failed: string[] = [];

    for (let i = 0; i < filesToSync.length; i++) {
      const file = filesToSync[i];
      setCurrentFile(file.title || file.path);

      try {
        const res = await fetch(`/api/admin/repos/${repoId}/sync-file`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filePath: file.path, position: i }),
        });
        if (!res.ok) {
          failed.push(file.path);
        } else {
          synced++;
        }
      } catch {
        failed.push(file.path);
      }

      setSyncedCount(i + 1);
      setFailedFiles([...failed]);
    }

    // Mark sync as done
    await fetch(`/api/admin/repos/${repoId}/sync-done`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pagesSynced: synced }),
    }).catch(() => {});

    setPhase("done");
  }

  function handleClose() {
    if (phase === "done" || phase === "error" || phase === "select") {
      if (phase === "done") onDone();
      else onClose();
    }
  }

  const selectedCount = selected.size;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-xl rounded-xl border bg-background shadow-2xl mx-4 max-h-[80vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <div>
            <h2 className="text-lg font-bold">
              {phase === "loading" ? "Loading files..." :
               phase === "select" ? "Select files to import" :
               phase === "syncing" ? "Importing..." :
               phase === "done" ? "Import complete" :
               "Error"}
            </h2>
            <p className="text-xs text-muted-foreground">{repoName}</p>
          </div>
          {phase !== "syncing" && (
            <button onClick={handleClose} className="rounded-md p-1 hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Loading */}
        {phase === "loading" && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Scanning repository for markdown files...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {phase === "error" && (
          <div className="p-6 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-red-500 mb-3" />
            <p className="text-sm font-medium mb-1">Failed to load files</p>
            <p className="text-xs text-muted-foreground mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={loadPreview}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />Retry
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>
          </div>
        )}

        {/* File selection */}
        {phase === "select" && (
          <>
            {/* Stats bar */}
            <div className="px-5 py-3 border-b bg-muted/30 shrink-0">
              <div className="flex items-center gap-3 text-xs">
                <span className="font-medium">{stats.total} files found</span>
                {stats.newFiles > 0 && <Badge variant="success" className="text-[10px]">{stats.newFiles} new</Badge>}
                {stats.changedFiles > 0 && <Badge variant="warning" className="text-[10px]">{stats.changedFiles} changed</Badge>}
                {stats.unchangedFiles > 0 && <Badge variant="secondary" className="text-[10px]">{stats.unchangedFiles} unchanged</Badge>}
                <div className="ml-auto flex gap-2">
                  <button onClick={selectAll} className="text-primary text-xs hover:underline">Select all</button>
                  <button onClick={deselectAll} className="text-xs text-muted-foreground hover:underline">Deselect all</button>
                </div>
              </div>
            </div>

            {/* File list */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {files.map((file) => {
                const isSelected = selected.has(file.path);
                return (
                  <label
                    key={file.path}
                    className={`flex items-center gap-3 px-5 py-2.5 cursor-pointer border-b last:border-0 transition-colors ${
                      isSelected ? "bg-primary/5" : "hover:bg-muted/30"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleFile(file.path)}
                      className="rounded border-input h-4 w-4 text-primary"
                    />
                    <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium block truncate">{file.title}</span>
                      <span className="text-[11px] text-muted-foreground truncate block">{file.path}</span>
                    </div>
                    {file.unchanged ? (
                      <Badge variant="secondary" className="text-[10px] shrink-0">Unchanged</Badge>
                    ) : file.alreadySynced ? (
                      <Badge variant="warning" className="text-[10px] shrink-0">Changed</Badge>
                    ) : (
                      <Badge variant="success" className="text-[10px] shrink-0">New</Badge>
                    )}
                  </label>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t bg-muted/20 flex items-center justify-between shrink-0">
              <span className="text-xs text-muted-foreground">{selectedCount} file{selectedCount !== 1 ? "s" : ""} selected</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
                <Button size="sm" onClick={startSync} disabled={selectedCount === 0}>
                  Import {selectedCount} file{selectedCount !== 1 ? "s" : ""}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Syncing progress */}
        {phase === "syncing" && (
          <div className="p-6">
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium">Importing files...</span>
                <span className="text-muted-foreground">{syncedCount}/{syncTotal}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${Math.round((syncedCount / syncTotal) * 100)}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
              <span className="truncate">{currentFile}</span>
            </div>
            {failedFiles.length > 0 && (
              <p className="text-xs text-red-500 mt-2">{failedFiles.length} file(s) failed</p>
            )}
          </div>
        )}

        {/* Done */}
        {phase === "done" && (
          <div className="p-6 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-green-500 mb-3" />
            <p className="text-lg font-semibold mb-1">Import complete!</p>
            <p className="text-sm text-muted-foreground mb-1">
              {syncedCount - failedFiles.length} of {syncTotal} files imported successfully.
            </p>
            {failedFiles.length > 0 && (
              <p className="text-xs text-red-500 mb-3">{failedFiles.length} file(s) failed — you can retry them later.</p>
            )}
            <Button size="sm" onClick={() => { onDone(); }} className="mt-3">
              <Check className="mr-1.5 h-3.5 w-3.5" />Done
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}
