# Open Docs

**A GitBook Alternative — Built for IDSA, Offered to the World**

Open Docs is a self-hostable, open-source documentation platform that publishes beautiful documentation sites driven by GitHub repositories. It also includes a built-in editor for supplementary native pages.

## Features

- **GitHub-First** — Connect any GitHub repository. Markdown files become beautiful docs automatically.
- **Rich Markdown** — Tables, code blocks with syntax highlighting, callouts, math, task lists, and more.
- **Full-Text Search** — Ctrl+K search across all documentation.
- **Built-in Editor** — Notion-like Tiptap editor with slash commands for native pages.
- **Fully Brandable** — Custom logos, colours, fonts, dark/light mode, custom domains.
- **Multi-Space** — Host multiple documentation sites from one installation.
- **Team Collaboration** — Invite editors, reviewers, admins. Change requests and approval workflows.
- **Self-Hostable** — Own your data. Deploy on your infrastructure or use hosted service.
- **Instant Sync** — Webhook-driven updates. Push to GitHub, see it live in seconds.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL via Prisma |
| Auth | NextAuth.js (GitHub OAuth) |
| Editor | Tiptap |
| GitHub API | Octokit |
| State | Zustand |
| Icons | Lucide React |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- GitHub OAuth App credentials

### 1. Clone & Install

```bash
git clone https://github.com/anilturkmayali/Renderitall.git
cd Renderitall
npm install
```

### 2. Environment Setup

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random secret for NextAuth (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Your app URL (e.g. `http://localhost:3000`) |
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret |
| `GITHUB_WEBHOOK_SECRET` | Secret for verifying GitHub webhooks |

### 3. Database Setup

```bash
npx prisma generate
npx prisma db push
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the landing page.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Landing page
│   ├── login/             # GitHub OAuth login
│   ├── admin/             # Admin panel (protected)
│   │   ├── page.tsx       # Dashboard
│   │   ├── pages/         # Page management
│   │   ├── github/        # GitHub repo connections
│   │   ├── editor/        # Tiptap content editor
│   │   └── ...
│   ├── docs/[space]/      # Reader site
│   │   └── [...slug]/     # Dynamic doc pages
│   └── api/
│       ├── auth/          # NextAuth handlers
│       ├── search/        # Full-text search
│       └── webhook/       # GitHub webhook receiver
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── admin/             # Admin sidebar & topbar
│   ├── reader/            # Doc sidebar, TOC, Markdown renderer
│   ├── editor/            # Tiptap editor
│   └── providers/         # Theme provider
├── lib/
│   ├── auth.ts            # NextAuth config
│   ├── prisma.ts          # Prisma client
│   ├── github.ts          # Octokit helpers
│   └── utils.ts           # Tailwind utilities
└── prisma/
    └── schema.prisma      # Database schema
```

## Content Model

- **GitHub Content** — Primary documentation sourced from GitHub repos (read-only in admin).
- **Native Pages** — Supplementary content created with the built-in Tiptap editor.
- **Spaces** — Independent documentation sites, each with its own branding and repos.
- **Collections** — Groups of related spaces.

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in Vercel
3. Set environment variables
4. Deploy

### Self-Hosted

1. Build: `npm run build`
2. Start: `npm start`
3. Ensure PostgreSQL is accessible
4. Configure reverse proxy (nginx/caddy) for custom domains

## License

Apache 2.0 — See [LICENSE](LICENSE) for details.

## Contributing

Contributions welcome! Please open an issue first to discuss proposed changes.

---

Built by [IDSA](https://internationaldataspaces.org). Open source, forever.
