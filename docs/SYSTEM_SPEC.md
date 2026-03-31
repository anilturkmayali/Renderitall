# Open Docs (Renderitall) — Complete System Specification

## Overview

Open Docs is a self-hosted, open-source documentation platform — a GitBook alternative. It allows users to create documentation websites by importing content from GitHub repositories and/or creating custom pages with a WYSIWYG editor. Multiple repositories can be combined into a single site with customizable navigation, branding, and templates.

**Live URL:** https://renderitall.vercel.app
**Repository:** https://github.com/anilturkmayali/Renderitall
**Primary use case:** International Data Spaces Association (IDSA) needs to replace their expensive GitBook at docs.internationaldataspaces.org with a self-hosted solution.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, Server Components) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui components |
| Database | PostgreSQL via Supabase (cloud-hosted) |
| ORM | Prisma 6 |
| Auth | NextAuth.js v5 (GitHub OAuth) |
| Editor | Tiptap (WYSIWYG rich text editor) |
| GitHub API | Octokit |
| Markdown | react-markdown + remark-gfm + rehype plugins |
| Hosting | Vercel (serverless) |
| Icons | Lucide React |

---

## Database Schema (15 models)

### Auth
- **User** — GitHub OAuth users (id, name, email, image)
- **Account** — OAuth provider accounts (stores GitHub access_token)
- **Session** — User sessions
- **VerificationToken** — Email verification tokens

### Organization & Team
- **Organisation** — Workspace container (name, slug, logo, logoDark, favicon)
- **OrgMember** — Team membership with roles (OWNER, ADMIN, EDITOR, REVIEWER)

### Sites & Content
- **Space** — A documentation site (name, slug, description, isPublic, primaryColor, accentColor, defaultTheme, headerLayout, customDomain, sslEnabled, seoTitle, seoDescription, ogImage, robotsIndex, analyticsId, customCss, footerLinks JSON for top menu)
- **Page** — Documentation page (title, slug, content, excerpt, status [DRAFT/PUBLISHED/ARCHIVED], source [NATIVE/GITHUB], position, parentId for hierarchy, frontmatter JSON, GitHub metadata: githubRepoId, githubPath, githubSha, commitSha, commitAuthor, commitDate, lastSyncedAt)
- **Revision** — Version history for pages (content snapshot, title, message, authorId)

### GitHub Integration
- **GitHubRepo** — Connected repository (owner, repo, slug, displayName, branch, docsPath, accessToken, homePageId, config JSON for excludedPageIds, sync status tracking: lastSyncAt, lastSyncStatus [IDLE/SYNCING/SUCCESS/ERROR], lastSyncError, pageCount)

### Navigation
- **NavItem** — Hierarchical navigation tree (label, type [PAGE/SECTION/LINK], pageId, url, position, parentId for nesting)

### Other
- **Snippet** — Reusable content blocks
- **PageTemplate** — Page templates
- **ChangeRequest** — Draft change workflow (status: OPEN/IN_REVIEW/APPROVED/REJECTED/PUBLISHED)
- **ChangeRequestPage** — Draft content within change requests
- **Comment** — Threaded comments with block-level anchoring
- **MediaFile** — Organization media library
- **Redirect** — URL redirects per space
- **ActivityLog** — Audit trail

---

## Features Implemented

### Admin Panel (7 sections in sidebar)

#### Dashboard (`/admin`)
- KPI cards: Total Pages, Sites, GitHub Repos (clickable, link to respective pages)
- Repo Sync Status panel (shows each repo with sync state, auto-resets stuck syncs after 5 min)
- Recent Pages list with status badges
- Activity log
- Quick action buttons: New Site, New Page

#### Sites (`/admin/spaces`)
- Create/delete documentation sites
- Template selection on creation (Classic, Modern, Minimal)
- Site cards showing page count, repo count, template, public/private badge
- Each site has a detail page (`/admin/spaces/[id]`) with 4 tabs:

**Content tab:**
- Connected repositories with Sync and Customize buttons
- Connect new repo (opens GitHub repo browser with org tabs and search)
- All pages list with search, "In Menu" badges
- Create new custom page link

