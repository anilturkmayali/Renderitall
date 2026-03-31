# Renderitall — System Specification

## Overview

Renderitall is a self-hosted, open-source documentation platform — a GitBook alternative. Users import content from GitHub repositories and create custom pages, then assemble them into documentation websites (Sites) with customizable navigation, branding, and templates.

**Key architectural principle:** Repositories are independent content sources. They are imported once and their content can be used across any number of Sites. Sites are the presentation layer — they pull content from repos and custom pages, and control how it's displayed.

**Live URL:** https://renderitall.vercel.app
**Repository:** https://github.com/anilturkmayali/Renderitall

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, Server Components) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL via Supabase |
| ORM | Prisma 6 |
| Auth | NextAuth.js v5 (GitHub OAuth) |
| Editor | Tiptap WYSIWYG |
| GitHub API | Octokit |
| Markdown | react-markdown + remark-gfm + rehype plugins |
| Hosting | Vercel (serverless) |

---

## Architecture

### Core Concepts

1. **Repositories** — GitHub repos connected to the platform. Content is imported (synced) from them. Repos are independent and not tied to any specific Site.

2. **Pages** — Individual content units. Two types:
   - **GitHub pages** — imported from repositories during sync
   - **Custom pages** — created with the built-in WYSIWYG editor

3. **Sites** — Documentation websites. Each Site has its own URL, branding, navigation menus, and template. Sites reference pages (from any repo or custom) through their menu configuration.

4. **Navigation** — Two levels per Site:
   - **Top bar menu** — horizontal links in the header (repos, pages, dropdowns, external links)
   - **Sidebar menu** — vertical navigation tree (sections with nested pages)

### Data Flow

```
GitHub Repos → [Import/Sync] → Pages (stored in DB)
                                    ↓
Custom Editor → [Create] → Pages (stored in DB)
                                    ↓
Sites → [Menu Builder] → References pages → [Render] → Public docs website
```

---

## Admin Panel

### Sidebar Navigation
- **Dashboard** — KPIs, sync status, recent pages
- **Sites** — Create/manage documentation websites
- **Pages** — Create/edit custom pages
- **Repositories** — Connect/sync/customize GitHub repos
- **Team** — Manage team members and roles
- **Settings** — GitHub account connection

### Dashboard (`/admin`)
- KPI cards: Total Pages, Sites, GitHub Repos
- Repo Sync Status panel
- Recent Pages list
- Quick actions: New Site, New Page

### Sites (`/admin/spaces`)
- Create/delete Sites with template selection
- Each Site detail page has 4 tabs:

