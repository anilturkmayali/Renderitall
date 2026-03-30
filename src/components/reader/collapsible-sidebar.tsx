"use client";

import React from "react";
import { PanelLeftClose, PanelLeft } from "lucide-react";

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
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-[4.25rem] left-0 z-30 hidden md:flex items-center justify-center h-8 w-8 rounded-r-md border border-l-0 bg-background shadow-sm text-muted-foreground hover:text-foreground transition-colors"
        title={open ? "Collapse sidebar" : "Expand sidebar"}
      >
        {open ? (
          <PanelLeftClose className="h-4 w-4" />
        ) : (
          <PanelLeft className="h-4 w-4" />
        )}
      </button>

      {/* Sidebar */}
      <aside
        className={`hidden shrink-0 border-r bg-sidebar md:block transition-all duration-200 ${
          open ? "w-64" : "w-0 overflow-hidden border-0"
        }`}
      >
        <div className="sticky top-14 h-[calc(100vh-3.5rem)] w-64">
          {children}
        </div>
      </aside>
    </>
  );
}
