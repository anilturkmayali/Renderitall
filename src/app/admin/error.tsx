"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="text-center max-w-md">
        <AlertTriangle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
        <p className="text-sm text-muted-foreground mb-6">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <Button onClick={reset}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    </div>
  );
}
