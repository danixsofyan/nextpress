# ADR-0001: Ship NextPress as a single Next.js project

- **Status:** accepted
- **Date:** 2026-11-21

## Context

NextPress started as a Turborepo monorepo with `apps/web`, `apps/docs`, and packages for core, api, ui, config, the theme engine, and each theme. Only `apps/web` was deployed, and none of the packages were published. Users clone or fork the repository and deploy it to Vercel. The workspace added `transpilePackages`, several tsconfigs, a Vercel root-directory setting, and a second docs app that was never deployed.

## Decision

Use one Next.js project with one `package.json`. Former packages became folders under `src/`: `core`, `server`, `components/ui`, and `themes/{engine,default,editorial}`. Documentation is Markdown in `docs/`, served at `/docs` when `NEXTPRESS_DOCS=true`.

## Consequences

- Clone, `pnpm install`, `pnpm dev`, and deploy with no root-directory setting.
- One lint, typecheck, and test run covers everything.
- Themes cannot be versioned or published independently.
- If a theme SDK is ever published to npm, or a second app is deployed, revisit this decision with a new ADR.
