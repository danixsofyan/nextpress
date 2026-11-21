# NextPress

[![CI](https://github.com/danixsofyan/nextpress/actions/workflows/ci.yml/badge.svg)](https://github.com/danixsofyan/nextpress/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

An open-source WordPress alternative built on Next.js 15, TypeScript, and PostgreSQL. Familiar WordPress-style administration, a typed REST API, and a built-in MCP server so AI agents can manage your content.

Runs free on [Vercel](https://vercel.com) + [Supabase](https://supabase.com).

**Live demo:** https://nextpress-app.vercel.app · **Docs:** https://nextpress-app.vercel.app/docs ([source](docs/))

## Features

### Admin panel

One app, one deployment: the admin panel lives at `/admin` on the same domain, like `/wp-admin`.

- **Email** through any SMTP provider: lost password, user invitations, and new comment notifications
- **First-run setup**: the first visit to `/admin` creates the administrator account, then public sign-up closes
- **Dashboard** with content stats, Activity (scheduled, recently published, recent comments), Quick Draft, and a **Visit site** link
- **Post editor** modeled on WordPress:
  - Tiptap rich-text editor
  - Permalink bar with inline slug editing
  - Publish box: status, visibility (public, private, sticky), scheduled publish date, preview, save draft, move to trash
  - Revisions panel to restore earlier versions
  - Featured image from the media library or an upload
  - Categories and tags panels, with new tags created inline
  - SEO panel with Google snippet preview and keyphrase highlighting
  - Screen Options to show or hide panels, remembered per browser
- **Pages**, **Media library**, **Menus** (with dropdown submenus), **Categories & tags**
- **Comments** with moderation (Pending, Approved, Spam, Trash), bulk actions, and **Settings → Discussion**
- **Lists everywhere** share one data table: search, status filters with counts, sortable columns, pagination, select all, and bulk actions. Search, filter, and page live in the URL, so views can be bookmarked
- **Users** with roles (Administrator, Editor, Author), add/edit/delete, password generator with strength meter, and a **Profile** page for every user
- **Settings** (each tab has its own URL, e.g. `/admin/settings?tab=reading`):
  - **General**: site title, tagline, timezone, date and time formats (WordPress format characters)
  - **Discussion**: allow comments, hold comments for approval
  - **Reading**: latest posts or a static homepage, posts per page, feed length, full text or excerpt in feeds, discourage search engines
  - **Branding**: custom logo, site icon (favicon), default social (Open Graph) image
  - **SEO**: default meta description, custom `robots.txt`
  - **Privacy**: create or choose a Privacy Policy page, linked in the site footer
  - **API**: create, list, and revoke API keys
- **Tools → Import**: WordPress export files (WXR) and RSS/Atom feeds (Blogger, Medium, Substack, Ghost, and others)
- **Tools → Site Health**: database, migrations, Redis, storage, HTTPS, indexing, spam protection, and version checks
- **Tools → Export**: download all content, posts, or pages as a WordPress export file (WXR)
- **Appearance → Themes**: switch themes, or open a live preview of another theme that only you see
- **Appearance → Customize**: colors, font, and corner radius per theme with a live preview, Reset, and Export/Import JSON. Saved in the database and applied without a deploy, plus **Additional CSS** for the whole site
- **Appearance → Widgets**: blog sidebar and footer widgets (Search, Recent Posts, Categories, Tag Cloud, Text, Links), reordered with up and down buttons
- **Plugins**: activate, deactivate, and configure plugins (Google Analytics 4, Meta Pixel, Cloudflare Turnstile, Google reCAPTCHA, Sign in with Google), filtered by All, Active, and Inactive
- **Trash** for posts and pages with restore and permanent delete, an append-only **audit log**, and a **Donations** list with donor names and messages
- **Content and Blocks panels** in the page editor collapse independently
- Light / dark / system admin color scheme

### Public site

- Blog with pagination, single post pages, and pages at `/{slug}`
- Category, tag, and author archives (`/category/{slug}`, `/tag/{slug}`, `/author/{id}`), bylines, and site search at `/search`
- Dark mode by default with a light toggle remembered per visitor, plus blog sidebar and footer widgets
- Developer documentation at `/docs` when `NEXTPRESS_DOCS=true`, rendered from the Markdown files in `docs/` (the same files GitHub shows)
- **Block-based pages**: hero, features, steps, stats, code, table, FAQ, call to action, latest posts, donations, Lottie animation, YouTube/Vimeo/Spotify embeds, reusable patterns, and rich text, rendered by the active theme. Any page, including the homepage, can be a landing page
- Admin bar for signed-in users (Dashboard, New, Edit Post, Log out)
- Dynamic Open Graph images at `/og`, canonical URLs, and `BlogPosting`, `BreadcrumbList`, `FAQPage`, and `WebSite` JSON-LD
- RSS feed at `/feed.xml`, `sitemap.xml` (posts, pages, categories, tags, docs), and `robots.txt` that welcomes AI crawlers
- Built for AI answer engines (GEO/AEO): `llms.txt` and `llms-full.txt` generated from your content, and a Markdown copy of every post at `/blog/<slug>.md`

### API & AI

- REST API with an OpenAPI 3.0 spec and an interactive [Scalar](https://scalar.com) reference at `/api/docs`
- MCP server (Streamable HTTP) so AI agents can write posts **and build whole landing pages** from blocks, set the homepage, the navigation, and the site identity
- API keys managed in the admin, stored hashed, with last-used tracking

### Security

- Role-based access on every admin page and admin API route
- Session cookies are `HttpOnly`, `SameSite=Strict`, and `Secure` over HTTPS
- Post and page HTML is sanitized on write, whether it comes from the editor, the REST API, MCP, or an import
- Login and sign-up are rate limited
- Content Security Policy, HSTS, and `X-Frame-Options` on every response; admin responses are `no-store` and `noindex`
- Optional isolated admin domain via `ADMIN_URL`
- Row level security enabled on every table, so the Supabase Data API cannot read NextPress data

See [SECURITY.md](SECURITY.md) for the security model and how to report a vulnerability.

## Themes, blocks, and AI

NextPress separates three concerns so that an AI agent can design pages without breaking your site:

| Layer      | Who writes it               | What it controls                                                                                                          |
| ---------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Theme**  | Developers (React)          | How everything looks: layout, typography, how each block renders                                                          |
| **Style**  | Administrators or AI agents | Colors, font, and corner radius of the active theme, set in Appearance → Customize                                        |
| **Blocks** | Editors or AI agents (JSON) | What a page contains: an ordered list of hero, features, steps, stats, code, table, FAQ, CTA, posts, and rich-text blocks |
| **MCP**    | AI agents                   | The hands: create pages from blocks, set the homepage and navigation, publish posts                                       |

AI agents never write raw HTML, CSS, or JavaScript into your site. Blocks are validated (links must be `/`, `#`, `http(s)://`, or `mailto:`; icons come from a fixed set), rich text is sanitized, and every theme renders the same blocks in its own style. Switch themes and every AI-built page restyles itself.

### Build a landing page with an AI agent

Connect your agent (see below), then ask it something like:

> Build a landing page for my bakery with a hero, three features, opening hours as a table, an FAQ, and a call to action. Make it the homepage and add Blog and Contact to the navigation.

The agent calls `get_block_spec`, then `create_page` with blocks, `set_homepage`, and `set_navigation`.

### Write articles that Google and AI answer engines can use

Ask your agent something like:

> Write an article answering "How long does sourdough take to rise?" for my bakery blog and publish it.

The agent calls `get_writing_guide` first, so the post leads with a direct answer, uses question headings, lists, and tables, and ends with a short FAQ. NextPress then handles the technical side automatically:

| For                      | What NextPress adds                                                                                                                                      |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Google (SEO)             | Canonical URL, meta tags, Open Graph image, `BlogPosting` and `BreadcrumbList` JSON-LD, sitemap with last-modified dates                                 |
| Answer engines (AEO)     | `FAQPage` JSON-LD built from question headings and FAQ blocks, so answers can be quoted directly                                                         |
| Generative engines (GEO) | `llms.txt`, `llms-full.txt`, and `/blog/<slug>.md` serve clean Markdown to ChatGPT, Claude, Perplexity, and other AI crawlers, which `robots.txt` allows |

## Roles

| Capability                        | Administrator | Editor | Author |
| --------------------------------- | :-----------: | :----: | :----: |
| Posts and media                   |       ✓       |   ✓    |   ✓    |
| Pages, categories, tags, menus    |       ✓       |   ✓    |        |
| Users, settings, API keys, import |       ✓       |        |        |

The first account is always an Administrator. The last Administrator cannot be deleted or demoted, and nobody can change their own role.

## Tech stack

| Layer     | Technology                                          |
| --------- | --------------------------------------------------- |
| Framework | Next.js 15 App Router, React 19                     |
| Language  | TypeScript (strict)                                 |
| Database  | PostgreSQL (Supabase) + Drizzle ORM                 |
| Auth      | Better Auth (admin plugin for users and roles)      |
| API       | Hono v4 + `@hono/zod-openapi`, Scalar API reference |
| AI agents | MCP SDK (`@modelcontextprotocol/sdk`)               |
| Editor    | Tiptap v2                                           |
| UI        | shadcn/ui + Tailwind CSS v4                         |
| Tooling   | pnpm 11, ESLint, Prettier, Vitest                   |

## Project structure

NextPress is a single Next.js project: one `package.json`, one deploy.

```
src/
  app/             routes: public site, /admin, /docs, /api
  components/      admin and site components, ui/ (shadcn/ui)
  core/            Drizzle schema, database client, types, zod validators
  server/          REST API (Hono + OpenAPI), MCP server, repositories
  lib/             auth, roles, settings, storage, themes registry, docs
  themes/
    engine/        ThemeConfig interface, formatDate, themeStyleVars
    default/       reference theme (cards, sans-serif)
    editorial/     magazine theme that reuses the default blocks
drizzle/           SQL migrations and seed.sql
docs/              documentation, also served at /docs
public/            static files
```

## Quick start

**Requirements:** Node.js 24+, pnpm 11+, a PostgreSQL database (for example a free Supabase project)

```bash
git clone https://github.com/danixsofyan/nextpress.git
cd nextpress
pnpm install

cp .env.example .env.local
# Fill in the values (see Environment variables below)

DATABASE_URL=... pnpm db:migrate
pnpm dev
```

- Public site: http://localhost:3000
- Documentation: http://localhost:3000/docs (with `NEXTPRESS_DOCS=true`)
- Admin panel: http://localhost:3000/admin (the first visit creates your administrator account)

## Environment variables

All variables are documented in [`.env.example`](.env.example). Site title, logo, timezone, and other site options are set in the admin under Settings, not in the environment.

| Variable                                                        | Required  | Description                                                                                              |
| --------------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                                  | yes       | PostgreSQL connection string                                                                             |
| `NEXT_PUBLIC_SITE_URL`                                          | yes       | Public URL of the site, no trailing slash                                                                |
| `BETTER_AUTH_SECRET`                                            | yes       | Session signing secret, at least 32 characters                                                           |
| `NEXT_PUBLIC_SITE_NAME`                                         | no        | Fallback site name until a Site Title is saved, default `NextPress`                                      |
| `NEXTPRESS_API_KEY`                                             | no        | Extra API key from the environment; keys are normally created in the admin                               |
| `NEXTPRESS_DOCS`                                                | no        | `true` serves this repository's developer documentation at `/docs`, default `false`                      |
| `SUMOPOD_API_KEY`                                               | no        | Enables the `donate` block (QRIS donations through SumoPod)                                              |
| `ADMIN_URL`                                                     | no        | Serve the admin panel only on its own domain                                                             |
| `REDIS_URL`                                                     | no        | Shared rate limiting across instances                                                                    |
| `STORAGE_DRIVER`                                                | no        | `local` (default, development) or `s3`                                                                   |
| `S3_ENDPOINT`                                                   | with `s3` | S3 endpoint without bucket                                                                               |
| `S3_REGION`                                                     | no        | `auto` (default) for R2, bucket region for AWS                                                           |
| `S3_BUCKET`                                                     | with `s3` | Bucket name                                                                                              |
| `S3_ACCESS_KEY_ID`                                              | with `s3` | Access key                                                                                               |
| `S3_SECRET_ACCESS_KEY`                                          | with `s3` | Secret key                                                                                               |
| `S3_PUBLIC_URL`                                                 | no        | Public bucket URL. Leave empty to keep the bucket private and serve files from `/media/…` on your domain |
| `MAX_UPLOAD_SIZE_MB`                                            | no        | Upload limit, default `4`                                                                                |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | no        | Any SMTP provider. Turns on lost-password emails, user invitations, and comment notifications            |
| `TURNSTILE_SECRET_KEY`, `RECAPTCHA_SECRET_KEY`                  | no        | Secret for the Cloudflare Turnstile or Google reCAPTCHA plugin                                           |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`                      | no        | OAuth client for the Sign in with Google plugin                                                          |

Generate secrets with `openssl rand -base64 32`.

### Isolated admin domain

By default the admin panel is served at `/admin` on the public domain, like WordPress. For stricter setups, set `ADMIN_URL=https://admin.yourdomain.com` and point that domain at the same deployment:

| URL                     | Result      |
| ----------------------- | ----------- |
| `yourdomain.com/`       | Public site |
| `yourdomain.com/admin`  | 404         |
| `admin.yourdomain.com/` | Admin panel |

Session cookies are then bound to the admin domain, so the public site and the admin panel no longer share an origin.

### Stateless by design

No instance keeps state on its own server, so every instance is disposable and you can scale horizontally:

- Content, users, sessions, and settings live in PostgreSQL.
- Media lives in any S3-compatible storage (Cloudflare R2, AWS S3, MinIO, Supabase Storage, Backblaze B2). The bucket can stay private: files are served from your own domain at `/media/…` with long-lived CDN caching.
- Rate limits live in Redis when `REDIS_URL` is set.
- `GET /api/health` checks the database and Redis, for load balancers and uptime monitors.

## Scripts

| Command            | Description                                                                                                                |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `pnpm dev`         | Run the site, admin panel, and docs at http://localhost:3000                                                               |
| `pnpm build`       | Production build                                                                                                           |
| `pnpm start`       | Serve the production build                                                                                                 |
| `pnpm typecheck`   | Type-check                                                                                                                 |
| `pnpm test`        | Run unit tests with Vitest                                                                                                 |
| `pnpm lint`        | Lint with ESLint (Next.js core web vitals + TypeScript)                                                                    |
| `pnpm format`      | Format with Prettier (`pnpm format:check` only checks)                                                                     |
| `pnpm db:generate` | Generate a migration from schema changes                                                                                   |
| `pnpm db:migrate`  | Apply migrations (needs `DATABASE_URL`)                                                                                    |
| `pnpm db:seed`     | Add default categories, tags, and settings (safe to rerun)                                                                 |
| `pnpm db:roles`    | Create or update the least-privilege `nextpress_app` role and its RLS policies (`DATABASE_URL` = owner, `APP_DB_PASSWORD`) |

## Deploy to Vercel

1. Import this repository as a Vercel project. No root directory or build settings are needed.
2. Add the environment variables from the table above, with `STORAGE_DRIVER=s3`.
3. Prepare the production database with the owner connection string:
   - `DATABASE_URL=<owner> pnpm db:migrate`
   - `DATABASE_URL=<owner> pnpm db:seed`
   - `DATABASE_URL=<owner> APP_DB_PASSWORD=<random 24+ chars> pnpm db:roles`

   Then set the app's `DATABASE_URL` to the pooler URL of the `nextpress_app` role (Supabase: user `nextpress_app.<project-ref>` on the transaction pooler, port 6543), and pick a Vercel function region next to the database in `vercel.json`.

4. Deploy, then open `/admin` right away to create your administrator account.

Vercel detects Next.js and pnpm automatically. Run `pnpm db:migrate` again whenever an update adds a migration.

## API & MCP

| Endpoint            | Description                                      |
| ------------------- | ------------------------------------------------ |
| `/docs`             | Documentation (rendered from the `docs/` folder) |
| `/api/docs`         | Interactive API reference (Scalar)               |
| `/api/openapi.json` | OpenAPI 3.0 spec                                 |
| `/api/mcp`          | MCP server (Streamable HTTP)                     |
| `/api/health`       | Health check (no API key needed)                 |
| `/feed.xml`         | RSS 2.0 feed                                     |

Create a key in **Admin → Settings → API** (`/admin/settings?tab=api`) and send it as `X-Api-Key: <key>` with every API and MCP request. Keys are stored hashed, shown once, and can be revoked at any time.

### MCP tools

| Tool                                                   | What it does                                                                |
| ------------------------------------------------------ | --------------------------------------------------------------------------- |
| `get_writing_guide`                                    | How to write posts that rank in Google and get quoted by AI answer engines  |
| `get_block_spec`                                       | Describes every block type, its fields, icons, and examples                 |
| `list_pages`, `get_page`                               | Read pages and their blocks                                                 |
| `create_page`, `update_page`, `delete_page`            | Build and edit pages from blocks                                            |
| `set_homepage`                                         | Show the latest posts or a page on the homepage                             |
| `set_navigation`                                       | Replace the header navigation                                               |
| `get_widgets`, `set_widgets`                           | Read and replace the blog sidebar and footer widgets                        |
| `update_site_identity`                                 | Site title, tagline, default meta description                               |
| `create_post`, `update_post`, `list_posts`, `get_post` | Write and manage blog posts                                                 |
| `create_taxonomy`                                      | Create categories and tags                                                  |
| `list_themes`, `set_theme`, `update_theme_style`       | List installed themes, activate one, customize its colors, font, and radius |
| `get_site_config`, `get_theme_spec`                    | Read settings and the theme interface                                       |

### Connect an MCP client

```json
{
  "mcpServers": {
    "nextpress": {
      "url": "https://your-site.com/api/mcp",
      "headers": { "X-Api-Key": "your-key" }
    }
  }
}
```

## Building a theme

A theme is a folder in `src/themes/` that exports a `ThemeConfig` from `@/themes/engine`:

```ts
import { Blocks } from '@/themes/default'
import { defineTheme } from '@/themes/engine'

export const theme = defineTheme({
  name: 'my-theme',
  label: 'My Theme',
  description: 'What makes this theme different',
  version: '1.0.0',
  defaultStyle: {
    primary: '#0f172a',
    background: '#ffffff',
    foreground: '#0f172a',
    accent: '#f1f5f9',
    font: 'sans',
    radius: 'medium',
  },
  supports: ['blog'],
  slots: {
    Layout,
    Header,
    Footer,
    PostCard,
    PostList,
    PostDetail,
    Blocks,
    CategoryPage,
    TagPage,
    HomePage,
  },
})
```

Themes are code, so a new theme ships with the repository: copy a theme folder in `src/themes/`, register it in `THEMES` in `src/lib/themes.ts`, and deploy. It then appears in **Appearance → Themes**. Theme code is never uploaded at runtime, because running uploaded code would let anyone with admin access execute anything on the server. Styles are data, so they change without a deploy.

See the [theme development guide](docs/theme-development.md), or call the MCP tool `get_theme_spec` for the full interface schema.

## Plugins

Plugins add integrations such as analytics and ad pixels. Like themes, they ship as code in `src/plugins/<id>` and are registered in `src/plugins/index.ts`; administrators activate and configure them under **Plugins** without a deploy. Secrets stay in environment variables. Bundled plugins: Google Analytics 4, Meta Pixel, Cloudflare Turnstile and Google reCAPTCHA (sign-in and donation form protection), and Sign in with Google for existing admin users.

See the [plugin development guide](docs/plugin-development.md) and [ADR 0009](docs/adr/0009-plugins-ship-as-code.md).

## Contributing

Read [AGENTS.md](AGENTS.md) and the [engineering standard](docs/engineering-standard.md) first. They apply to humans and AI agents alike. The [quality bar](docs/quality.md) shows what is measured and what is still open, and [docs/adr/](docs/adr/) explains the main design decisions.

1. Fork the repository
2. Create a branch: `git checkout -b feature/your-feature`
3. Make sure `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, and `pnpm test` pass
4. Commit using [Conventional Commits](https://www.conventionalcommits.org): `feat: add X`
5. Open a pull request using the template, and add an entry to [CHANGELOG.md](CHANGELOG.md)

## Author

NextPress is created and maintained by **Dani Sofyan** ([@danixsofyan](https://github.com/danixsofyan)). Contributions are welcome.

## License

[MIT](LICENSE) © 2026 Dani Sofyan and NextPress contributors

The landing-page animation in `public/lottie/globe.json` is "Earth and connections" from [LottieFiles](https://lottiefiles.com/free-animation/earth-and-connections-qKp1xwkNHV), used under the [Lottie Simple License](https://lottiefiles.com/page/license).
