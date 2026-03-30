"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, X, Loader2 } from "lucide-react";

interface SearchResult {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  spaceSlug: string;
  spaceName?: string;
}

interface SearchCommandProps {
  spaceSlug?: string;
}

export function SearchCommand({ spaceSlug }: SearchCommandProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Keyboard shortcut
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Focus input when dialog opens
  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open]);

  // Debounced search
  React.useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: query });
        if (spaceSlug) params.set("space", spaceSlug);
        const res = await fetch(`/api/search?${params}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
          setSelectedIndex(0);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, spaceSlug]);

  function handleSelect(result: SearchResult) {
    setOpen(false);
    router.push(`/docs/${result.spaceSlug}/${result.slug}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search docs...</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Search dialog */}
      {open && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />

          {/* Dialog */}
          <div className="relative mx-auto mt-[15vh] w-full max-w-lg px-4">
            <div className="rounded-xl border bg-background shadow-2xl overflow-hidden">
              {/* Search input */}
              <div className="flex items-center border-b px-4">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search documentation..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent py-3 px-3 text-sm outline-none placeholder:text-muted-foreground"
                />
                {loading && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="ml-2 rounded p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Results */}
              <div className="max-h-[300px] overflow-y-auto">
                {query.length >= 2 && results.length === 0 && !loading && (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No results found for &quot;{query}&quot;
                  </div>
                )}

                {query.length < 2 && (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    Type at least 2 characters to search
                  </div>
                )}

                {results.length > 0 && (
                  <div className="py-2">
                    <p className="px-4 py-1 text-xs font-medium text-muted-foreground">
                      Pages
                    </p>
                    {results.map((result, i) => (
                      <button
                        key={result.id}
                        onClick={() => handleSelect(result)}
                        className={`flex items-start gap-3 w-full px-4 py-2.5 text-left text-sm transition-colors ${
                          i === selectedIndex
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-muted"
                        }`}
                      >
                        <FileText className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <div className="font-medium truncate">
                            {result.title}
                          </div>
                          {result.excerpt && (
                            <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                              {result.excerpt}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer hint */}
              <div className="border-t px-4 py-2 text-[11px] text-muted-foreground flex items-center gap-3">
                <span>
                  <kbd className="rounded border px-1 py-0.5 text-[10px]">↑↓</kbd> navigate
                </span>
                <span>
                  <kbd className="rounded border px-1 py-0.5 text-[10px]">↵</kbd> select
                </span>
                <span>
                  <kbd className="rounded border px-1 py-0.5 text-[10px]">esc</kbd> close
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
