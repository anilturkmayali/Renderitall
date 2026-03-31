import { Loader2 } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="space-y-6 p-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-72 bg-muted rounded animate-pulse mt-2" />
        </div>
        <div className="h-9 w-32 bg-muted rounded animate-pulse" />
      </div>

      {/* Cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border p-6">
            <div className="h-4 w-24 bg-muted rounded animate-pulse mb-4" />
            <div className="h-8 w-16 bg-muted rounded animate-pulse" />
            <div className="h-3 w-20 bg-muted rounded animate-pulse mt-2" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="rounded-xl border p-6">
        <div className="h-5 w-36 bg-muted rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-4 w-4 bg-muted rounded animate-pulse" />
              <div className="h-4 flex-1 bg-muted rounded animate-pulse" />
              <div className="h-4 w-20 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
