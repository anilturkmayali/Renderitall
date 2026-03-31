# Open Docs — Wireframe Brief for Balsamiq AI

## Product Summary

Open Docs is a documentation platform (like GitBook). Users create documentation websites by importing GitHub repositories and creating custom pages. An admin panel manages everything. A public-facing reader site renders the documentation beautifully.

The platform has two main interfaces:
1. **Admin Panel** — where site owners manage their documentation sites
2. **Public Docs Reader** — where end users read the documentation

---

## SCREENS TO WIREFRAME

---

### SCREEN 1: Admin — Dashboard

**Purpose:** Overview of the documentation platform.

**Layout:**
- Left sidebar navigation (fixed, 240px wide): Dashboard (active), Sites, Pages, Repositories, Team, Settings. Logo "Open Docs" at top. "Manage your sites" link at bottom.
- Top bar: theme toggle icon, user avatar + name, logout icon.
- Main content area:
  - Page title "Dashboard" with subtitle "Overview of your documentation platform."
  - Two action buttons top-right: "+ New Site", "+ New Page"
  - 3 KPI cards in a row: "Total Pages" (number + "X published" subtitle), "Sites" (number + "documentation sites"), "GitHub Repos" (number + "connected")
  - Two cards side by side below:
    - Left: "Repo Sync Status" — list of repos with green/red/amber status dot, repo name, page count, sync date. "View all" link.
    - Right: "Recent Pages" — list of page names with published/draft badge and site name. "View all" link.

---

### SCREEN 2: Admin — Sites List

**Purpose:** View and manage all documentation sites.

