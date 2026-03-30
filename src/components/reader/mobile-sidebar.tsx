"use client";

import React from "react";
import { Menu, X } from "lucide-react";
import { DocSidebar, type SidebarSection } from "./doc-sidebar";

interface MobileSidebarProps {
  spaceSlug: string;
  sections: SidebarSection[];
}

export function MobileSidebar({ spaceSlug, sections }: MobileSidebarProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      {/* Hamburger button — visible only on mobile */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden flex items-center justify-center rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Drawer overlay */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />

          {/* Drawer */}
          <div className="absolute inset-y-0 left-0 w-72 bg-sidebar border-r shadow-xl flex flex-col animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between h-14 px-4 border-b">
              <span className="font-semibold text-sm">Navigation</span>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden" onClick={() => setOpen(false)}>
              <DocSidebar spaceSlug={spaceSlug} sections={sections} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
