"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface SidebarPage {
  id: string;
  title: string;
  slug: string;
  children?: SidebarPage[];
}

export interface SidebarSection {
  label: string;
  pages: SidebarPage[];
}

interface DocSidebarProps {
  spaceSlug: string;
  sections: SidebarSection[];
}

function SidebarItem({
  page,
  spaceSlug,
  depth = 0,
}: {
  page: SidebarPage;
  spaceSlug: string;
  depth?: number;
}) {
  const pathname = usePathname();
  const href = `/docs/${spaceSlug}/${page.slug}`;
  const isActive = pathname === href;
  const hasChildren = page.children && page.children.length > 0;
  const [expanded, setExpanded] = React.useState(
    isActive || (hasChildren && page.children!.some((c) => pathname.includes(c.slug)))
  );

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors",
          isActive
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {hasChildren && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-0.5 rounded hover:bg-muted"
          >
            <ChevronRight
              className={cn(
                "h-3.5 w-3.5 transition-transform",
                expanded && "rotate-90"
              )}
            />
          </button>
        )}
        {!hasChildren && <FileText className="h-3.5 w-3.5 shrink-0 opacity-50" />}
        <Link href={href} className="flex-1 truncate">
          {page.title}
        </Link>
      </div>
      {hasChildren && expanded && (
        <div>
          {page.children!.map((child) => (
            <SidebarItem
              key={child.id}
              page={child}
              spaceSlug={spaceSlug}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function DocSidebar({ spaceSlug, sections }: DocSidebarProps) {
  return (
    <ScrollArea className="h-full py-4">
      <div className="space-y-6 px-3">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.pages.map((page) => (
                <SidebarItem key={page.id} page={page} spaceSlug={spaceSlug} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
