"use client";

import { useState } from "react";
import {
  BookOpen, Github, Layers, FileText, Paintbrush, Globe, Menu,
  Users, Settings, ChevronRight, CheckCircle2, ArrowRight,
  RefreshCw, Search, Eye, Home, FolderOpen, Link2, PenTool,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const sections = [
  { id: "overview", label: "Overview", icon: BookOpen },
  { id: "quick-start", label: "Quick Start", icon: ArrowRight },
  { id: "import", label: "Import from GitHub", icon: Github },
  { id: "sites", label: "Sites", icon: Layers },
  { id: "menus", label: "Building Menus", icon: Menu },
  { id: "custom-pages", label: "Custom Pages", icon: FileText },
  { id: "appearance", label: "Appearance & Branding", icon: Paintbrush },
  { id: "domains", label: "Custom Domains", icon: Globe },
  { id: "auto-sync", label: "Auto-sync", icon: RefreshCw },
  { id: "team", label: "Team Management", icon: Users },
  { id: "tips", label: "Tips & Best Practices", icon: CheckCircle2 },
];

export default function GuidePage() {
  const [active, setActive] = useState("overview");

  return (
    <div className="flex gap-6 max-w-6xl">
      {/* Left nav */}
      <nav className="hidden lg:block w-56 shrink-0">
        <div className="sticky top-20 space-y-0.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-3">Guide</p>
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => { setActive(s.id); document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" }); }}
              className={`flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm transition-colors ${active === s.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
            >
              <s.icon className="h-3.5 w-3.5 shrink-0" />
              {s.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-12 pb-20">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Guide</h1>
          <p className="text-muted-foreground mt-1">Learn how to use Renderitall to create professional documentation sites.</p>
        </div>

        {/* ─── Overview ─── */}
        <section id="overview" className="scroll-mt-20">
          <h2 className="text-2xl font-bold mb-4">Overview</h2>
          <p className="text-muted-foreground mb-6">Renderitall turns your GitHub repositories into beautiful documentation websites. Here&apos;s the big picture:</p>

          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950"><Github className="h-6 w-6 text-blue-600" /></div>
                <h3 className="font-semibold mb-1">1. Import</h3>
                <p className="text-xs text-muted-foreground">Connect GitHub repos and choose which markdown files to import.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-950"><Layers className="h-6 w-6 text-green-600" /></div>
                <h3 className="font-semibold mb-1">2. Organize</h3>
                <p className="text-xs text-muted-foreground">Create a Site, build menus, and arrange your content.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950"><Globe className="h-6 w-6 text-purple-600" /></div>
                <h3 className="font-semibold mb-1">3. Publish</h3>
                <p className="text-xs text-muted-foreground">Your docs site is live. Add branding and a custom domain.</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">Key Concept: Separation of Content and Presentation</h3>
              <p className="text-sm text-muted-foreground">
                <strong>Repositories</strong> are your content sources — import once, use anywhere.
                <strong> Sites</strong> are the presentation layer — they pull content from repos and custom pages, then display it with your branding and navigation.
                This means you can use the same imported content across multiple sites.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* ─── Quick Start ─── */}
        <section id="quick-start" className="scroll-mt-20">
          <h2 className="text-2xl font-bold mb-4">Quick Start</h2>
          <p className="text-muted-foreground mb-6">Get your first documentation site up in 5 minutes:</p>

          <div className="space-y-4">
            {[
              { step: 1, title: "Connect your GitHub", desc: "Go to Settings and make sure your GitHub account is connected. If you need organization repos, grant access there.", icon: Settings },
              { step: 2, title: "Import a repository", desc: "Go to Import from GitHub → Connect Repo. Browse your repos, select one, choose which files to import.", icon: Github },
              { step: 3, title: "Create a Site", desc: "Go to Sites → Create Site. Pick a name and template.", icon: Layers },
              { step: 4, title: "Build your menu", desc: "In your Site → Menu tab, add items to the top bar and sidebar. You can add repos, custom pages, sections, and links.", icon: Menu },
              { step: 5, title: "Customize the look", desc: "In Appearance tab, upload a logo, pick colors, and choose a template.", icon: Paintbrush },
              { step: 6, title: "View your site", desc: "Click 'View Live' to see your documentation site!", icon: Eye },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  {item.step}
                </div>
                <div className="flex-1 pt-0.5">
                  <h3 className="font-semibold text-sm">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Import from GitHub ─── */}
        <section id="import" className="scroll-mt-20">
          <h2 className="text-2xl font-bold mb-4">Import from GitHub</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Connecting a Repository</h3>
              <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                <li>Go to <strong>Import from GitHub</strong> in the sidebar</li>
                <li>Click <strong>Connect Repo</strong></li>
                <li>Use the tabs at the top to switch between your personal repos and organization repos</li>
                <li>Search or browse to find the repo you want</li>
                <li>Click on it, set the <strong>branch</strong> (usually &quot;main&quot;) and <strong>docs path</strong> (use &quot;/&quot; for the entire repo)</li>
                <li>Click <strong>Connect & Choose Files</strong></li>
                <li>You&apos;ll see a list of all markdown files — check the ones you want to import</li>
                <li>Click <strong>Import</strong> and watch the progress bar</li>
              </ol>
            </div>

            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
              <CardContent className="pt-4">
                <h4 className="font-semibold text-sm mb-1">💡 Tip: You can import selectively</h4>
                <p className="text-xs text-muted-foreground">You don&apos;t have to import everything. Uncheck files you don&apos;t need (like LICENSE, CONTRIBUTING, etc.). You can always import more later by clicking Import on the repo.</p>
              </CardContent>
            </Card>

            <div>
              <h3 className="font-semibold mb-2">Customizing a Repository</h3>
              <p className="text-sm text-muted-foreground mb-2">Click <strong>Customize</strong> on any connected repo to:</p>
              <ul className="space-y-1.5 text-sm text-muted-foreground list-disc list-inside">
                <li><strong>Display Name</strong> — how the repo appears in menus (e.g., &quot;IDSA Rulebook&quot; instead of &quot;International-Data-Spaces-Association/IDSA-Rulebook&quot;)</li>
                <li><strong>URL Slug</strong> — the URL path for this repo&apos;s pages</li>
                <li><strong>Include/Exclude pages</strong> — toggle individual pages on or off</li>
                <li><strong>Set Home Page</strong> — which page loads when someone navigates to this repo section</li>
                <li><strong>Auto-sync</strong> — enable to automatically update content when changes are pushed to GitHub</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Re-importing / Updating Content</h3>
              <p className="text-sm text-muted-foreground">Click the <strong>Import</strong> button on any connected repo. The system shows which files are New, Changed, or Unchanged. Changed files are pre-selected so you can quickly update only what&apos;s new.</p>
            </div>
          </div>
        </section>

        {/* ─── Sites ─── */}
        <section id="sites" className="scroll-mt-20">
          <h2 className="text-2xl font-bold mb-4">Sites</h2>
          <p className="text-muted-foreground mb-4">A Site is a documentation website. It has its own URL, branding, and navigation.</p>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Creating a Site</h3>
              <ol className="space-y-1.5 text-sm text-muted-foreground list-decimal list-inside">
                <li>Go to <strong>Sites</strong> → click <strong>Create Site</strong></li>
                <li>Enter a name and URL slug</li>
                <li>Choose a template (Classic, Modern, or Minimal)</li>
                <li>Click Create</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Site Detail — 4 Tabs</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { tab: "Content", desc: "See all available pages (from repos + custom). Set the Homepage.", icon: FileText },
                  { tab: "Menu", desc: "Build the top bar navigation and left sidebar menu.", icon: Menu },
                  { tab: "Appearance", desc: "Logo, colors, template, theme.", icon: Paintbrush },
                  { tab: "Settings", desc: "Name, domain, SEO, custom CSS.", icon: Settings },
                ].map((t) => (
                  <div key={t.tab} className="flex gap-3 rounded-lg border p-4">
                    <t.icon className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-sm">{t.tab}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Setting a Homepage</h3>
              <p className="text-sm text-muted-foreground">
                In the <strong>Content</strong> tab, hover over any page and click <strong>Set as Home</strong>. This page will be the first thing visitors see when they go to your site&apos;s URL.
              </p>
            </div>
          </div>
        </section>

        {/* ─── Menus ─── */}
        <section id="menus" className="scroll-mt-20">
          <h2 className="text-2xl font-bold mb-4">Building Menus</h2>
          <p className="text-muted-foreground mb-4">Each site has two menus: the top bar and the sidebar.</p>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2"><Badge variant="outline">Top Bar Menu</Badge></h3>
              <p className="text-sm text-muted-foreground mb-2">Horizontal links in the header. Supports dropdowns. Great for organizing repositories or major sections.</p>
              <p className="text-sm text-muted-foreground mb-2">You can add 4 types of items:</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { type: "Repository", desc: "Links to a repo section. Opens the repo's home page.", icon: Github },
                  { type: "Custom Page", desc: "Links to a page you created.", icon: PenTool },
                  { type: "Dropdown", desc: "A menu with sub-items (hover to expand).", icon: FolderOpen },
                  { type: "External Link", desc: "Any URL — opens in a new tab.", icon: Link2 },
                ].map((t) => (
                  <div key={t.type} className="flex gap-2 rounded border p-3">
                    <t.icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div><span className="text-sm font-medium">{t.type}</span><p className="text-xs text-muted-foreground">{t.desc}</p></div>
                  </div>
                ))}
              </div>
            </div>

            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
              <CardContent className="pt-4">
                <h4 className="font-semibold text-sm mb-1">💡 Creating sub-menus in the top bar</h4>
                <p className="text-xs text-muted-foreground">Add items, then click the <strong>↳</strong> (indent) button on an item to make it a sub-item of the one above. The parent automatically becomes a dropdown. Use <strong>↰</strong> (outdent) to move it back to the top level.</p>
              </CardContent>
            </Card>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2"><Badge variant="outline">Sidebar Menu</Badge></h3>
              <p className="text-sm text-muted-foreground mb-2">Vertical navigation on the left side of the docs. Supports sections with nested pages.</p>
              <ul className="space-y-1.5 text-sm text-muted-foreground list-disc list-inside">
                <li>Click <strong>Add Item</strong> to add pages one by one</li>
                <li>Use <strong>+ Add entire repo</strong> to import all pages from a repo as a section</li>
                <li>Use <strong>↳</strong> to indent items into the section above</li>
                <li>Click on any item name to <strong>rename</strong> it</li>
                <li>Don&apos;t forget to click <strong>Save Menu</strong> after making changes</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ─── Custom Pages ─── */}
        <section id="custom-pages" className="scroll-mt-20">
          <h2 className="text-2xl font-bold mb-4">Custom Pages</h2>
          <p className="text-muted-foreground mb-4">Create your own content pages that aren&apos;t linked to any GitHub repository.</p>
          <ul className="space-y-1.5 text-sm text-muted-foreground list-disc list-inside">
            <li>Go to <strong>Custom Pages</strong> → <strong>Create Page</strong></li>
            <li>Write your content using the rich text editor (supports headings, lists, code blocks, images, links, tables)</li>
            <li>Click <strong>Publish</strong> to make it available (Draft pages are not visible on the live site)</li>
            <li>Add the page to any Site&apos;s menu to make it accessible</li>
          </ul>
        </section>

        {/* ─── Appearance ─── */}
        <section id="appearance" className="scroll-mt-20">
          <h2 className="text-2xl font-bold mb-4">Appearance & Branding</h2>
          <p className="text-muted-foreground mb-4">Make your documentation site look like your own product.</p>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Templates</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { name: "Classic", desc: "Left sidebar + content + table of contents. Like GitBook." },
                  { name: "Modern", desc: "Wider content area, larger titles. Best with a colored header." },
                  { name: "Minimal", desc: "No sidebar. Centered content. Clean and distraction-free." },
                ].map((t) => (
                  <div key={t.name} className="rounded-lg border p-4">
                    <h4 className="font-semibold text-sm">{t.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Branding Options</h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground list-disc list-inside">
                <li><strong>Logo</strong> — appears in the header (recommended: 200x50px, PNG or SVG)</li>
                <li><strong>Primary Color</strong> — used for links, active states, and the default icon</li>
                <li><strong>Header Background</strong> — set a color to create a branded header bar (text turns white automatically)</li>
                <li><strong>Theme</strong> — Light, Dark, or Auto (follows visitor&apos;s device setting)</li>
                <li><strong>Custom CSS</strong> — for advanced styling</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ─── Domains ─── */}
        <section id="domains" className="scroll-mt-20">
          <h2 className="text-2xl font-bold mb-4">Custom Domains</h2>
          <p className="text-muted-foreground mb-4">Point your own domain to your documentation site.</p>
          <ol className="space-y-1.5 text-sm text-muted-foreground list-decimal list-inside">
            <li>Go to your Site → <strong>Settings</strong> tab</li>
            <li>Under Custom Domain, enter your domain (e.g., <code>docs.yourcompany.com</code>)</li>
            <li>Click <strong>Add</strong></li>
            <li>Add a <strong>CNAME</strong> record with your DNS provider pointing to the given value</li>
            <li>Wait for DNS to propagate (can take up to 48 hours, usually much faster)</li>
            <li>SSL is provisioned automatically</li>
          </ol>
        </section>

        {/* ─── Auto-sync ─── */}
        <section id="auto-sync" className="scroll-mt-20">
          <h2 className="text-2xl font-bold mb-4">Auto-sync</h2>
          <p className="text-muted-foreground mb-4">Keep your documentation automatically in sync with GitHub.</p>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">How it works</h3>
              <p className="text-sm text-muted-foreground">When auto-sync is enabled, a GitHub webhook is set up on the repository. Every time someone pushes changes, GitHub notifies Renderitall, and the changed files are automatically re-imported.</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Enabling auto-sync</h3>
              <ol className="space-y-1.5 text-sm text-muted-foreground list-decimal list-inside">
                <li>Go to <strong>Import from GitHub</strong> → click <strong>Customize</strong> on the repo</li>
                <li>Find the <strong>Auto-sync</strong> section</li>
                <li>Click <strong>Enable auto-sync</strong></li>
              </ol>
              <p className="text-xs text-muted-foreground mt-2">Note: You need admin access to the GitHub repository for auto-sync to work. If you don&apos;t have admin access, you can still manually import updates.</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">What gets updated</h3>
              <p className="text-sm text-muted-foreground">Only files that actually changed (based on SHA comparison) are re-imported. Unchanged files are skipped, making updates fast.</p>
            </div>
          </div>
        </section>

        {/* ─── Team ─── */}
        <section id="team" className="scroll-mt-20">
          <h2 className="text-2xl font-bold mb-4">Team Management</h2>
          <p className="text-muted-foreground mb-4">Invite others to help manage your documentation.</p>

          <div className="grid gap-3 sm:grid-cols-2 mb-4">
            <div className="rounded-lg border p-4">
              <h4 className="font-semibold text-sm mb-1">Admin</h4>
              <p className="text-xs text-muted-foreground">Full access. Can manage team, sites, repos, content, and settings.</p>
            </div>
            <div className="rounded-lg border p-4">
              <h4 className="font-semibold text-sm mb-1">Editor</h4>
              <p className="text-xs text-muted-foreground">Can edit content, manage repos, and design sites. Cannot manage team or delete sites.</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">To add a team member, go to <strong>Team</strong> → <strong>Add Member</strong>. Enter their email address (they must have signed in with GitHub at least once).</p>
        </section>

        {/* ─── Tips ─── */}
        <section id="tips" className="scroll-mt-20">
          <h2 className="text-2xl font-bold mb-4">Tips & Best Practices</h2>

          <div className="space-y-3">
            {[
              { title: "Use SUMMARY.md in your repos", desc: "If your repo has a SUMMARY.md file (GitBook-style), the navigation structure will be automatically imported." },
              { title: "Set a README as your home page", desc: "After importing a repo, go to Customize and set the README as the home page — it's the natural entry point." },
              { title: "Rename menu items", desc: "Click on any item name in the Menu tab to rename it. The content stays the same, only the display name changes." },
              { title: "Use dropdowns for organization", desc: "Group related repos or pages under a dropdown in the top bar. Makes navigation cleaner for sites with lots of content." },
              { title: "Preview before publishing", desc: "Use the Preview button on the Site detail page to check how things look before going live." },
              { title: "Search with Ctrl+K", desc: "Your visitors can press Ctrl+K (or Cmd+K on Mac) to instantly search across all your documentation." },
              { title: "The sidebar is collapsible", desc: "On Classic and Modern templates, visitors can collapse the sidebar for a wider reading area." },
            ].map((tip) => (
              <div key={tip.title} className="flex gap-3 rounded-lg border p-4">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">{tip.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
