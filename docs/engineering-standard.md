<!-- Copied from engineering-standard v1.0 on 2026-11-21. Edit the global standard, then run scripts/adopt.sh <project> <stack> --update. Project-specific rules belong in AGENTS.md. -->

# Engineering Standard

**Version 1.0 · 2026-11-21**

This is the default standard for every project I start. A project may tighten a rule, or turn one off by recording an ADR. It may never loosen a rule silently.

It is distilled from the JumpaPay engineering standard (GTP framework: NIST CSF 2.0 + DevSecOps, OWASP ASVS L2, Google and Stripe engineering practices) with everything payment-, cluster-, or company-specific removed. Stack details live in `stacks/`.

Status words used below:

- **MUST**: required. A violation blocks merge.
- **SHOULD**: the default. Deviating needs a reason in the PR or an ADR.
- **MAY**: optional.

---

## 0. Rules for AI coding agents

Every AI agent working in a project that adopts this standard **MUST**:

1. Read the project's `AGENTS.md` and the standard it links before writing any code. Re-read them at the start of every session, including after context compaction.
2. Stop and ask when a request conflicts with this standard, for example "hardcode this key", "skip the tests", or "force-push to main". Do not silently deviate. Do not silently comply either.
3. Prove claims by running the check. "Lint passes", "tests pass", "deployed", and "no vulnerabilities" are statements about command output, not intentions. Quote the command.
4. Follow the commit rules in §2 exactly. Add no `Co-Authored-By` trailers or AI attribution unless the project says otherwise.
5. Never run destructive or outward-facing actions without explicit approval in the conversation. This covers force-push, dropping data, rotating production secrets, publishing, and sending messages.
6. Keep secrets out of chat, logs, commits, and URLs. When a secret appears in the conversation, use it only for its stated purpose and recommend rotation afterwards.

## 1. Quick reference

### Never

```
✗ Hardcode secrets, API keys, passwords, or tokens in source code
✗ Commit .env files, database dumps, production logs, or exports with real tokens
✗ Expose stack traces or internal errors in API responses
✗ Store passwords with anything but argon2id or bcrypt (cost ≥ 12)
✗ Leave console.log or fmt.Println debugging in production code (use the structured logger)
✗ Write logs to files from inside the app (stdout only, 12-factor)
✗ Swallow errors (empty catch, `_ =` in Go)
✗ Store money as FLOAT (use NUMERIC(18,2) or integer minor units)
✗ Use OFFSET pagination on tables that grow without bound (use keyset/cursor)
✗ Hardcode business values (prices, fees, regions, plans, brand) that belong in the database
✗ Fall back silently on required configuration (`process.env.X || "default"` in production)
✗ Render user HTML without sanitizing it
✗ Push or force-push directly to protected branches; deploy outside CI/CD
✗ Run a production build on a developer laptop when CI can build it
```

### Always

```
✓ .env.example lists exactly the variables the code reads (no stale ones)
✓ Conventional Commits, English, imperative
✓ Authentication and authorization on every endpoint, ownership checked from the session
✓ Validate every input on the server with a schema (whitelist, not blacklist)
✓ A health endpoint that reports the running commit
✓ A request ID created at the edge and carried through logs and outbound calls
✓ CHANGELOG.md updated on every release; SemVer annotated tags
✓ Architecture decisions recorded as ADRs in docs/adr/
✓ CI green before merge: lint, format check, typecheck, tests, secret scan, dependency audit
✓ Daily backups with a restore actually tested every month
```

## 2. Git and version control

### Branches

- Branch names are lowercase with hyphens: `feature/{issue}-{short-desc}`, `fix/…`, `hotfix/…`, `chore/…`, `docs/…`, `release/{version}`. Use the issue number when there is one.
- One branch, one concern. Delete merged branches within 7 days.
- Tiers: solo or OSS projects SHOULD use `main` plus preview deployments. Teams with environments use `development → staging → main`, and promotion happens only through PRs.
- Protected branches (`main`, plus `staging` when it exists) MUST have: required status checks, branch up to date before merge, no force-push, no deletion. Teams also require one approving review with stale approvals dismissed.

### Commits

Format `<type>(<scope>): <subject>`.

- Types: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `chore`, `ci`, `style`, `revert`.
- The subject is imperative and lowercase, has no trailing period, is at most 72 characters, and is in English.
- No vague subjects ("WIP", "update", "fix bug"). The body explains *why* when it is not obvious.
- One feature per commit. History stays readable as a list of features.