**Menu tab:**
- **Top Bar Menu**: Add items (Repository section, Custom Page, Dropdown with sub-items, External Link). Reorder, remove. Mini preview of header. Save separately.
- **Sidebar Menu**: Add items from repos or custom pages, create sections, reorder, indent/outdent between sections. "Add entire repo" bulk import. Save publishes to live site.

**Appearance tab:**
- Logo upload (base64, stored on Organisation model, shows light/dark preview, remove/re-upload)
- Template picker (Classic/Modern/Minimal) with visual previews
- Primary color (6 presets + custom color picker)
- Header background color (accent color, with live mini-preview)
- Default theme (Light/Dark/Auto)
- Save All Appearance Changes button

**Settings tab:**
- Name, slug, description
- Custom domain (add/remove with CNAME DNS instructions, Vercel API integration)
- SEO (title, description)
- Custom CSS
- Danger zone (delete site)

#### Pages (`/admin/pages`)
- List all pages (custom + GitHub) with search and filter (All/Custom/GitHub)
- Click to edit, delete, preview link
- Status badges (published/draft), source badges (GitHub/Custom)
- "Create Page" button opens WYSIWYG editor

#### Editor (`/admin/editor`)
- Tiptap WYSIWYG editor with toolbar: bold, italic, strikethrough, code, highlight, headings (H1-H3), lists (bullet, ordered, task), code blocks with syntax highlighting, blockquotes, dividers, links, images, undo/redo
- Space selector dropdown
- Slug auto-generation from title
- Save Draft / Publish buttons (Publish is primary action)
- Preview link, delete button
- GitHub-sourced pages shown as read-only with notice

