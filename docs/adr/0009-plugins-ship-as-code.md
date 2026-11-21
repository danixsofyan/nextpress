# ADR-0009: Plugins ship as code, configuration lives in the database

- **Status:** accepted
- **Date:** 2026-11-21

## Context

WordPress plugins are PHP files uploaded at runtime. NextPress runs on serverless functions with a read-only file system, and executing uploaded code would bypass review, CI, CodeQL, and the content security policy. Site owners still expect to turn integrations such as analytics, pixels, and captchas on and off, and to configure them without a deploy.

## Decision

- **A plugin is a module in `src/plugins/<id>`** created with `definePlugin()`. It declares its metadata, a zod schema for its settings, the form fields, the environment variables it needs, and the hooks it implements (`PublicScripts` today).
- **`src/plugins/index.ts` is the registry.** A plugin ships when it is added there and deployed, exactly like a theme ([ADR 0002](0002-themes-ship-as-code.md)).
- **Activation and settings live in the `plugins` setting** as JSON, validated against each plugin's schema on every read and write. Administrators manage them under **Plugins** in the admin.
- **Secrets never go into the database.** A plugin that needs one lists it in `requiredEnv`; it cannot be activated until the variable is set, and `src/lib/env.ts` remains the only place that reads the environment.
- **Third-party hosts are allow-listed in the CSP** in `next.config.ts` when a plugin is added, because the policy is fixed at build time.
- The former Google Analytics setting (`ga_id`) is read as an active Google Analytics plugin until the plugin is saved once.

## Consequences

- Adding a plugin is a pull request, so every plugin passes the same lint, tests, and security scans as the core.
- There is no runtime upload or marketplace install. A "store" is the list of plugins in the registry.
- Plugin hooks are added deliberately as plugins need them (public scripts first; form protection and widgets next), instead of exposing a generic action and filter system.
