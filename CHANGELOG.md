# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- `AGENTS.md` and `CLAUDE.md`, so every AI agent reads the rules before it writes code.
- The engineering standard (`docs/engineering-standard.md`), the measured quality bar (`docs/quality.md`), and ADRs 0001–0005.
- The pull request template and Dependabot configuration.
- A CI job that runs a gitleaks secret scan and fails on high or critical dependency advisories.
- `GET /api/health` now reports the running commit.

### Changed

- Upgraded to zod 4, `@hono/zod-openapi` 1.x, Hono 4.13, drizzle-orm 0.45, drizzle-kit 0.31, Tiptap 3, and `@vercel/og` 1.0.
- `sitemap.xml` reads the site URL from the validated environment instead of a hardcoded fallback.

### Fixed

- Updating a post, page, or taxonomy without sending `status`, `content`, or `type` no longer resets those fields to their defaults.

### Security

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
