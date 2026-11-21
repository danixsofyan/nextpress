# ADR-0005: Connect as a least-privilege role under row level security

- **Status:** accepted (revised 2026-11-21: the app no longer connects as the owner)
- **Date:** 2026-11-21

## Context

Supabase exposes Postgres through its REST and GraphQL APIs. A table without row level security is readable and writable through those APIs by anyone who holds the anon key.

NextPress first connected as the `postgres` owner. That role bypasses RLS, can change the schema, and shares the Supavisor pool with Supabase's internal services. Production builds then hit statement timeouts while prerendering: dozens of parallel queries queued behind the shared pool. Pebisnice already runs on a dedicated `pebisnice_app` role.

## Decision

- Every table has RLS enabled.
- The deployed app connects through the transaction pooler (port 6543) as `nextpress_app`, a login role with no BYPASSRLS, no DDL rights, and only data privileges.
  - Each table has one policy, `app_full_access`, granting that role full access.
  - `anon` and `authenticated` have no policy, so the Supabase APIs stay closed.
- `pnpm db:roles` (`drizzle/app-role.sql`) creates or updates the role idempotently. It sets grants and default privileges, enables RLS, and adds the policy to every public table.
- Migrations still run as the owner. After a migration creates a table, `pnpm db:roles` runs again.
- Functions run in the same region as the database (`hnd1` for Tokyo).

- Never queue more queries than connections on the transaction pooler.
  - postgres.js pipelines queries whenever more are queued than it has connections, and Supavisor's transaction mode leaves pipelined queries hanging.
  - We reproduced this: with `max: 3`, six parallel queries hung, while ten parallel queries with `max: 10` finished in 0.65 s.
  - The session pooler avoids pipelining but caps clients at the pool size (15), which builds and serverless instances exceed.
  - So each instance keeps up to 10 connections (as in pebisnice), and builds prerender one page at a time in one worker (`cpus: 1`, `staticGenerationMaxConcurrency: 1`) with retries.

## Consequences

- A leaked app credential can read and write content, but it cannot alter the schema or touch other schemas.
- The app gets its own pooled connections, so builds no longer compete with Supabase internals.
- Setup has one more step (`pnpm db:roles` with `APP_DB_PASSWORD`).
- Authorization still lives in the application layer: roles via `requireRole`, and author ownership on posts.