**Content tab:**
- Shows ALL available pages from ALL repos and custom pages
- Search and filter
- Set Homepage (which page loads at the Site's root URL)
- "In Menu" badges show which pages are added to navigation

**Menu tab:**
- **Top Bar Menu**: Add repos, pages, dropdowns, external links. Reorder, remove. Save separately.
- **Sidebar Menu**: Add pages, sections. Reorder, indent/outdent. "Add entire repo" bulk import.

**Appearance tab:**
- Logo upload (with light/dark preview)
- Template picker: Classic (sidebar+content+TOC), Modern (wider, prominent header), Minimal (centered, no sidebar)
- Primary color (presets + custom)
- Header background color
- Default theme (Light/Dark/Auto)

**Settings tab:**
- Name, slug, description
- Custom domain with DNS instructions
- SEO (title, description)
- Custom CSS
- Danger zone (delete)

### Pages (`/admin/pages`)
- List all pages (custom + GitHub) with search and filter
- Create custom pages via WYSIWYG editor (Tiptap)
- Editor supports: bold, italic, headings, lists, code blocks, images, links, tables

### Repositories (`/admin/repositories`)
- Connect GitHub repos (browse personal + organization repos with search)
- Multi-step connection flow: Browse → Configure (branch, docs path) → Choose files to import → Import with progress
- Sync existing repos with file selection modal
- Customize each repo: display name, URL slug, include/exclude pages, set home page
- Repos are NOT tied to any Site — content is shared

### Team (`/admin/team`)
- Two roles: Admin (full access), Editor (edit content, can't manage team or delete sites)
- Add members by email (must have signed in with GitHub first)
- Change roles, remove members

### Settings (`/admin/settings`)
- GitHub account info (avatar, username, connected status)
- Organization access with step-by-step instructions
- Direct link to GitHub OAuth app settings for granting org access
- Sign out

### User Menu (top-right dropdown)
- User info (avatar, name, email)
- Quick links: Dashboard, Team, Settings
- Theme switcher (Light/Dark/Auto)
- Sign out

---

## Public Documentation Site (`/docs/[site-slug]`)

### Layout
- Sticky header: logo, site name, top navigation menu, search (Ctrl+K), theme toggle
- Header supports colored background (accent color)
- Top menu supports: flat links, repo section links, dropdowns with sub-items
- Custom CSS injection

### Templates
- **Classic**: Collapsible left sidebar + content (max-w-4xl) + right TOC
- **Modern**: Wider content (max-w-5xl), larger titles, prominent top nav
- **Minimal**: No sidebar, centered content (max-w-3xl), hamburger menu only

### Page Rendering
- Breadcrumbs, title, excerpt, metadata (last updated, author, edit on GitHub link)
- Markdown: GFM, syntax highlighting, callouts, code copy button, image lightbox, expandable sections, responsive tables
- Previous/Next navigation

### Page URL Resolution (4 strategies)
1. Exact slug match
2. Case-insensitive match
3. Repo slug → repo's home page
4. `{repoSlug}/{pageSlug}` → page within repo

### Search
- Ctrl+K modal with real-time results
- Ranked: title > heading > content match
- Keyboard navigation

### Mobile
- Hamburger menu (floating button)
- Slide-in navigation drawer
- Full responsive layout

---

## Sync Engine

### Import Flow (new)
1. User clicks "Sync" or "Connect & Choose Files"
2. System fetches file tree from GitHub (single API call)
3. User sees file list with checkboxes (New/Changed/Unchanged badges)
4. User selects which files to import
5. Each file is imported individually (own API call — no timeout issues)
6. Progress bar shows real-time count
7. System marks sync as complete

### Key Features
- Files fetched one at a time — bulletproof on serverless (no timeouts)
- Unchanged files detected by SHA comparison (skipped by default)
- SUMMARY.md parsed for navigation structure
- Relative links rewritten to work within the docs reader
- Relative images rewritten to raw.githubusercontent.com URLs
- DB operations wrapped in retry logic for connection drops

---

## Performance & Caching
- ISR: revalidate=60 on doc pages
- unstable_cache: space (120s), page (60s), sidebar (120s)
- Supabase connection via transaction pooler
- prisma generate in build command

## SEO
- Dynamic sitemap.xml and robots.txt
- Per-space and per-page OG meta tags
- Custom title templates

## Security
- GitHub OAuth with repo + read:org scopes
- Role-based access (Admin/Editor)
- Webhook signature verification (HMAC SHA-256)
- Auth required on all admin routes

## Version History
- Auto-saves revision on every page edit
- Restore API with auto-backup before restore

## Error Handling
- Admin and docs error boundaries
- Loading skeletons
- Stuck sync auto-reset (3 min timeout)

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| DATABASE_URL | Supabase PostgreSQL pooler |
| DIRECT_URL | Supabase direct connection |
| NEXTAUTH_SECRET | Session encryption |
| AUTH_SECRET | NextAuth v5 secret |
| GITHUB_CLIENT_ID | OAuth App client ID |
| GITHUB_CLIENT_SECRET | OAuth App client secret |

---

## Not Yet Implemented

**Phase 4:** Change requests, inline comments, PDF export, embeds, Mermaid diagrams, OpenAPI rendering, analytics, custom fonts, broken link detection

**Phase 5:** AI search, translations, real-time editing, Slack notifications, public API, import tools, SAML SSO, visitor auth, white-label
