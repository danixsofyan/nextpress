# ADR-0007: Keep Drizzle's generated constraint names

- **Status:** accepted
- **Date:** 2026-11-21

## Context

The engineering standard names constraints `idx_`, `uix_`, `fk_{table}_{column}`, `chk_`, and `uq_`. Drizzle generates its own names for constraints declared inline: `posts_author_id_user_id_fk` and `posts_slug_unique`. Renaming every generated constraint means one migration per constraint, plus overriding Drizzle for each new column. That churn buys no safety, because the names are already unique and descriptive.

## Decision

- Constraints that Drizzle generates from `.references()` and `.unique()` keep Drizzle's names.
- Everything we name by hand follows the standard: indexes (`index('idx_posts_author_id')`), check constraints (`chk_`), and partial unique indexes (`uix_`).

## Consequences

- No rename migrations, and generated SQL stays readable.
- Two naming styles coexist. The suffix (`_fk`, `_unique`) still identifies the constraint type.