### Pull requests

- The title follows Conventional Commits. Each PR covers one concern and SHOULD stay ≤ 400 changed lines.
- Use the PR template (`templates/pull_request_template.md`): summary, type of change, how to test, checklist, related issue, and screenshots for UI.
- The reviewer checks logic, secrets, swallowed errors, logging on critical paths, authorization, and migrations.
- Ping the reviewer after 3 idle days.

### Releases

- SemVer. Use annotated tags: `git tag -a vX.Y.Z -m "release: vX.Y.Z"`.
- `CHANGELOG.md` uses Keep a Changelog: `## [x.y.z] - YYYY-MM-DD` with Added, Changed, Fixed, Security, and Removed sections.

### Secrets in git

- Install a gitleaks pre-commit hook (`gitleaks git --pre-commit --staged`), and run gitleaks in CI.
- When a secret leaks: **revoke it first**, then rotate it everywhere it is used, invalidate sessions if relevant, clean the history with `git filter-repo`, and audit access logs.

## 3. Code

### General

- Name things for what they are; avoid ad-hoc abbreviations.
- Files SHOULD stay under **800 lines**. Generated files are exempt. When the same large file exists in several apps, remove the duplication before splitting.
- No dead code and no commented-out code. Delete it; git remembers.
- **Comments.** The code says *what*. The *why* goes in commit messages, PR descriptions, and ADRs. A comment is allowed only for:
  - a non-obvious external constraint, such as a vendor quirk or a spec requirement;
  - a workaround, written as `WORKAROUND: … (see #issue)`;
  - the doc comment of a public API.
  A project MAY forbid comments entirely.
- **Configuration fails hard.** Parse and validate all environment variables at startup with a schema. Required values throw in production. A development default is allowed only when it is explicitly scoped to development, and the build phase stays silent so an image can be built without secrets.
- Values compiled into the client at build time (such as `NEXT_PUBLIC_*`) are fixed per build and cannot differ per tenant or environment at runtime. Treat them as such.
- Business values live in the database or in settings, and are editable without a deploy. Use cache-aside and invalidate on write.

### Errors and logging

- Never return internal errors to clients. Log them with context; respond with a generic message and a stable error code.
- Logs are structured JSON on stdout. Every line carries `level`, ISO-8601 `time`, `service`, and `request_id`, plus `user_id` and `duration_ms` where known.
- Redact passwords, tokens, API keys, cookies, and `Authorization` headers in the logger configuration, not by hand at each call site.
- Levels: DEBUG never runs in production. INFO records state changes, WARN records recoverable anomalies, ERROR records failed operations, and FATAL is used only at startup.
- Request IDs: read `X-Request-ID` or generate one at the edge, echo it in the response, and forward it on outbound calls.

### Validation lessons (learned the hard way)

- Schema libraries with defaults: an update schema MUST NOT inject defaults into omitted fields. In zod 4, `.default()` still applies inside `.partial()`. Build update schemas from a base without defaults. Keep a test that proves an omitted field stays omitted.
- Validate IDs in path parameters (for example as UUIDs) so malformed input becomes a 400, not a database error and a 500.
- Map unique violations (Postgres `23505`) to 409 everywhere.

## 4. API design

- URLs are kebab-case, use plural nouns, and are written in English. The HTTP method is the verb and IDs go in the path. Non-CRUD actions use `POST /resources/{id}/{verb}`.
- Query parameters: filters by field name, `sort` and `order`, `search`, `cursor` and `limit` (or `page` and `limit` for small admin lists), `from` and `to` in ISO-8601 with a timezone.
- Status codes: 200, 201 (create), 204 (delete), 400 (validation), 401, 403, 404, 409 (conflict or duplicate), 413, 415, 422, 429, 500, 502, 503.
- **Error shape** is stable and documented. The default is `{ "error": { "code": "XX-4001", "message": "…", "details": [{ "field": "…", "message": "…" }] } }`, with a project prefix instead of `XX`. A project MAY use a simpler shape, but it MUST be the same shape across all endpoints.
- Versioning: bump the major version only for breaking changes. Keep the old version for at least 6 months, and announce retirement with the `Deprecation: true` and `Sunset: <date>` headers.
- Rate limits respond with `429` and send `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset`. Defaults:
  - login: 5 per 15 minutes per IP and per account, with backoff;
  - other auth endpoints: 10 per minute per IP;
  - writes: 10 per minute per IP;
  - public reads: 60 per minute per IP;
  - authenticated requests: 60 per minute per user.
