"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function PageTracker({ spaceSlug }: { spaceSlug: string }) {
  const pathname = usePathname();

  useEffect(() => {
    // Extract page slug from pathname
    const prefix = `/docs/${spaceSlug}/`;
    const pageSlug = pathname.startsWith(prefix)
      ? pathname.slice(prefix.length)
      : pathname === `/docs/${spaceSlug}` ? "_home" : pathname;

    // Track after a small delay (avoid tracking quick navigation)
    const timer = setTimeout(() => {
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spaceSlug,
          pageSlug,
          referrer: typeof document !== "undefined" ? document.referrer : null,
        }),
      }).catch(() => {}); // never fail
    }, 1000);

    return () => clearTimeout(timer);
  }, [pathname, spaceSlug]);

  return null;
}
