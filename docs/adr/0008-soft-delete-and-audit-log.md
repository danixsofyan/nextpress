# ADR-0008: Soft delete for content, append-only audit log for every write

- **Status:** accepted
- **Date:** 2026-11-21

## Context

The engineering standard asks for `deleted_at` on business tables, `created_by` and `updated_by` columns, and an audit trail that answers "who changed this, and when". Before this change, deleting a post or page removed it at once, and nothing recorded who published, edited, or deleted anything. Enum types also had to change through `ALTER TYPE`, which cannot run inside a transaction.

## Decision

- **Posts and pages are soft-deleted.** Delete sets `deleted_at` and renames the slug to `<slug>__trashed-<id prefix>`, so the original slug is free for new content. Restore clears `deleted_at` and the suffix. Every read filters `deleted_at IS NULL`. Only a trashed item can be purged, through the admin Trash or `DELETE …?permanent=true`.
- **Other tables are hard-deleted.** Taxonomies, menus, settings, API keys, and media have no Trash in WordPress either, and media also removes the stored file. The audit log keeps their last state.
- **`audit_logs` is append-only.** A trigger rejects `UPDATE` and `DELETE`, and RLS is enabled like every other table. Each row stores the action, the entity, the actor (`user`, `api_key`, or `system`), the user, the request ID, and the before and after state without heavy fields (content, blocks, HTML, key hashes).
- **The actor comes from the request context.** `requireRole` and the API key check write the actor into an `AsyncLocalStorage` store, which the repositories read, so no repository signature needs a session parameter.
- **`author_id` serves as `created_by`, and the audit log serves as `updated_by`.** Adding both columns to every table would duplicate what the log already records.
- **Status and type columns are `text` with `CHECK` constraints** (`chk_posts_status`, `chk_pages_status`, `chk_taxonomies_type`) instead of Postgres enums, so adding a value is an ordinary migration.

## Consequences

- REST and MCP deletes move content to the Trash; clients that relied on a permanent delete must send `?permanent=true` afterwards.
- Trashed rows keep their slug suffix, so restoring an item whose original slug was reused in the meantime fails with a unique violation until one of them is renamed.
- The audit log grows without bound. Pruning, if ever needed, must be done by the database owner with the trigger disabled.