- API keys: one opaque key per client, stored hashed (SHA-256 or better), sent as `X-Api-Key`, revocable, with `last_used_at` recorded.
- Idempotency: any endpoint that creates money movement or irreversible side effects accepts `Idempotency-Key` (UUID v4, 24-hour TTL).
- Every endpoint is documented in OpenAPI with examples and error codes.

## 5. Security

- **Secrets** live in environment variables or a secret manager. Each secret has an owner. Secrets are never sent over chat. Rotation: database passwords every 3 months, signing keys every 6 months, encryption keys every 12 months, and immediately after any exposure.
- **Authentication:**
  - Sessions use httpOnly, Secure, SameSite cookies, and tokens are never stored in `localStorage`.
  - Logging out invalidates the session; changing a password invalidates all sessions.
  - Public sign-up is closed unless the product needs it.
- **Authorization:**
  - Permissions are granular (`{resource}:{action}`), with no god role.
  - Check ownership on every by-ID endpoint, using the identity from the session and never the identity in the request. This prevents BOLA/IDOR.
  - Input DTOs are whitelists to prevent mass assignment.
- **Input and output:**
  - Use parameterized queries only.
  - Sanitize user HTML on write with an allowlist sanitizer before it is ever rendered.
  - Escape JSON-LD and any data embedded in `<script>`.
- **Uploads:**
  - Detect the type from magic bytes, never from the client's MIME type or filename.
  - Enforce the size limit in the app.
  - Store under a random UUID name with an extension derived from the detected type.
  - Keep buckets private and serve files through the app or short-lived signed URLs.
