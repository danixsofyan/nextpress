---
title: Getting Started
description: Deploy NextPress in minutes with Vercel and Supabase
---

## Prerequisites

- Node.js 24+
- pnpm 11+
- A PostgreSQL database (for example a free Supabase project)
- Vercel account (optional, for deployment)

## Installation

```bash
git clone https://github.com/danixsofyan/nextpress.git
cd nextpress
pnpm install
```

## Environment variables

```bash
cp .env.example .env.local
```

Fill in the required values:

| Variable               | Description                                    |
| ---------------------- | ---------------------------------------------- |
| `DATABASE_URL`         | PostgreSQL connection string                   |
| `NEXT_PUBLIC_SITE_URL` | Public URL of your site                        |
| `BETTER_AUTH_SECRET`   | Session signing secret, at least 32 characters |

Optional settings (Redis, S3-compatible media storage, isolated admin domain) are documented in `.env.example`. Site options such as the title, logo, timezone, and homepage are set later in the admin under **Settings**.

## Run database migrations

```bash
DATABASE_URL=... pnpm db:migrate
```

## Start development

```bash
pnpm dev
```

- Public site: http://localhost:3000
- Admin panel: http://localhost:3000/admin (the first visit creates your administrator account)
- API keys: create one in Admin → Settings → API
- API docs: http://localhost:3000/api/docs
- OpenAPI spec: http://localhost:3000/api/openapi.json
