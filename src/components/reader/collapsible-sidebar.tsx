"use client";

import React from "react";
import { ChevronsLeft, Menu } from "lucide-react";

export function CollapsibleSidebar({
  children,
  defaultOpen = true,
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);

  if (!open) {
    return (
      <div className="hidden md:flex shrink-0 flex-col items-center w-10 border-r bg-sidebar pt-3">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Expand sidebar"
        >
          <Menu className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="hidden md:block shrink-0 w-64 border-r bg-sidebar">
      <div className="sticky top-14 h-[calc(100vh-3.5rem)] flex flex-col">
        {/* Collapse button at top */}
        <div className="flex items-center justify-end px-2 py-1.5 border-b">
          <button
            onClick={() => setOpen(false)}
            className="flex items-center justify-center h-6 w-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Collapse sidebar"
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </button>
        </div>
        {/* Sidebar content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
