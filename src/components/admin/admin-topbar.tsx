"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  LogOut, User, Settings, Moon, Sun, Monitor, ChevronDown,
  Github, Shield, HelpCircle, Layers,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";

interface AdminTopbarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function AdminTopbar({ user }: AdminTopbarProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      <div />
      <div className="flex items-center gap-2" ref={dropdownRef}>
        {/* User button */}
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors"
        >
          {user.image ? (
            <img src={user.image} alt={user.name || ""} className="h-7 w-7 rounded-full" />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
              <User className="h-4 w-4" />
            </div>
          )}
          <span className="hidden text-sm font-medium sm:inline max-w-[120px] truncate">
            {user.name || user.email}
          </span>
          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {/* Dropdown menu */}
        {open && (
          <div className="absolute top-12 right-4 w-64 rounded-xl border bg-background shadow-xl z-50 overflow-hidden">
            {/* User info */}
            <div className="px-4 py-3 border-b bg-muted/30">
              <div className="flex items-center gap-3">
                {user.image ? (
                  <img src={user.image} alt="" className="h-10 w-10 rounded-full border" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center"><User className="h-5 w-5" /></div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{user.name || "User"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email || ""}</p>
                </div>
              </div>
            </div>

            {/* Navigation links */}
            <div className="py-1.5">
              <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors">
                <Layers className="h-4 w-4 text-muted-foreground" />
                Dashboard
              </Link>
              <Link href="/admin/team" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors">
                <Shield className="h-4 w-4 text-muted-foreground" />
                Team
              </Link>
              <Link href="/admin/settings" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors">
                <Settings className="h-4 w-4 text-muted-foreground" />
                Settings
              </Link>
            </div>

            {/* Theme switcher */}
            <div className="border-t px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Theme</p>
              <div className="flex gap-1 rounded-lg bg-muted p-1">
                <button
                  onClick={() => setTheme("light")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium flex-1 justify-center transition-colors ${
                    theme === "light" ? "bg-background shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  <Sun className="h-3 w-3" />
                  Light
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium flex-1 justify-center transition-colors ${
                    theme === "dark" ? "bg-background shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  <Moon className="h-3 w-3" />
                  Dark
                </button>
                <button
                  onClick={() => setTheme("system")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium flex-1 justify-center transition-colors ${
                    theme === "system" ? "bg-background shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  <Monitor className="h-3 w-3" />
                  Auto
                </button>
              </div>
            </div>

            {/* Links */}
            <div className="border-t py-1.5">
              <a href="https://github.com/anilturkmayali/Renderitall" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <Github className="h-4 w-4" />
                GitHub repo
              </a>
              <a href="https://github.com/anilturkmayali/Renderitall/issues" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <HelpCircle className="h-4 w-4" />
                Report an issue
              </a>
            </div>

            {/* Sign out */}
            <div className="border-t py-1.5">
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 w-full transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
