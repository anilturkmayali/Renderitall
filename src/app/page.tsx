import Link from "next/link";
import {
  BookOpen,
  Github,
  Search,
  Zap,
  Globe,
  Shield,
  Code2,
  Palette,
  Users,
  ArrowRight,
  Moon,
  Sun,
  CheckCircle2,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const features = [
  {
    icon: Github,
    title: "GitHub-First",
    description:
      "Connect any GitHub repository. Your Markdown files become beautiful documentation pages — automatically.",
  },
  {
    icon: BookOpen,
    title: "Rich Markdown Rendering",
    description:
      "Tables, code blocks with syntax highlighting, callouts, math notation, task lists, and more.",
  },
  {
    icon: Search,
    title: "Full-Text Search",
    description:
      "Lightning-fast search across all your documentation. Ctrl+K to search, just like you'd expect.",
  },
  {
    icon: Code2,
    title: "Built-in Editor",
    description:
      "Create landing pages and supplementary content with a Notion-like editor — slash commands included.",
  },
  {
    icon: Palette,
    title: "Fully Brandable",
    description:
      "Custom logos, colours, fonts, dark mode. Make it yours with custom domains and SSL.",
  },
  {
    icon: Globe,
    title: "Multi-Space",
    description:
      "Host multiple documentation sites from one installation. Each with its own branding and repos.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Invite editors, reviewers, and admins. Change requests, comments, and approval workflows.",
  },
  {
    icon: Shield,
    title: "Self-Hostable",
    description:
      "Own your data. Deploy on your own infrastructure or use our hosted service.",
  },
  {
    icon: Zap,
    title: "Instant Sync",
    description:
      "Webhook-driven updates. Push to GitHub, see it live in seconds. No manual deploys needed.",
  },
];

const comparisons = [
  { feature: "GitHub sync", openDocs: true, gitbook: true },
  { feature: "Multi-repo support", openDocs: true, gitbook: "Paid" },
  { feature: "Custom domain", openDocs: true, gitbook: "Paid" },
  { feature: "Built-in editor", openDocs: true, gitbook: true },
  { feature: "Self-hostable", openDocs: true, gitbook: false },
  { feature: "Open source", openDocs: true, gitbook: false },
  { feature: "Full data ownership", openDocs: true, gitbook: false },
  { feature: "AI search", openDocs: "Planned", gitbook: "Paid" },
  { feature: "Price", openDocs: "Free", gitbook: "$$$" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Open Docs</span>
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            <Link
              href="#features"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="#comparison"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Compare
            </Link>
            <Link
              href="https://github.com/anilturkmayali/Renderitall"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              target="_blank"
            >
              GitHub
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/admin">
              <Button size="sm">
                Get Started
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted px-4 py-1.5 text-sm">
              <Star className="h-4 w-4 text-amber-500" />
              <span>Open Source GitBook Alternative</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Beautiful docs,{" "}
              <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                powered by GitHub
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl">
              Publish stunning documentation sites from your GitHub repositories.
              Full Markdown support, instant sync, built-in editor, and complete
              branding control. Free and open source.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/admin">
                <Button size="lg" className="gap-2">
                  Start for free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link
                href="https://github.com/anilturkmayali/Renderitall"
                target="_blank"
              >
                <Button variant="outline" size="lg" className="gap-2">
                  <Github className="h-4 w-4" />
                  View on GitHub
                </Button>
              </Link>
            </div>
          </div>

          {/* Preview mockup */}
          <div className="mx-auto mt-16 max-w-5xl">
            <div className="rounded-xl border bg-card shadow-2xl">
              <div className="flex items-center gap-2 border-b px-4 py-3">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
                <div className="ml-4 flex-1 rounded-md bg-muted px-3 py-1 text-xs text-muted-foreground">
                  docs.yourcompany.com
                </div>
              </div>
              <div className="flex min-h-[400px]">
                {/* Sidebar mockup */}
                <div className="hidden w-64 border-r bg-sidebar p-4 md:block">
                  <div className="space-y-1">
                    <div className="rounded-md bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
                      Getting Started
                    </div>
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      Installation
                    </div>
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      Configuration
                    </div>
                    <div className="mt-4 px-3 text-xs font-semibold uppercase text-muted-foreground">
                      Guides
                    </div>
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      GitHub Integration
                    </div>
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      Custom Domains
                    </div>
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      Branding
                    </div>
                    <div className="mt-4 px-3 text-xs font-semibold uppercase text-muted-foreground">
                      API Reference
                    </div>
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      REST API
                    </div>
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      Webhooks
                    </div>
                  </div>
                </div>
                {/* Content mockup */}
                <div className="flex-1 p-8">
                  <div className="space-y-4">
                    <div className="h-8 w-64 rounded bg-muted" />
                    <div className="h-4 w-full rounded bg-muted" />
                    <div className="h-4 w-5/6 rounded bg-muted" />
                    <div className="h-4 w-4/6 rounded bg-muted" />
                    <div className="mt-6 h-32 rounded-lg border bg-muted/50 p-4">
                      <div className="h-3 w-24 rounded bg-primary/30" />
                      <div className="mt-3 space-y-2">
                        <div className="h-3 w-full rounded bg-muted" />
                        <div className="h-3 w-3/4 rounded bg-muted" />
                      </div>
                    </div>
                    <div className="h-4 w-full rounded bg-muted" />
                    <div className="h-4 w-2/3 rounded bg-muted" />
                  </div>
                </div>
                {/* TOC mockup */}
                <div className="hidden w-48 p-4 lg:block">
                  <div className="text-xs font-semibold uppercase text-muted-foreground">
                    On this page
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="h-3 w-24 rounded bg-primary/30" />
                    <div className="h-3 w-20 rounded bg-muted" />
                    <div className="h-3 w-28 rounded bg-muted" />
                    <div className="h-3 w-16 rounded bg-muted" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need for great documentation
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A complete documentation platform — from GitHub sync to custom branding,
            with a powerful editor for content that lives outside your repos.
          </p>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-lg border bg-card p-6 transition-colors hover:border-primary/50"
            >
              <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-2.5">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Table */}
      <section
        id="comparison"
        className="border-y bg-muted/30 py-24"
      >
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Why Open Docs?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              The features you need, without the price tag.
            </p>
          </div>
          <div className="mt-12 overflow-hidden rounded-lg border bg-card">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Feature
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-primary">
                    Open Docs
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">
                    GitBook
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((row, i) => (
                  <tr key={row.feature} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                    <td className="px-6 py-3 text-sm">{row.feature}</td>
                    <td className="px-6 py-3 text-center">
                      {row.openDocs === true ? (
                        <CheckCircle2 className="mx-auto h-5 w-5 text-green-500" />
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {row.openDocs}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-center">
                      {row.gitbook === true ? (
                        <CheckCircle2 className="mx-auto h-5 w-5 text-green-500" />
                      ) : row.gitbook === false ? (
                        <span className="text-sm text-muted-foreground">—</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {row.gitbook}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-gradient-to-r from-primary to-blue-600 p-12 text-center text-white">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Ready to build better docs?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
            Get started in minutes. Connect your GitHub repos, customise your
            branding, and publish.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/admin">
              <Button
                size="lg"
                variant="secondary"
                className="gap-2 bg-white text-primary hover:bg-white/90"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link
              href="https://github.com/anilturkmayali/Renderitall"
              target="_blank"
            >
              <Button
                size="lg"
                variant="outline"
                className="gap-2 border-white/30 text-white hover:bg-white/10"
              >
                <Github className="h-4 w-4" />
                Star on GitHub
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="font-semibold">Open Docs</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built by{" "}
              <Link
                href="https://internationaldataspaces.org"
                target="_blank"
                className="underline underline-offset-4 hover:text-foreground"
              >
                IDSA
              </Link>
              . Open source under Apache 2.0.
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="https://github.com/anilturkmayali/Renderitall"
                target="_blank"
                className="text-muted-foreground hover:text-foreground"
              >
                <Github className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
