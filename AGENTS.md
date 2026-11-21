# AGENTS.md

Instructions for AI coding agents (Claude Code, Codex, Cursor, Copilot, and others) working in this repository. Humans should read it too.

## Before you write any code

Do these at the start of **every** session, including after context compaction:

1. Read this file completely.
2. Read [docs/engineering-standard.md](docs/engineering-standard.md). It is the binding standard for this repository.
3. Read [docs/quality.md](docs/quality.md) to see what is measured and what is still open.
4. Skim the ADRs in [docs/adr/](docs/adr/) that touch the area you are changing.
5. Read `.agents/HANDOFF.md` (gitignored) and your persistent memory for this project, and continue from "Next steps".
6. Run `git status` and `git log --oneline -10` so you know the current state.

If a request conflicts with the standard, stop and ask. Do not silently deviate, and do not silently comply.

## Session continuity

Compaction, resume, clear, and switching agents all lose context. Keep `.agents/HANDOFF.md` current, with these sections:

- Current goal (quote the user's latest instruction)
- Done (verified), each item with its proof
- In progress
- Next steps
- Decisions and constraints
- Gotchas
- How to verify

Update it after each milestone, before long-running commands, and before you stop. Move lasting knowledge into memory, this file, an ADR, or the docs. Claude Code injects the handoff automatically through `.claude/hooks/session-context.sh` on every session start, including after compaction.

## Project

- **What it is:** NextPress, an open-source WordPress alternative with a WordPress-style admin, a typed REST API, and an MCP server so AI agents can manage content.
- **Stack:**
  - Next.js 15 App Router, React 19, TypeScript strict
  - Drizzle ORM on Postgres (Supabase), Better Auth
  - Hono with `@hono/zod-openapi`, zod 4, MCP SDK
  - Tailwind CSS v4 with shadcn/ui
- **Production:** https://nextpress-app.vercel.app
- **Deploys from:** `main` via Vercel (Git-connected; every push to `main` deploys)

## Commands

| Purpose                           | Command                                                                                                                                        |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Install                           | `pnpm install`                                                                                                                                 |
| Dev server                        | `pnpm dev`                                                                                                                                     |
| Lint (0 warnings)                 | `pnpm lint`                                                                                                                                    |
| Format check                      | `pnpm format:check` (fix with `pnpm format`)                                                                                                   |
| Typecheck                         | `pnpm typecheck`                                                                                                                               |
| Tests                             | `pnpm test`                                                                                                                                    |
| Generate a migration              | `pnpm db:generate`                                                                                                                             |
| Apply migrations                  | `DATABASE_URL=… pnpm db:migrate`                                                                                                               |
| Dependency audit                  | `pnpm audit --audit-level high`                                                                                                                |
| Secret-scan hook (once per clone) | `printf '#!/bin/sh\nexec gitleaks git --pre-commit --staged --redact --no-banner\n' > .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit` |

Definition of done for every change:

- All of the checks above pass on the **whole** repository.
- The behavior was observed in the running app (a browser or a real API call).
- The docs, `.env.example`, and `CHANGELOG.md` are updated.

Do not run `next build` locally; CI and Vercel build. After the change reaches production, verify it: `/api/health` must report the new commit, and the API e2e checks must pass against production.

## Non-negotiable rules

- No secrets in code, commits, logs, or URLs. `.env*` files are never committed. `.env.example` lists exactly what `src/lib/env.ts` reads.
- Validate every input on the server with zod. Check the role with `requireRole` and check ownership from the session on every endpoint.
- Required configuration fails hard: read env only through `src/lib/env.ts`, and never write `process.env.X ?? 'default'` elsewhere.
- No `console.log`. No swallowed errors. No stack traces in responses.
- Use parameterized queries (Drizzle) only.
- User HTML is sanitized on write by the repositories. Uploads are typed from magic bytes (`src/lib/file-type.ts`).
- Migrations are generated with drizzle-kit, make one change each, and are never edited after being applied. Migrations run as the database owner. After a migration that creates a table, rerun `pnpm db:roles` so the least-privilege app role gets its grants and RLS policy ([ADR 0005](docs/adr/0005-least-privilege-database-role.md)).
- zod 4 update schemas are derived from a base without `.default()`; `src/core/validators/validators.test.ts` guards this.
- Commits follow Conventional Commits in English, imperative, with a subject of at most 72 characters, one feature per commit. Add **no** `Co-Authored-By` trailers or AI attribution.
- Never force-push or push directly to protected branches. Destructive or outward-facing actions need explicit approval in the conversation.
- **No code comments.** The _why_ goes in commit messages, PR descriptions, and ADRs.

## Project-specific rules

- **Single Next.js project.** Do not reintroduce a monorepo or workspace packages without an ADR ([0001](docs/adr/0001-single-nextjs-project.md)).
- **Themes are code.** They live in `src/themes/<name>`, are registered in `src/lib/themes.ts`, and ship with a deploy ([0002](docs/adr/0002-themes-ship-as-code.md)). Styles (colors, font, radius) are data stored in settings.
- **AI agents build pages from validated blocks** (`src/core/validators/blocks.ts`), never from raw HTML, CSS, or JS ([0003](docs/adr/0003-pages-are-validated-blocks.md)).
- **Media is private.** The bucket stays private and files are served from `/media/<uuid>.<ext>` ([0004](docs/adr/0004-private-media-through-proxy.md)).
- **Admin UI:**
  - Use toasts (`useToast`) for every save and error, and confirmation dialogs (`useConfirm`) for destructive actions; never `window.confirm`.
  - Use `next/link` for internal links and `next/image` for images.
- **Public pages stay fast and crawlable** ([ADR 0006](docs/adr/0006-static-public-pages.md)):
  - Public routes are static with ISR. Never read `cookies()`, `headers()`, or the session in the public render path, except behind `draftMode()`.
  - Previews (themes and draft posts) use draft mode, and repository writes call `revalidatePublicSite()`.
  - Use server components, with no client JS unless interactive. JSON-LD goes through `components/json-ld.tsx`, and `llms.txt` is generated from content.
  - The performance budget in `lighthouserc.json` (Lighthouse CI on every production deploy and daily) must stay green. Blocks and themes must keep any combination of content within it: a new block may not add client JS above the fold, and heavy media (video, Lottie) must load lazily after the largest contentful paint.
- **The MCP tool count is part of the public API.** When you add or remove a tool, update the README and the docs tables, the landing page stat, and the e2e expectation.
- **`/docs` serves files from `docs/`** only when `NEXTPRESS_DOCS=true`. `docs/engineering-standard.md` is a copy of the global standard; do not edit it here. Put NextPress-specific rules in this file.

## Where things live

```
src/app/          routes: (site) public pages, admin/, api/, docs, feeds, llms.txt
src/components/   admin/ components, ui/ (shadcn), site components
src/core/         Drizzle schema, db client, types, zod validators
src/server/       Hono REST API, MCP server and tools, repositories, sanitize
src/lib/          env, auth, roles, settings, storage, themes, docs, SEO helpers
src/themes/       engine/, default/, editorial/
drizzle/          SQL migrations and seed.sql
docs/             developer docs, engineering standard, quality bar, ADRs
```
