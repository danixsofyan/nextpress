# Quality bar

Measured, not claimed. Each row lists the command that proves it. "Not run" is a valid status.

Last measured: 2026-11-21

| Target                                                        | Status                                                                                                       | Evidence                                                                              |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Lint, 0 warnings                                              | ✅ 0 errors, 0 warnings                                                                                      | `pnpm lint`                                                                           |
| Format check                                                  | ✅                                                                                                           | `pnpm format:check`                                                                   |
| Typecheck                                                     | ✅                                                                                                           | `pnpm typecheck`                                                                      |
| Unit tests                                                    | ✅ 6 tests (markdown, FAQ extraction, upload type detection, zod update schemas)                             | `pnpm test`                                                                           |
| API / MCP e2e checks                                          | ✅ 55 / 55 against production                                                                                | `API_KEY=… BASE=https://nextpress-app.vercel.app bash api-e2e.sh` (maintainer script) |
| Dependency audit: no high/critical                            | ✅ 0 vulnerabilities of any severity                                                                         | `pnpm audit`                                                                          |
| Secret scan, git history                                      | ✅ no leaks in any commit                                                                                    | `gitleaks git .` (also runs in CI)                                                    |
| No source file > 800 lines                                    | ✅ largest is `src/app/admin/settings/page.tsx` at 590 lines                                                 | `find src -name '*.ts*' \| xargs wc -l \| sort -rn \| head`                           |
| Health endpoint reports the running commit                    | ✅ `GET /api/health` returns `commit` (from `VERCEL_GIT_COMMIT_SHA`)                                         | `curl /api/health`                                                                    |
| Author ownership on posts (BOLA)                              | ✅ authors change only their own posts (403 otherwise)                                                       | `src/app/api/admin/posts/[id]/route.ts`                                               |
| Lighthouse budget in CI                                       | ✅ `lighthouserc.json`, run on production deploys and daily                                                  | `.github/workflows/lighthouse.yml`                                                    |
| Request ID in logs                                            | ❌ not implemented                                                                                           | none                                                                                  |
| Lighthouse: Accessibility, Best Practices, SEO (mobile, home) | ✅ 100 / 100 / 100, 0 failed audits                                                                          | Chrome DevTools Lighthouse on production                                              |
| Lighthouse performance on production (home, after ISR)        | ✅ desktop 100 (LCP 0.4 s, SI 0.8 s); ⚠️ mobile 98–100 (TBT 60–160 ms from the Next.js 15 runtime polyfills) | `pnpm dlx lighthouse@12 https://nextpress-app.vercel.app/ [--preset=desktop]`         |
| Vulnerability assessment / pentest                            | ❓ not run                                                                                                   | none                                                                                  |
| Backup restore tested in the last 30 days                     | ❓ not run (Supabase daily backups exist; no restore test recorded)                                          | none                                                                                  |

## Known gaps

| Gap                                                | Risk                                                                                         | Plan                                                                                                  |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| No request ID or structured logger                 | Failures cannot be traced across a request; `console.error` is used in the API error handler | Add middleware that sets `X-Request-ID` and a small JSON logger with redaction                        |
| No audit log of admin actions                      | Cannot answer "who published or deleted this"                                                | Add an append-only `audit_logs` table written by the repositories                                     |
| No `X-RateLimit-*` headers; limits only with Redis | Clients cannot back off politely; without `REDIS_URL` the limits are per instance            | Return the headers from the rate-limit middleware; document `REDIS_URL` as recommended for production |
| Next.js 15 ships ~11 kB of runtime polyfills       | Mobile performance fluctuates between 98 and 100                                             | Upgrade to Next.js 16, which pebisnice already uses                                                   |
| No restore test                                    | Backups are unproven                                                                         | Restore the latest Supabase backup into a scratch project and record it here                          |