#### Repositories (`/admin/repositories`)
- List connected repos with page count, sync status, last sync date, error messages
- Connect Repo modal: GitHub repo browser with org tabs, search, branch/docsPath config
- Sync button per repo
- Customize button per repo → detail page (`/admin/repositories/[id]`):
  - Display name (how it appears in menus)
  - URL slug (URL path prefix for this repo's content)
  - Page list with Eye toggle (include/exclude each page)
  - "Set as Home" button per page
  - Include All / Exclude All quick actions
  - Search within repo pages

#### Team (`/admin/team`)
- Members list with avatar, name, email, role
- Role legend cards (Owner, Admin, Editor, Viewer with descriptions)
- Add Member modal: email input + role selector (Admin/Editor/Viewer)
- Change role via dropdown per member
- Remove member (with confirmation)
- Permission checks: only Owner/Admin can manage team

#### Settings (`/admin/settings`)
- GitHub account card (avatar, username, connected status)
- Permissions badges (Repository access, Organization access)
- Organizations list with avatars
- "Open GitHub Settings" button (direct link to grant org access)
- Sign out button

---

### Public Documentation Site (`/docs/[space]`)

#### Layout
- Sticky header with: logo (uploaded or auto-generated initial), site name, top navigation menu (flat links, repo links, dropdowns with hover), search (Ctrl+K), theme toggle
- Header supports colored background via accent color (white text auto-applied)
- Top menu items come from footerLinks JSON field on Space model
- Custom CSS injection
- CSS custom properties for theming (--site-primary, --site-accent)

#### Templates
- **Classic**: Collapsible left sidebar + content (max-w-4xl) + right table of contents
- **Modern**: Same as Classic but wider content (max-w-5xl), larger titles (text-4xl), prominent top nav
- **Minimal**: No persistent sidebar, centered content (max-w-3xl), navigation via floating hamburger menu only

#### Page Rendering
- Breadcrumbs (space > section > page)
- Page title + optional excerpt/description
- Metadata bar (last updated, author, "Edit this page" GitHub link)
- Full markdown rendering with:
  - GitHub Flavored Markdown (tables, strikethrough, task lists)
  - Syntax highlighting
  - Auto-linked headings with slugs
  - Custom callout blocks: [!NOTE], [!WARNING], [!TIP], [!DANGER]
  - Code blocks with copy-to-clipboard button
  - Image lightbox (click to zoom)
  - Expandable sections
  - External links open in new tab
  - Responsive table wrapper
- Previous / Next page navigation at bottom

#### Sidebar
- Built from NavItem model (sections with nested pages)
- Fallback: auto-generated from page hierarchy
- Multi-level slug resolution
- Active page highlighting, expandable sections
- Collapsible: collapse button at top, expand button when collapsed

#### Mobile
- Hamburger menu (floating button, bottom-left)
- Slide-in drawer with full navigation
- Responsive layout (sidebar hidden, TOC hidden, full-width content)

#### Search
- Ctrl+K / Cmd+K shortcut
- Modal overlay with search input
- Real-time results with 300ms debounce
- Ranked results: title > heading > content match
- Arrow key navigation + Enter to select

#### Page URL Resolution (4 strategies)
1. Exact slug match in space
2. Case-insensitive slug match
3. First slug segment matches a repo slug → load repo's home page
4. `{repoSlug}/{pageSlug}` → find page within specific repo

---

### Sync Engine

- Fetches repo tree via GitHub API (recursive)
- Finds and parses SUMMARY.md (GitBook-style) for navigation structure
- Fetches each markdown file content (skips per-file commit lookups for speed)
- Rewrites relative markdown links to work within docs reader
- Rewrites relative image URLs to raw.githubusercontent.com
- Upserts pages to database (spaceId + slug as unique key)
- Builds NavItem tree from SUMMARY.md or auto-generates from file structure
- Prevents concurrent syncs on same repo
- Falls back to org member's GitHub token if repo token is missing
- Logs activity on successful sync

### Performance & Caching
- ISR (Incremental Static Regeneration): revalidate = 60 on doc pages
- unstable_cache on: space (120s), page (60s), sidebar (120s), adjacent pages (60s)
- Supabase connection via transaction pooler with pgbouncer settings
- prisma generate runs as part of the Vercel build command

### SEO
- Dynamic sitemap.xml with all public spaces and published pages
- robots.txt allowing /docs/, blocking /admin/, /api/, /login
- Per-space OG meta tags, Twitter cards, custom title template
- Per-page individual title and description

### Security & Access
- Role hierarchy: Owner > Admin > Editor > Viewer
- Permission checks on team management APIs
- GitHub OAuth with repo + read:org scopes
- Webhook signature verification (HMAC SHA-256)
- Auth required for all admin routes

### Version History
- Auto-saves revision on every page edit
- Revisions API: list history, restore previous version
- Auto-saves current state before restoring (never lose data)

### Error Handling
- Admin error boundary with "Try Again" button
- Docs error boundary with "Try Again" and "Go Home"
- Loading skeleton for admin pages
- Stuck sync auto-reset after 5 minutes

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| DATABASE_URL | Supabase PostgreSQL pooler connection |
| DIRECT_URL | Supabase direct connection (for migrations) |
| NEXTAUTH_SECRET | NextAuth session encryption |
| NEXTAUTH_URL | App URL for NextAuth |
| AUTH_SECRET | NextAuth v5 secret |
| AUTH_URL | NextAuth v5 URL |
| GITHUB_CLIENT_ID | GitHub OAuth App client ID |
| GITHUB_CLIENT_SECRET | GitHub OAuth App client secret |
| VERCEL_TOKEN | (optional) Vercel API for custom domains |
| VERCEL_PROJECT_ID | (optional) Vercel project ID for domain API |

---

## Known Issues

1. GitHub org access requires manual grant via GitHub Settings
2. ISR cache (60s) delays admin changes on public site
3. Classic and Modern templates are visually similar
4. Draft pages return 404 on public site (by design, but can confuse users)
5. Sync can take 30+ seconds for repos with 40+ files
6. Logos stored as base64 in database (should use file storage for production)

---

## Features NOT Yet Implemented

**Phase 4 — Feature Parity:** Change requests/drafts, inline comments, PDF export, embedded content (YouTube/Figma), Mermaid diagrams, OpenAPI/Swagger rendering, page feedback widget, analytics dashboard, custom fonts, broken link detection

**Phase 5 — Differentiation:** AI-powered search, auto translations, real-time collaborative editing, Slack/Discord notifications, public REST API, import tools (Confluence/Notion/GitBook), SAML SSO, visitor authentication, white-label mode
