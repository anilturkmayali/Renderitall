"use client";

import React from "react";
import { ChevronsLeft, ChevronsRight } from "lucide-react";

export function CollapsibleSidebar({
  children,
  defaultOpen = true,
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <>
      {/* Sidebar wrapper */}
      <div
        className="hidden md:block shrink-0 border-r bg-sidebar transition-all duration-200 relative"
        style={{ width: open ? 256 : 0, minWidth: open ? 256 : 0, borderRightWidth: open ? 1 : 0 }}
      >
        {/* Sidebar content */}
        <div className="sticky top-14 h-[calc(100vh-3.5rem)] w-64 overflow-y-auto overflow-x-hidden">
          {children}
          {/* Collapse button at bottom of sidebar */}
          <div className="border-t p-2">
            <button
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 w-full rounded-md px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
              Collapse sidebar
            </button>
          </div>
        </div>
      </div>

      {/* Expand button — shown when sidebar is collapsed */}
      {!open && (
        <div className="hidden md:block shrink-0">
          <div className="sticky top-14 p-2">
            <button
              onClick={() => setOpen(true)}
              className="flex items-center justify-center h-8 w-8 rounded-md border bg-background shadow-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Expand sidebar"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
