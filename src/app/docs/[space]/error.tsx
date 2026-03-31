"use client";

import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function DocsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md px-4">
        <AlertTriangle className="mx-auto h-10 w-10 text-amber-500 mb-4" />
        <h2 className="text-lg font-bold mb-2">Page Error</h2>
        <p className="text-sm text-muted-foreground mb-6">
          This page encountered an error while loading. This might be temporary.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Link>
        </div>
      </div>
    </main>
  );
}
