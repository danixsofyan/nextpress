# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

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