- **Headers:**
  - `Content-Security-Policy` (`default-src 'self'` and up);
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`;
  - `X-Content-Type-Options: nosniff`;
  - `X-Frame-Options: DENY` (or CSP `frame-ancestors 'none'`);
  - `Referrer-Policy: strict-origin-when-cross-origin`;
  - a `Permissions-Policy`;
  - CORS with an allowlist, never `*` on credentialed routes.
- **Dependencies:**
  - Run a dependency audit in CI that fails on high or critical findings. Enable Dependabot or Renovate.
  - Apply minor and patch updates every 2 weeks. Apply majors after evaluating them.
  - Run gitleaks in CI.
  - On public repositories, enable CodeQL and secret scanning; both are free there.
- **Remediation SLA:** critical within 24 hours, high within 3 working days, medium within 2 weeks, low in the next cycle. Prefer upgrading the vulnerable package. Use an override only for transitive dependencies, and record it in the changelog.
- **Incidents:** P1 response in 15 minutes, P2 in 1 hour, P3 in 4 hours, P4 in 24 hours. For a breach: isolate (T+15m), notify internally (T+30m), assess (T+1h), contain (T+4h), notify affected users (T+24h), post-mortem (T+30d).
- **Verification:** run a vulnerability assessment every major release or every 6 months, and a penetration test yearly. Until a scan has actually run, the status is "unknown", not "secure".

## 6. Database (PostgreSQL)

- **Naming:**
  - Identifiers are snake_case and in English. Table names are plural. No ad-hoc abbreviations.
  - Column suffixes: `{entity}_id`, `is_`/`has_`/`can_` for booleans, `_at` for TIMESTAMPTZ, `_date`, `_url`.
  - Constraint names: `idx_`, `uix_`, `fk_{table}_{column}`, `chk_`, `uq_`.
- **Types:**
  - `BOOLEAN`, `TIMESTAMPTZ` (always with a timezone), `JSONB`, `INET`, `NUMERIC(18,2)` for money.
  - Statuses use `TEXT` with a `CHECK` constraint or a lookup table. Prefer these over Postgres ENUMs, which are hard to evolve.
- **Standard columns:**
  - Every table has `id`, `created_at`, and `updated_at`, maintained by a trigger or the ORM.
  - Business tables add `deleted_at` (soft delete) and `created_by`/`updated_by` foreign keys to users.
  - Add `is_active` only when an independent on/off toggle is needed.
- **Keys:**
  - Use UUIDs for entities, SERIAL for small lookups, and BIGSERIAL for logs.
  - Never expose sequential IDs publicly; use slugs or codes.
  - Every foreign key has an explicit `ON DELETE` and an index. No circular foreign keys.
- **Integrity:** enforce rules with `NOT NULL`, `CHECK`, and partial `UNIQUE` constraints in the database, not only in the app.
- **Audit:**
  - Keep an append-only `audit_logs` table (`action` like `post.publish`, `entity_type`, `entity_id`, `old`/`new` JSONB, `actor_id`).
  - A trigger blocks UPDATE and DELETE on it.
- **Access:**
  - The app connects with a least-privilege role, never as a superuser.
  - Enable row level security on every table. When the app's role bypasses RLS, state that explicitly in an ADR.
  - Use TLS (`sslmode=require`).
  - Serverless apps use a transaction-mode pooler.
- **Performance:**
  - Run `EXPLAIN ANALYZE` on new queries.
  - Targets: primary-key lookup < 5 ms, paginated list < 50 ms, joins of three or more tables < 200 ms, aggregates < 500 ms.
  - Use keyset pagination on large tables.
  - Add partial indexes `WHERE deleted_at IS NULL`. Skip indexes on booleans and on tables under 1,000 rows.
- **Migrations:**
  - Each migration makes one change, runs in a transaction, and is generated from the schema.
  - Never edit a migration that has already been applied.
  - Zero-downtime changes happen in 4 phases: add nullable column, backfill, add constraints, drop the old column. Never drop anything without a deprecation phase.
  - Build indexes on large tables with `CREATE INDEX CONCURRENTLY`.
  - Migrations run from the pipeline before the app is released, never from a laptop against production. If a migration fails, stop the release.
- **Backups:** daily, with point-in-time recovery, 30-day retention, and a restore tested monthly. Targets: RTO < 4 hours, RPO < 1 hour.

## 7. Frontend, performance, SEO, accessibility

- Render on the server by default. Use static generation or ISR for public pages. Load JavaScript only for interactive islands, and lazy-load rarely used components.
- Shape API responses so the client receives only the fields it renders.
- Images use the framework's image component (AVIF/WebP, `sizes`, `priority` only above the fold). Self-host fonts with `font-display: swap`.
- Third-party scripts (analytics, pixels, chat) load after interaction or when idle, never in the critical path.
- Performance budget: LCP < 2.5 s, INP < 200 ms, CLS < 0.1 at p75, and Lighthouse ≥ 95 on public pages. A Lighthouse CI step guards the budget once one exists.
- A CDN never caches personalized or session pages. Cache keys for authorized data include the user.
- Responsive behavior comes from CSS, not from device-sniffing React branches.
- **Accessibility:**
  - Every interactive element is reachable and operable by keyboard. Use real `<button>` and `<a>` elements; when a non-native element is unavoidable, give it `role`, `tabIndex`, and Enter/Space handlers as literal JSX attributes.
  - Form fields have labels and images have alt text.
  - Dialogs use `<dialog>` or an accessible primitive, close on Escape, and return focus.
  - Animations respect `prefers-reduced-motion`.
- **SEO and answer engines** (for public content):
  - canonical URLs, titles of at most 60 characters, and descriptions of at most 160;
  - Open Graph tags, a sitemap with last-modified dates, `robots.txt`, and JSON-LD;
  - `llms.txt` plus a clean Markdown copy of each article.

## 8. Testing and the quality bar

A change is **done** only when all of these hold:

1. Lint passes with **0 warnings**, the formatter's check passes, and the typecheck passes. Run them on the whole repository, not per package.
2. Unit tests pass. Every non-trivial parser, validator, or security path has at least one test that fails if the logic breaks. The coverage target is ≥ 70% for domain and service code.
3. Integration or e2e checks for the API and critical flows pass against a running instance.
4. The dependency audit shows no high or critical findings, and the secret scan is clean.
5. No source file exceeds 800 lines unless that is justified.
6. Behavior was observed in the real app (a browser or a real API call), not only inferred from types.
7. Docs, `.env.example`, `CHANGELOG.md`, and any affected ADR are updated.

**Measure, don't claim.** Keep a `docs/quality.md` table with the date, target, status, and the command that proves each line. "Not run yet" is a valid status; "passing" without a command is not.

**No false alarms.** A CI step may fail the build only if it can explain the failure in terms of the commit's changes.
- Network downloads retry (`curl --retry 5 --retry-delay 5 --connect-timeout 20`).
- A missing optional tool skips its step with a warning.
- Readiness checks poll inside a retry loop.

## 9. CI/CD and release

- **CI on every push and PR:**
  - install with a frozen lockfile;
  - lint, format check, typecheck, tests;
  - secret scan and dependency audit;
  - a build check.
- **CD proves the rollout:**
  - Embed the commit SHA in the build and report it from the health endpoint.
  - A deploy counts as successful only when production reports the new SHA. A green pipeline alone does not count.
- Use preview environments for every PR when the platform offers them.
- Avoid peak-hour releases.
- **Rollback:**
  - Keep a plan that completes in under 2 minutes: the platform's instant rollback or the previous image tag.
  - Roll back within 30 minutes when the error rate rises above 5%, P95 latency exceeds twice the baseline, or users report broken core flows.
  - Pair database rollbacks with a forward fix or a down migration.
- Do not build on laptops when CI builds the app; verify locally with lint, typecheck, and tests.

## 10. Observability

- Each service has a dashboard for request rate, error rate, and P50/P95/P99 latency.
- **Alerts:**
  - error rate: warn above 1% over 5 minutes, critical above 5% over 2 minutes;
  - P99 latency: warn above 500 ms, critical above 2,000 ms;
  - database connections: warn above 80%, critical above 95%.
- Run an uptime monitor on public endpoints.
- Scheduled jobs have a dead-man's switch. A partial failure never exits with code 0.

## 11. Documentation

- `README.md`: what the project is, quick start, environment variables, scripts, deploy, and architecture overview. Keep it current in the same PR as the change.
- `AGENTS.md`: the rules for agents (from `templates/AGENTS.md`). `CLAUDE.md` imports it.
- `docs/adr/NNNN-title.md`: Context, Decision, and Consequences, written for every decision someone would otherwise have to ask the author about.
- `docs/quality.md`: the measured quality bar (§8).
- `CHANGELOG.md`, `SECURITY.md` (how to report a vulnerability), and `.env.example`.
- Review this standard every 6 months or after a major architecture change.

---

# Stack: TypeScript + Next.js

Applies on top of [STANDARD.md](../STANDARD.md). The reference implementation is NextPress.

## Tooling

| Concern | Choice |
|---|---|
| Package manager | pnpm (pinned with `packageManager`), frozen lockfile in CI |
| Language | TypeScript `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` |
| Lint | ESLint 9 flat config: `next/core-web-vitals` + `next/typescript` (Next 16: import `eslint-config-next/core-web-vitals` directly; Next 15: through `FlatCompat`) |
| Format | Prettier: `semi: false`, `singleQuote: true`, `printWidth: 100`, `trailingComma: "es5"`, `prettier-plugin-tailwindcss` |
| Test | Vitest (`src/**/*.test.ts`), Playwright for e2e when the project needs browser flows |
| UI | Tailwind CSS v4 + shadcn/ui, `next/link` for internal links, `next/image` for images |
| Validation | zod 4 on every server boundary (route handlers, server actions, env) |

Copy the configs from `templates/nextjs/`.

## Scripts (same names in every project)

```json
"dev": "next dev --turbopack",
"build": "next build",
"start": "next start",
"lint": "eslint .",
"format": "prettier --write .",
"format:check": "prettier --check .",
"typecheck": "tsc --noEmit",
"test": "vitest run"
```

Local definition of done: `pnpm lint && pnpm format:check && pnpm typecheck && pnpm test`. Do not run `next build` on a laptop; CI builds.

## Structure

- Single app: `src/app` (routes), `src/components` (with `ui/` for shadcn), `src/lib` (server utilities, env, auth), `src/server` (repositories, API, integrations), `src/core` (schema, validators, types). Split into packages only when something is published or deployed separately (record an ADR).
- File names kebab-case; components PascalCase; hooks `use*`; constants SCREAMING_SNAKE; server actions end in `Action` and return `{ ok: true, data } | { ok: false, message }`.
- Server-only modules import `server-only`. Route handlers (`app/api`) only for what server actions cannot do: public API, webhooks, files, MCP.
- No global client state store until a real need appears.

## Rules that bite

- `src/lib/env.ts` parses `process.env` with zod once; every other module imports `env`. No `process.env.X ?? 'fallback'` elsewhere.
- `NEXT_PUBLIC_*` is inlined at build time. Changing it needs a rebuild; it cannot vary per tenant.
- `dangerouslySetInnerHTML` only for HTML sanitized on write (sanitize-html/DOMPurify allowlist) or escaped JSON-LD.
- `console.error` only at the top-level error boundary or API `onError`; everything else goes through the logger.
- Dev server caches (Turbopack) can serve stale modules after provider/layout changes: restart with a clean `.next` before concluding code is wrong.
- zod 4: `.default()` survives `.partial()`. Derive update schemas from a base without defaults (see STANDARD §3).
