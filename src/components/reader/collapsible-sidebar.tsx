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
      {/* Sidebar */}
      <aside
        className={`hidden shrink-0 border-r bg-sidebar md:block transition-all duration-200 relative ${
          open ? "w-64" : "w-0 overflow-hidden border-r-0"
        }`}
      >
        <div className="sticky top-14 h-[calc(100vh-3.5rem)] w-64">
          {children}
        </div>
      </aside>

      {/* Toggle button — positioned at the edge of the sidebar */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed z-30 hidden md:flex items-center justify-center h-7 w-7 rounded-full border bg-background shadow-md text-muted-foreground hover:text-foreground hover:shadow-lg transition-all ${
          open ? "left-[248px]" : "left-3"
        }`}
        style={{ top: "4.25rem" }}
        title={open ? "Collapse sidebar" : "Expand sidebar"}
      >
        {open ? (
          <PanelLeftClose className="h-3.5 w-3.5" />
        ) : (
          <PanelLeft className="h-3.5 w-3.5" />
        )}
      </button>
    </>
  );
}
