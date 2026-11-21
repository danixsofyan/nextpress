# ADR-0002: Themes ship as code; styles are data

- **Status:** accepted
- **Date:** 2026-11-21

## Context

WordPress installs themes by uploading PHP. NextPress runs on serverless platforms that only execute code present at build time. Loading theme code from storage at runtime would let anyone with admin access run arbitrary code on the server.

## Decision

A theme is a folder in `src/themes/<name>` that exports a `ThemeConfig`. It is registered in `src/lib/themes.ts` and deployed with the app. The theme's style (four colors, font, and corner radius) is validated by `themeStyleSchema`, stored in settings, editable in Appearance → Customize or through MCP, and exportable as JSON. Administrators can preview a theme through a cookie that only their session honors.

## Consequences

- No remote-code-execution surface.
- Themes are reviewable in pull requests.
- Adding a theme needs a deploy; changing its look does not.
- A future plugin or theme store has to install through a pull request (and a deploy), not through runtime upload.