**Layout:**
- Same sidebar as Dashboard, "Sites" is active.
- Title "Sites" with subtitle. "+ Create Site" button top-right.
- Grid of site cards (2-3 per row):
  - Each card has: colored strip at top (site's primary color), site name (bold), template badge (Classic/Modern/Minimal), Public/Private badge, description text, stats row (X pages, Y repos), three buttons at bottom: "View" (external link), "Manage" (goes to site detail), trash icon (delete).

---

### SCREEN 3: Admin — Create Site Modal

**Purpose:** Create a new documentation site.

**Layout:**
- Modal overlay (centered, 500px wide):
  - Title "Create Site", subtitle "A site is a documentation website."
  - Form fields:
    - "Site Name" — text input, placeholder "e.g. IDS Knowledge Base"
    - "URL Slug" — text input with "/docs/" prefix label
    - "Description" — text input (optional)
    - "Template" — 3 clickable cards in a row, each with: mini layout preview (abstract rectangles showing sidebar/content arrangement), template name (Classic, Modern, Minimal), one-line description. Selected one has blue border.
  - Buttons: "Cancel" (outline), "Create Site" (primary blue)

---

### SCREEN 4: Admin — Site Detail (Content Tab)

**Purpose:** Manage a site's content — connected repos and pages.

**Layout:**
- Back arrow + site name as page title, "/docs/slug" as subtitle. "Preview" and "View Live" buttons top-right.
- 4 tabs below title: Content (active), Menu, Appearance, Settings
- Content tab shows:
  - Section "Connected Repositories" with "+ Connect Repo" button:
    - List of repo cards, each with: GitHub icon, "owner/repo" name, "X pages" badge (green if synced), branch + path info, "Customize" button, "Sync" button, trash icon
  - Section "Pages (N)" with search input and "+ New Page" button:
    - List of page rows: file icon, page title, /slug, "GitHub" or "Custom" badge, "In Menu" badge (green, if applicable), trash icon (on hover)

---

### SCREEN 5: Admin — Site Detail (Menu Tab)

**Purpose:** Build the top bar menu and sidebar menu.

**Layout:**
- Same tabs header as Screen 4, "Menu" tab active.
- Two sections stacked vertically:

**Top Bar Menu section:**
- Card with header "Top Bar Menu" and "+ Add Item" button.
- Description: "These links appear horizontally in the header bar."
- List of menu items, each row has: icon (GitHub/folder/link), item label, subtitle (URL or "Repository section" or "Dropdown - N items"), type badge (Repo/Dropdown/Link), up/down arrows, trash icon.
- Dropdown items show indented children below with border-left line.
- Mini preview bar at bottom showing how the header will look.
- "Save Top Menu" button.

**Sidebar Menu section:**
- Title "Sidebar Menu" with "+ Add Item" button and "Add entire repo..." dropdown.
- List of menu items:
  - Section items: folder icon, bold label, "Section" badge, up/down/trash buttons. Children indented below with colored border-left.
  - Page items: file icon, label, "Page" badge, up/down/indent-right/trash buttons.
  - At bottom of each section: "+ Add to [section name]" link.
- "Save Menu" button (appears when changes made).

---

### SCREEN 6: Admin — Add Menu Item Modal

**Purpose:** Add an item to top bar or sidebar menu.

**Layout:**
- Modal (400px wide):
  - Title "Add Menu Item" (or "Add to [section name]")
  - 4 type selector tabs in a pill-style row: Repository (GitHub icon), Custom (pen icon), Section (folder icon), Link (link icon). Selected one highlighted.
  - Content changes based on selected type:
    - **Repository**: "Repository" dropdown (shows connected repos with page counts), description text "Adds a tab that shows this repo's content."
    - **Custom**: "Page" dropdown (lists custom pages)
    - **Section**: "Section Name" text input, helper text "Sections group items under a heading."
    - **Link**: "Label" text input + "URL" text input
  - Buttons: "Cancel", "+ Add to Menu"

---

### SCREEN 7: Admin — Site Detail (Appearance Tab)

**Purpose:** Customize the visual look of the documentation site.

**Layout:**
- Same tabs header, "Appearance" tab active.
- Stacked cards (max-width 640px):

**Logo card:**
- Title "Logo" with description "Your logo appears in the top-left of the docs header."
- If no logo: dashed border upload area with upload icon, "Click to upload logo", "Recommended: 200x50px, PNG or SVG, max 2MB"
- If logo exists: logo preview on light background + logo preview on dark background + "Remove" button + "Upload different logo" link

**Template card:**
- Title "Layout Template" with description.
- 3 template cards in a row (each ~150px wide): abstract mini layout preview, template name (Classic/Modern/Minimal), one-line description. Selected has blue border + ring.

**Colors card:**
- Title "Colors"
- "Primary Color" label with description "Used for links, active states, sidebar highlights." Row of 6 color circles + color picker input + hex code display.
- "Header Background" label with description "Set a color for a branded header bar." "Default" pill button + same 6 color circles + color picker. If color selected: mini preview showing colored header bar with logo placeholder and menu items.

**Theme card:**
- Title "Default Theme" with description.
- 3 theme cards in a row: "Light" (White background), "Dark" (Dark background), "Auto" (Follow device setting). Selected has blue border.

- Full-width "Save All Appearance Changes" button at bottom.

---

### SCREEN 8: Admin — Site Detail (Settings Tab)

**Purpose:** Site configuration — general info, domain, SEO, danger zone.

**Layout:**
- Same tabs, "Settings" active. Max-width 640px.
- Stacked cards:

**General:** Name input, Slug input (with /docs/ prefix), Description input. Save button.

**Custom Domain:** If no domain: text input "docs.yourdomain.com" + "Add" button. If domain set: domain name displayed with "Active" label + "Remove" button. If just added: blue info box with DNS CNAME instructions (Type, Name, Value).

**SEO:** SEO Title input (placeholder = site name), SEO Description input. Save button.

**Custom CSS:** Monospace textarea with placeholder "/* Custom styles */". Save button.

**Danger Zone:** Red-bordered card. "Delete this site" label with description "All pages, repos, navigation permanently deleted." Red "Delete Site" button.

---

### SCREEN 9: Admin — Repository Customization

**Purpose:** Customize how a connected repository's content appears.

**Layout:**
- Back arrow + "owner/repo" as title with GitHub icon. Branch, path, page count, last sync info below.
- Top-right: "Sync" button, "GitHub" external link, "Save Changes" button (blue).

**Display Settings card:**
- "Display Name" input with description "How this repo appears in menus."
- "URL Slug" input with description showing the URL pattern "/docs/site/{slug}/..."

**Pages card:**
- Header: "Pages (X included, Y excluded)" with search input.
- Description: "Toggle pages on/off. Set one as the home page."
- List of pages, each row has:
  - Eye icon (green = included, gray = excluded). Click to toggle.
  - File icon + page title (strikethrough if excluded) + /slug below
  - "Home Page" green badge (if set as home) OR "Set as Home" ghost button
  - "Included"/"Excluded" badge
- Excluded rows are dimmed (opacity 40%).
- Quick action buttons below the list: "Include All", "Exclude All"

---

### SCREEN 10: Admin — Pages List

**Purpose:** View all pages across all sites.

**Layout:**
- Title "Pages" with "X custom pages, Y from GitHub" subtitle. "+ Create Page" button.
- Filter row: search input, 3 filter buttons (All, Custom, GitHub).
- Table-style list in a card:
  - Each row: file icon, page title (clickable, goes to editor), /slug below, "published"/"draft" badge, "GitHub"/"Custom" badge, date, external link icon + trash icon (on hover).

---

### SCREEN 11: Admin — Page Editor

**Purpose:** Create or edit a custom page with WYSIWYG editor.

**Layout:**
- Top bar: back arrow, "New Page" or "Edit Page" title, draft/published badge.
- Right side of top bar: "Preview" link, "Delete" (ghost), "Save Draft" (outline), "Publish" (primary blue).
- Below top bar: 3-column form row: "Title" input, "Slug" input, "Space" dropdown.
- Main area: Tiptap WYSIWYG editor:
  - Toolbar row with icon buttons: Bold, Italic, Strikethrough, Code, Highlight | H1, H2, H3 | Bullet list, Ordered list, Task list | Blockquote, Code block, Divider | Link, Image | Undo, Redo
  - Editor area below (white, min-height 400px) with placeholder "Start writing..."

---

### SCREEN 12: Admin — Team

**Purpose:** Manage team members and roles.

**Layout:**
- Title "Team" with subtitle. "+ Add Member" button (only for Owner/Admin).
- 4 role legend cards in a row: Owner (crown icon, amber), Admin (shield, blue), Editor (pen, green), Viewer (eye, gray). Each with role name and short description.
- Members card:
  - Header "Members (N)"
  - List of members, each row: avatar (round), name (bold), email below, role dropdown (Admin/Editor/Viewer) — or role badge for Owner, trash icon (not shown for Owner or self).

---

### SCREEN 13: Admin — Add Team Member Modal

**Purpose:** Invite a new team member.

**Layout:**
- Modal (400px):
  - Title "Add Team Member", subtitle "The user must have signed in with GitHub first."
  - "Email Address" input with mail icon.
  - "Role" — 3 selectable cards: Admin ("Full management"), Editor ("Edit content"), Viewer ("Read-only"). Selected has blue border.
  - Error message area (red box, if applicable, e.g. "No user found with that email").
  - Buttons: "Cancel", "+ Add to Team"

---

### SCREEN 14: Admin — Settings

**Purpose:** GitHub connection management.

**Layout:**
- Title "Settings" with subtitle.
- Card "GitHub Account":
  - If connected: avatar + name + @username + green "Connected" badge. "Sign out" ghost button.
  - Permissions section: two badges — "Repository access" (green check or red X), "Organization access" (green check or red X).
  - Organizations section: list of org rows (org avatar, org name, "Access granted" green badge). If no orgs: info box with numbered instructions (1. Click button below, 2. Find Renderitall, 3. Click Grant, 4. Refresh). "Open GitHub Settings" button.
  - If not connected: amber warning box with "Sign in with GitHub" button.

---

### SCREEN 15: Public Docs — Classic Template

**Purpose:** How end users read documentation (Classic layout).

**Layout:**
- **Header** (sticky, 56px): Logo image (or colored initial square) + site name, top navigation links (horizontal, with dropdown support on hover), search button "Search docs... Cmd+K", theme toggle moon/sun icon.
- **Left sidebar** (256px, collapsible): collapse "<<" button at top-right corner. Navigation sections with bold uppercase labels. Nested page links with file icons. Active page highlighted with colored left border + tinted background. Scrollable.
- **Main content** (centered, max-width 896px, with padding):
  - Breadcrumbs: Site Name > Section > Page Name
  - H1 page title (large, bold)
  - Optional page description (muted text)
  - Metadata line: "Last updated X ago" + "by Author" + "Edit this page" link (right-aligned)
  - Markdown content: headings, paragraphs, code blocks (with copy button on hover), tables, lists, callout boxes (colored left border, tinted background), images (clickable to zoom)
  - Bottom: Previous/Next cards (two columns, full width, with arrows and page titles)
- **Right sidebar** (224px, hidden below 1280px): "On this page" heading, list of H2/H3 headings, scroll-spy active highlighting, clickable to smooth-scroll.

---

### SCREEN 16: Public Docs — Modern Template

**Purpose:** Same as Classic but with wider content and prominent top nav.

**Layout:**
- Same as Classic but:
  - Header has colored background (accent color), white text
  - Top nav links are more prominent
  - Content area is wider (max-width 1024px)
  - Page titles are larger (text-4xl)

---

### SCREEN 17: Public Docs — Minimal Template

**Purpose:** Distraction-free reading experience.

**Layout:**
- **Header**: Same as Classic/Modern (logo, site name, search, theme toggle)
- **No left sidebar** — content is centered
- **Main content** (centered, max-width 768px): Same content rendering as Classic
- **No right TOC sidebar**
- **Floating hamburger menu button** (bottom-left corner): Opens slide-in drawer with full navigation on click

---

### SCREEN 18: Public Docs — Search Modal

**Purpose:** Full-text search across documentation.

**Layout:**
- Dark backdrop overlay
- Centered modal (500px wide, max-height 500px):
  - Search input with magnifying glass icon, "Search documentation..." placeholder, X close button, loading spinner (when searching)
  - Results area below:
    - "Pages" section heading
    - List of result rows: file icon, page title (bold), excerpt text below (truncated, with matching terms), highlighted row for selected result
  - Footer: keyboard hints — "↑↓ navigate", "↵ select", "esc close"

---

### SCREEN 19: Public Docs — Top Menu Dropdown

**Purpose:** Show how dropdown menus work in the header.

**Layout:**
- Same header as Screen 15/16
- One of the top nav items has a dropdown arrow "▾"
- Below it: floating white card (224px wide) with shadow, rounded corners:
  - List of links (repo names or page names), each on its own row, hover highlights

---

### SCREEN 20: Public Docs — Mobile View

**Purpose:** Responsive layout for phones.

**Layout (375px wide):**
- Header: compressed — logo + site name, search icon only, theme toggle
- No sidebar visible
- Full-width content area with smaller padding
- Floating round button bottom-left (hamburger icon)
- When button tapped: slide-in drawer from left (280px wide) covering the page, with close X at top-right, full navigation tree inside

---

### SCREEN 21: Connect Repository Modal

**Purpose:** Browse and connect a GitHub repository.

**Layout:**
- Modal (640px wide, 85vh max height):
  - Title "Connect Repository", X close button.
  - **Step 1 (repo selection):**
    - Org filter tabs: "All" | "org-name-1" | "org-name-2" (horizontal row, scrollable)
    - Search input with magnifying glass
    - Scrollable repo list: each row has GitHub icon, "owner/repo" name (bold), lock icon if private, description (one line, truncated), language + stars + default branch in small text
    - Click a repo to select it → moves to Step 2
  - **Step 2 (configuration):**
    - Selected repo shown in a gray box with "Change" button
    - Two inputs side by side: "Branch" (text, default from repo), "Docs Path" (text, default "/")
    - Buttons: "Cancel", "Connect & Sync" (primary)

---

## DESIGN NOTES

- **Color scheme**: Blue primary (#3b82f6) by default, customizable per site
- **Typography**: Inter font, clean and modern
- **Spacing**: Generous whitespace, 24px padding in main areas
- **Cards**: Rounded corners (12px), subtle borders, light shadows
- **Badges**: Small, pill-shaped, color-coded (green=success, amber=warning, red=error, gray=neutral)
- **Icons**: Lucide icon set, 16-20px, consistent throughout
- **Dark mode**: Full support, togglable via header button
- **Responsive**: Admin panel hides sidebar on mobile (not yet implemented). Docs reader fully responsive.
