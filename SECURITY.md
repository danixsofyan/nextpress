# Security Policy

## Supported versions

Security fixes are released for the latest version on the `main` branch.

| Version | Supported |
| ------- | --------- |
| 1.x     | Yes       |
| < 1.0   | No        |

## Reporting a vulnerability

Please do not open a public issue for security problems.

Report privately through [GitHub private vulnerability reporting](https://github.com/danixsofyan/nextpress/security/advisories/new). Include:

- A description of the issue and its impact
- Steps to reproduce, or a proof of concept
- The affected version or commit

What to expect:

- Acknowledgement within 3 business days
- An assessment and, if confirmed, a fix plan within 10 business days
- Credit in the release notes once the fix is published, unless you prefer to stay anonymous

## Scope

In scope: this repository, including the public site, the admin panel at `/admin`, the REST API, and the MCP server.

Out of scope: vulnerabilities in third-party services you connect (database, Redis, object storage, hosting), and findings that require an already compromised administrator account.

## Security model

- **Authentication:** Better Auth with `HttpOnly`, `SameSite=Strict`, and `Secure` session cookies. Public sign-up is open only until the first administrator account exists; after that, only administrators can create users.
- **Authorization:** three roles (Administrator, Editor, Author). Every admin API route checks the role on the server and every restricted admin page is gated on the server, so hiding a menu item is never the only protection. The last administrator cannot be deleted or demoted, and users cannot change their own role. Impersonation and banning from the Better Auth admin plugin are not granted to any role.
- **Rate limiting:** login, sign-up, and the REST API are rate limited (shared through Redis when `REDIS_URL` is set).
- **API access:** the REST API and MCP server require an `X-Api-Key`. Keys are created by administrators, stored only as SHA-256 hashes, shown once, and revocable; their last use is recorded.
- **Content:** post and page HTML is sanitized on write, whatever the source (editor, REST API, MCP, or import). Page blocks are schema-validated (fixed block types and icons, safe link schemes only) and their rich-text HTML is sanitized, so AI agents cannot inject scripts or styles. JSON-LD is escaped.
- **Settings:** only known settings are stored; image URLs must be `http(s)` or a site path, and the Google Analytics ID and timezone are validated.
- **Import:** files are limited to 20 MB; feed URLs must be `http(s)`, time out after 15 seconds, and private, loopback, and link-local addresses are refused to prevent server-side request forgery.
- **Uploads:** only allow-listed media types (no SVG or HTML), with a configurable size limit. The bucket can stay private; files are streamed from `/media/<uuid>.<ext>` only for keys that match the generated name pattern, with `nosniff`.
- **Headers:** Content Security Policy, HSTS, `X-Frame-Options: DENY`, and `nosniff` on every response; admin responses are `no-store` and `noindex`.
- **Isolation:** setting `ADMIN_URL` serves the admin panel only on its own domain, so it no longer shares an origin with the public site.
- **Database:** on Supabase, row level security is enabled on every table, so the Supabase Data API cannot read NextPress data.

## Deployment checklist

- Generate `BETTER_AUTH_SECRET` with `openssl rand -base64 32` and never commit it.
- Create one API key per client in Admin → Settings → API, and revoke keys you no longer use.
- Create the administrator account right after the first deploy, before sharing the URL.
- Use `STORAGE_DRIVER=s3` in production.
- Set `REDIS_URL` when running more than one instance.
