# ADR-0006: Serve public pages statically with on-demand revalidation

- **Status:** accepted
- **Date:** 2026-11-21

## Context

PageSpeed measured 99 on mobile and 94 on desktop. Lighthouse showed why: every public page was rendered on every request.

- Responses carried `Cache-Control: no-store` and missed the CDN, which also disabled the back/forward cache.
- The desktop Speed Index was 3.0 s.

The cause was `force-dynamic`, plus reading cookies (theme preview) and the session (draft preview) while rendering public pages. Content also changes without a deploy, because AI agents edit pages through MCP. Performance therefore has to hold for any content, not only for the code that was reviewed.

## Decision

- Public routes are static with ISR: the home page, blog, posts, pages, feeds, sitemap, `robots.txt`, and `llms.txt`.
  - `revalidate = 3600` acts as a safety net.
  - Every repository write (posts, pages, taxonomies, menus, settings) calls `revalidatePath('/', 'layout')`.
- Previews use Next.js draft mode. Only the previewing browser bypasses the cache; cookies and the session are read only when draft mode is enabled.
- Blog pagination moves from `?page=N` (a dynamic API) to `/blog/page/N`. The old URLs redirect permanently.
- Browserslist targets modern browsers, so less legacy JavaScript ships.
- `lighthouserc.json` holds the budget:
  - performance ≥ 0.9 (median of 3 runs);
  - accessibility, best practices, and SEO = 1;
  - LCP ≤ 2.5 s, CLS ≤ 0.1, TBT ≤ 200 ms.

  The Lighthouse workflow enforces it on every production deployment and daily, which catches regressions caused by content.

## Consequences

- Visitors get CDN-cached HTML. Edits appear immediately because writes revalidate the cache.
- The first build needs database access to prerender the home page.
- Anything that reads request data in the public render path breaks caching, and the Lighthouse gate will flag it.
