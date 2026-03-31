import Link from "next/link";
import { Github, FileText, Layers, Paintbrush, ArrowRight, Search, Globe } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center text-white font-bold text-xs">R</div>
            <span className="font-bold text-lg">Renderitall</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login">
              <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
                Sign in
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-4 pt-20 pb-16 text-center sm:px-6">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Turn GitHub repos into<br />documentation sites
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
          Connect your repositories, customize the look, and publish a
          professional documentation website. Your markdown is the source of truth.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/login">
            <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
              Get started
              <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
          <a href="https://github.com/anilturkmayali/Renderitall" target="_blank" rel="noopener noreferrer">
            <button className="inline-flex items-center gap-2 rounded-lg border px-6 py-3 text-sm font-medium hover:bg-muted transition-colors">
              <Github className="h-4 w-4" />
              View source
            </button>
          </a>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-4xl px-4 pb-20 sm:px-6">
        <h2 className="text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-10">
          How it works
        </h2>
        <div className="grid gap-8 sm:grid-cols-3">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Github className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-1">1. Connect repos</h3>
            <p className="text-sm text-muted-foreground">
              Link your GitHub repositories. Markdown files are imported automatically.
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Paintbrush className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-1">2. Customize</h3>
            <p className="text-sm text-muted-foreground">
              Choose a template, set colors, upload your logo, and build your navigation menus.
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-1">3. Publish</h3>
            <p className="text-sm text-muted-foreground">
              Your docs site is live. Connect a custom domain. Content stays in sync with GitHub.
            </p>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {[
              { icon: Github, title: "GitHub sync", desc: "Import markdown from any repo. Push changes to GitHub and your docs update." },
              { icon: Layers, title: "Multiple repos per site", desc: "Combine content from several repositories into one unified documentation site." },
              { icon: Search, title: "Full-text search", desc: "Built-in search across all your documentation. Keyboard shortcut included." },
              { icon: FileText, title: "Custom pages", desc: "Create pages with a rich text editor alongside your GitHub-sourced content." },
              { icon: Paintbrush, title: "Branding", desc: "Logo, colors, templates, dark mode. Make it look like your own product." },
              { icon: Globe, title: "Custom domains", desc: "Point your own domain to your docs site with automatic SSL." },
            ].map((f) => (
              <div key={f.title} className="flex gap-4 rounded-lg border bg-background p-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-4 py-6 sm:px-6 text-xs text-muted-foreground">
          <span>Renderitall</span>
          <a href="https://github.com/anilturkmayali/Renderitall" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
