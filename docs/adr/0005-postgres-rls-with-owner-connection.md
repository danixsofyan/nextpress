# ADR-0005: Enable RLS on every table while the app connects as owner

- **Status:** accepted
- **Date:** 2026-11-21

## Context

Supabase exposes Postgres through its own REST and GraphQL APIs. A table without row level security is readable and writable through those APIs by anyone who holds the anon key. NextPress itself enforces access in application code (Better Auth roles and `requireRole`) and connects with the database owner role.

## Decision

Enable RLS on every table, with no policies. This closes the Supabase data APIs completely. The app's owner connection bypasses RLS, so authorization stays in the application layer. Every migration that creates a table also enables RLS on it.

## Consequences

- No accidental public access through Supabase APIs.
- Authorization correctness depends entirely on application checks, so every endpoint must check role and ownership.
- Moving to a least-privilege app role with real policies is possible later and needs a new ADR.
