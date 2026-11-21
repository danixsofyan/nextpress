# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Public sites default to dark mode, and visitors switch between dark and light with the sun and moon button in the header. The choice is remembered per browser and applied before the first paint. Administrators pick the default scheme in Appearance → Customize.
- CodeQL scans the code with the `security-extended` queries on every push, pull request, and weekly.
- A WordPress-style Trash for posts and pages. Deleting moves an item to the Trash (`All | Trash` views with counts), from where it can be restored or deleted permanently. The REST API accepts `DELETE …?permanent=true` for trashed items.
- An append-only `audit_logs` table that records every create, update, publish, trash, restore, and delete with the actor (user, API key, or system) and the request ID.
- Donors enter their name and an optional message, which administrators see next to each donation.
- Donations are stored in a `donations` table. The SumoPod webhook updates their status, and administrators see them under **Donations**.
- Structured JSON logging with redaction of passwords, tokens, keys, cookies, and signatures. Every response carries `X-Request-ID`, which is also forwarded to SumoPod.
- Every API error has a stable `code` next to its message (for example `NP-4000` validation, `NP-4010` unauthorized, `NP-4040` not found, `NP-4290` rate limited). Validation errors from the REST API use the same shape and no longer leak schema internals.
- REST API responses send `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset`, plus `Retry-After` on 429.
- `/donate` page and `/api/webhooks/sumopod`, which verifies SumoPod's Svix signature (or webhook token) and records `NPD-` donation events. Several apps can share one SumoPod project when its single webhook relays `NPD-` orders here.
- A `donate` page block that accepts QRIS donations through SumoPod. It is hidden until `SUMOPOD_API_KEY` is set, needs no client JavaScript, and has thank-you and error pages.
- Posts and pages record their author, and the admin lists show an Author column. Authors can view, edit, and delete only their own posts; editors and administrators keep full access.
- `pnpm db:seed` applies default categories, tags, and settings idempotently.
- `AGENTS.md` and `CLAUDE.md`, so every AI agent reads the rules before it writes code.
- The engineering standard (`docs/engineering-standard.md`), the measured quality bar (`docs/quality.md`), and ADRs 0001–0005.
- The pull request template and Dependabot configuration.
- A CI job that runs a gitleaks secret scan and fails on high or critical dependency advisories.
- `GET /api/health` now reports the running commit.
- A Lighthouse CI budget (`lighthouserc.json`), enforced on every production deployment and daily.
- A Claude Code `SessionStart` hook that injects the agent rules and `.agents/HANDOFF.md` after startup, resume, clear, and compaction.
- Performance rules in the `get_block_spec` MCP tool.

### Changed

- The default theme's blocks have a modern look: an animated aurora and grid behind the hero, gradient headings, glass cards with gradient borders, a code window, and sections that reveal on scroll. Everything is CSS (no client JavaScript), the glow colors follow the theme's primary color, and all motion stops under `prefers-reduced-motion`.
- Passwords are hashed with argon2id. Existing scrypt hashes still verify and are rehashed with argon2id at the next sign-in.
- The Lighthouse workflow runs on every push to `main` once production reports that commit, because Vercel does not create GitHub deployments.
- `posts.status`, `pages.status`, and `taxonomies.type` are `text` columns with `CHECK` constraints instead of Postgres enums.
- The `delete_page` MCP tool moves the page to the Trash.
- The database client keeps up to 10 pooled connections per instance and closes idle ones after 20 s. Builds prerender one page at a time and retry transient failures, because Supavisor's transaction mode hangs postgres.js queries that are pipelined when more queries are queued than connections.
- Functions run in Tokyo (`hnd1`), next to the Supabase database, instead of Washington.
- The admin renders its data on the server: one query for the dashboard counts, the initial rows for every list and settings screen, and the signed-in user for the sidebar and header. No more loading placeholders.
- Every admin select uses an even, custom chevron, and buttons show the pointer cursor.
- Dependabot proposes only minor and patch updates; major upgrades are evaluated by hand.
- Public pages, feeds, the sitemap, and `llms.txt` are served statically with ISR and revalidate on every content write. Theme and draft previews use Next.js draft mode.
- Blog pagination moved to `/blog/page/N`; `/blog?page=N` redirects permanently.
- Modern browserslist targets, so less legacy JavaScript ships.
- Upgraded to zod 4, `@hono/zod-openapi` 1.x, Hono 4.13, drizzle-orm 0.45, drizzle-kit 0.31, Tiptap 3, and `@vercel/og` 1.0.
- `sitemap.xml` reads the site URL from the validated environment instead of a hardcoded fallback.

### Fixed

- The CI security job no longer fails after a clean run because of a missing pnpm cache.
- Updating a post, page, or taxonomy without sending `status`, `content`, or `type` no longer resets those fields to their defaults.

### Security

- Sign-in is limited to 5 attempts per 15 minutes per IP (previously per minute), sign-up and password reset to 3, and the REST API to 60 requests per minute per key.
- Environment variables are read only through the validated `env` module.
- The app connects as `nextpress_app`, a least-privilege role without BYPASSRLS or DDL rights, with an RLS policy per table (`pnpm db:roles`). Migrations still run as the owner.
- Uploads are typed from their magic bytes. The stored extension and content type come from the detected type, never from the client's filename or MIME type, and HTML disguised as an image is rejected with 415.
- Fixed every `pnpm audit` advisory:
  - high: drizzle-orm SQL identifier escaping, two PostCSS advisories, and zod memory exhaustion;
  - moderate: PostCSS, postcss-selector-parser, Tiptap, satori, fflate, and esbuild.

  The transitive packages are pinned with pnpm overrides in `pnpm-workspace.yaml`.

## [1.0.0] - 2026-11-21

### Added

- WordPress-style admin:
  - posts, pages, media, taxonomies, menus, users, settings, and import;
  - a Publish box, inline Categories and Tags boxes, confirmation dialogs, and toasts.
- Public site with themes (Default and Editorial), Appearance → Themes, and Appearance → Customize.
- Block-based landing pages.
- REST API with OpenAPI and a Scalar reference.
- MCP server with 20 tools for AI agents.
- SEO, GEO, and AEO: JSON-LD, sitemap, RSS, `robots.txt`, `llms.txt`, `llms-full.txt`, and a Markdown copy of every post.
- Better Auth with administrator, editor, and author roles.
- Private media served through `/media`.
