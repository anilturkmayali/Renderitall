"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  LayoutDashboard,
  FileText,
  Github,
  Settings,
  Layers,
  PenTool,
  Globe,
  Navigation,
  LayoutTemplate,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Spaces", href: "/admin/spaces", icon: Layers },
  { label: "GitHub Repos", href: "/admin/github", icon: Github },
  { label: "Site Builder", href: "/admin/builder", icon: LayoutTemplate },
  { label: "Navigation", href: "/admin/navigation", icon: Navigation },
  { label: "Pages", href: "/admin/pages", icon: FileText },
  { label: "Editor", href: "/admin/editor", icon: PenTool },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r bg-sidebar md:flex md:flex-col">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <BookOpen className="h-5 w-5 text-primary" />
        <span className="font-semibold">Open Docs</span>
        <span className="ml-auto rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
          Admin
        </span>
      </div>

      <ScrollArea className="flex-1">
        <nav className="space-y-1 p-3">
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="border-t p-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Globe className="h-4 w-4" />
          View live site
        </Link>
      </div>
    </aside>
  );
}
