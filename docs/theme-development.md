---
title: Theme Development
description: Build custom themes for NextPress
---

## Overview

A NextPress theme is a folder in `src/themes/` whose `index.tsx` exports a `ThemeConfig` object built with `defineTheme` from `@/themes/engine`.

Themes receive data as React props and never query the database directly. Site options such as the title, logo, timezone, and date format come from **Settings** in the admin and are passed to the theme as props.

## ThemeConfig interface

```ts
import { Blocks } from '@/themes/default'
import { defineTheme } from '@/themes/engine'

export const theme = defineTheme({
  name: 'my-theme',
  label: 'My Theme',
  description: 'Shown on the theme card in Appearance → Themes',
  version: '1.0.0',
  defaultStyle: {
    primary: '#0f172a',
    background: '#ffffff',
    foreground: '#0f172a',
    accent: '#f1f5f9',
    font: 'sans',
    radius: 'medium',
  },
  supports: ['blog', 'landing'],
  slots: {
    Layout,
    Header,
    Footer,
    PostCard,
    PostList,
    PostDetail,
    Blocks,
    CategoryPage,
    TagPage,
    HomePage,
  },
})
```

## Slots

| Slot           | Props               | Renders                                                  |
| -------------- | ------------------- | -------------------------------------------------------- |
| `Layout`       | `LayoutProps`       | Page wrapper with header and footer                      |
| `Header`       | `HeaderProps`       | Site header                                              |
| `Footer`       | `FooterProps`       | Site footer                                              |
| `PostCard`     | `PostCardProps`     | Post list item                                           |
| `PostList`     | `PostListProps`     | List of posts on the home and blog pages                 |
| `PostDetail`   | `PostDetailProps`   | Full post page                                           |
| `CategoryPage` | `CategoryPageProps` | Category archive                                         |
| `TagPage`      | `TagPageProps`      | Tag archive                                              |
| `HomePage`     | `HomePageProps`     | Home page                                                |
| `Blocks`       | `BlocksProps`       | Block-based pages (landing pages built by editors or AI) |

### LayoutProps

| Prop          | Type                 | Description                                                                  |
| ------------- | -------------------- | ---------------------------------------------------------------------------- |
| `siteName`    | `string`             | Site Title from Settings → General                                           |
| `logo`        | `string?`            | Logo URL from Settings → Branding. Show it instead of the site name when set |
| `navigation`  | `{ label, href }[]?` | Header links                                                                 |
| `footerLinks` | `{ label, href }[]?` | Footer links, for example the Privacy Policy page                            |

### PostCardProps and PostDetailProps

| Prop         | Type      | Description                                                |
| ------------ | --------- | ---------------------------------------------------------- |
| `post`       | `Post`    | The post                                                   |
| `timeZone`   | `string?` | IANA timezone from Settings → General, e.g. `Asia/Jakarta` |
| `dateFormat` | `string?` | Date format from Settings → General, e.g. `F j, Y`         |

### BlocksProps

| Prop                     | Type      | Description                                                            |
| ------------------------ | --------- | ---------------------------------------------------------------------- |
| `blocks`                 | `Block[]` | Ordered blocks of the page. Switch on `block.type` and render each one |
| `posts`                  | `Post[]?` | Latest posts, provided when the page contains a `posts` block          |
| `timeZone`, `dateFormat` | `string?` | Same as for `PostCard`                                                 |

The `Block` type is exported from `@/themes/engine`. See `src/themes/default/components/blocks.tsx` for a complete implementation of all block types. A theme decides the look; the blocks and their content stay the same when the theme changes.

## Style and customization

`defaultStyle` sets the theme's colors, font, and corner radius. Administrators override it per theme in **Appearance → Customize** (or AI agents with the MCP tool `update_theme_style`); the override is stored in the database and applies without a deploy.

NextPress turns the style into CSS variables on the site wrapper (`--color-primary`, `--color-background`, `--color-foreground`, `--color-accent`, `--color-muted-foreground`, `--color-border`, `--radius-*`, and the font family). Use the matching Tailwind classes, such as `bg-primary`, `text-primary-foreground`, `text-muted-foreground`, `border-border`, and `rounded-md`, instead of fixed colors, so customization reaches every part of the theme.

## Reusing another theme (child themes)

A theme can import components from another theme. The Editorial theme imports `Blocks` from `@/themes/default` and only replaces the layout and post components.

## Formatting dates

Use `formatDate` so dates follow the site's timezone and format. It accepts the same format characters as WordPress (`d`, `D`, `j`, `l`, `N`, `S`, `w`, `F`, `M`, `m`, `n`, `Y`, `y`, `a`, `A`, `g`, `G`, `h`, `H`, `i`, `s`, `T`); escape a literal character with `\`.

```tsx
import { formatDate, type PostCardProps } from '@/themes/engine'

export function PostCard({ post, timeZone, dateFormat }: PostCardProps) {
  return (
    <article>
      <h2>{post.title}</h2>
      {post.publishedAt && (
        <time dateTime={post.publishedAt.toISOString()}>
          {formatDate(post.publishedAt, dateFormat, timeZone)}
        </time>
      )}
    </article>
  )
}
```

## Rendering content

Post and page `content` is HTML that NextPress has already sanitized on write. Render it with `dangerouslySetInnerHTML`; do not sanitize it again in the theme.

## Get the spec via MCP

AI agents can retrieve the full TypeScript interface via the MCP tool:

```json
{
  "tool": "get_theme_spec"
}
```

## Scaffold a new theme

```bash
cp -r src/themes/editorial src/themes/my-theme
# Edit src/themes/my-theme/index.tsx (name, label, description, defaultStyle) and the components
```

Then register it:

1. Import it in `src/lib/themes.ts` and add it to `THEMES`.
2. Deploy. The theme appears in **Appearance → Themes**, where an administrator can preview and activate it.

Themes are code and ship with a deploy. Uploading theme code at runtime is deliberately not supported: it would let anyone with admin access run arbitrary code on the server.
