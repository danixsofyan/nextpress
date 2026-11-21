---
title: API Reference
description: REST API and MCP server documentation
---

## Authentication

Create an API key in **Admin → Settings → API** (`/admin/settings?tab=api`). The key is shown once; copy it then. Send it in the `X-Api-Key` header on every request:

```bash
curl -H "X-Api-Key: np_..." https://your-site.com/api/posts
```

Keys are stored only as SHA-256 hashes and record when they were last used. Revoke a key at any time from the same screen. A key set in the `NEXTPRESS_API_KEY` environment variable is also accepted.

Requests without a valid key get `401`. Requests are rate limited per key (`429` when exceeded).

## REST API

Base URL: `https://your-site.com/api`

- Interactive reference (Scalar): `/api/docs`
- OpenAPI 3.0 spec: `/api/openapi.json`

| Method | Path                  | Description                              |
| ------ | --------------------- | ---------------------------------------- |
| GET    | `/api/posts`          | List posts (`status`, `limit`, `offset`) |
| POST   | `/api/posts`          | Create a post                            |
| GET    | `/api/posts/:id`      | Get a post                               |
| PUT    | `/api/posts/:id`      | Update a post                            |
| DELETE | `/api/posts/:id`      | Move a post to the Trash                 |
| GET    | `/api/pages`          | List pages                               |
| POST   | `/api/pages`          | Create a page                            |
| GET    | `/api/pages/:id`      | Get a page                               |
| PUT    | `/api/pages/:id`      | Update a page                            |
| DELETE | `/api/pages/:id`      | Move a page to the Trash                 |
| GET    | `/api/taxonomies`     | List categories and tags (`type`)        |
| POST   | `/api/taxonomies`     | Create a category or tag                 |
| PUT    | `/api/taxonomies/:id` | Update a category or tag                 |
| DELETE | `/api/taxonomies/:id` | Delete a category or tag                 |

Deleting a post or page moves it to the Trash. Send `DELETE` again with `?permanent=true` to remove a trashed item for good. Every write is recorded in the append-only `audit_logs` table with the actor and the request ID.
| GET | `/api/health` | Health check, no key required |

HTML in `content` is sanitized on write. Scripts, event handlers, and `javascript:` links are removed.

### Errors

| Status | Meaning                                                     |
| ------ | ----------------------------------------------------------- |
| `400`  | Invalid body, invalid query, or an `:id` that is not a UUID |
| `401`  | Missing or invalid `X-Api-Key`                              |
| `404`  | The record does not exist                                   |
| `409`  | The slug is already used by another record                  |
| `429`  | Rate limit exceeded                                         |

Errors are JSON, for example `{"error": "Not found"}`.

## MCP server

- Endpoint: `/api/mcp`
- Transport: Streamable HTTP (stateless, JSON responses)
- Authentication: the same `X-Api-Key` header

| Tool                   | Description                                                           |
| ---------------------- | --------------------------------------------------------------------- |
| `get_writing_guide`    | SEO, AEO, and GEO checklist for writing posts and pages               |
| `get_block_spec`       | Block types, fields, allowed icons, and examples                      |
| `list_pages`           | List pages with status and block count                                |
| `get_page`             | Get a page and its blocks by slug                                     |
| `create_page`          | Create a page from blocks (or HTML)                                   |
| `update_page`          | Update a page; passing `blocks` replaces them all                     |
| `delete_page`          | Move a page to the Trash                                              |
| `set_homepage`         | Show the latest posts or a published page on the homepage             |
| `set_navigation`       | Replace the header navigation links                                   |
| `update_site_identity` | Update site title, tagline, and default meta description              |
| `create_post`          | Create a blog post                                                    |
| `update_post`          | Update a post by ID                                                   |
| `list_posts`           | List posts with filters                                               |
| `get_post`             | Get a post by slug                                                    |
| `create_taxonomy`      | Create a category or tag                                              |
| `list_themes`          | List installed themes, the active theme, and each theme's style       |
| `set_theme`            | Activate an installed theme                                           |
| `update_theme_style`   | Change a theme's colors, font, or radius, or reset it to its defaults |
| `get_site_config`      | Get site settings                                                     |
| `get_theme_spec`       | Get the ThemeConfig interface schema                                  |

### Blocks

Pages can be built from an ordered list of blocks instead of HTML. The REST API accepts the same `blocks` array on `POST /api/pages` and `PUT /api/pages/:id`.

| Block      | Fields                                                                                                            |
| ---------- | ----------------------------------------------------------------------------------------------------------------- |
| `hero`     | `eyebrow?`, `heading`, `subheading?`, `primary?`, `secondary?`                                                    |
| `features` | `heading?`, `intro?`, `columns?` (2, 3, 4), `items[]` of `icon?`, `title`, `description`                          |
| `steps`    | `heading?`, `items[]` of `title`, `description`                                                                   |
| `stats`    | `heading?`, `items[]` of `value`, `label`                                                                         |
| `code`     | `heading?`, `intro?`, `language?`, `code`, `caption?`                                                             |
| `table`    | `heading?`, `intro?`, `columns[]`, `rows[][]`                                                                     |
| `faq`      | `heading?`, `items[]` of `question`, `answer`                                                                     |
| `cta`      | `heading`, `text?`, `primary`, `secondary?`                                                                       |
| `donate`   | `heading`, `text?`, `amounts[]` (1–6 presets in rupiah), `buttonLabel?`; shown only when `SUMOPOD_API_KEY` is set |
| `posts`    | `heading?`, `count` (latest published posts)                                                                      |
| `richText` | `html` (sanitized)                                                                                                |

Links are `{ "label": "...", "href": "..." }` and the `href` must start with `/`, `#`, `http(s)://`, or `mailto:`.

```json
[
  {
    "type": "hero",
    "heading": "Fresh bread every morning",
    "primary": { "label": "Visit us", "href": "/contact" }
  },
  {
    "type": "features",
    "columns": 3,
    "items": [{ "icon": "sparkles", "title": "Sourdough", "description": "48-hour fermentation." }]
  },
  { "type": "posts", "heading": "From the blog", "count": 3 }
]
```

### Connect an MCP client

```json
{
  "mcpServers": {
    "nextpress": {
      "url": "https://your-site.com/api/mcp",
      "headers": { "X-Api-Key": "np_..." }
    }
  }
}
```

## Feeds and discovery

| Path           | Description                                                                 |
| -------------- | --------------------------------------------------------------------------- |
| `/feed.xml`    | RSS 2.0 feed. Length and full text or excerpt are set in Settings → Reading |
| `/sitemap.xml` | Sitemap of published posts                                                  |
| `/robots.txt`  | Generated, or custom from Settings → SEO                                    |
| `/llms.txt`    | Site summary for AI crawlers                                                |
