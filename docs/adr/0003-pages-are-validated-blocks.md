# ADR-0003: AI agents build pages from validated blocks

- **Status:** accepted
- **Date:** 2026-11-21

## Context

AI agents build landing pages through MCP. Letting them write raw HTML, CSS, or JavaScript would allow script injection, break performance budgets, and produce inconsistent design that does not survive a theme switch.

## Decision

Pages store an ordered list of typed blocks (`hero`, `features`, `steps`, `stats`, `code`, `table`, `faq`, `cta`, `posts`, and `richText`) validated by `blocksSchema`.

- Links must start with `/`, `#`, `http(s)://`, or `mailto:`.
- Icons come from a fixed list.
- Rich text is sanitized.

The active theme renders the blocks. Agents discover the format with `get_block_spec`.

## Consequences

- Pages are safe and fast, and restyle with the theme.
- Expressiveness is limited to what the blocks support. More design freedom (variants, backgrounds, animations, new blocks) is added by extending the schema, not by allowing raw markup.
