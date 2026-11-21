import { OpenAPIHono } from '@hono/zod-openapi'
import { Scalar } from '@scalar/hono-api-reference'
import type { Database } from '@/core/db'
import { sql } from 'drizzle-orm'
import { redis } from './middleware/rate-limit'
import { postsRouter } from './routes/posts'
import { pagesRouter } from './routes/pages'
import { uniqueViolation } from './routes/shared'
import { taxonomiesRouter } from './routes/taxonomies'

export function createApp(db: Database) {
  const app = new OpenAPIHono()

  app.onError((error, c) => {
    if (uniqueViolation(error)) {
      return c.json({ error: 'A record with this slug already exists' }, 409)
    }
    console.error(error)
    return c.json({ error: 'Internal server error' }, 500)
  })

  app.get('/api/health', async (c) => {
    try {
      await db.execute(sql`select 1`)
      if (redis) await redis.ping()
      return c.json({ status: 'ok', commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null })
    } catch {
      return c.json({ status: 'error' }, 503)
    }
  })

  app.route('/', postsRouter(db))
  app.route('/', pagesRouter(db))
  app.route('/', taxonomiesRouter(db))

  app.doc('/api/openapi.json', {
    openapi: '3.0.0',
    info: {
      version: '1.0.0',
      title: 'NextPress API',
      description: 'RESTful API for NextPress CMS — AI-ready, MCP-compatible',
    },
    security: [{ ApiKey: [] }],
  })

  app.openAPIRegistry.registerComponent('securitySchemes', 'ApiKey', {
    type: 'apiKey',
    in: 'header',
    name: 'X-Api-Key',
  })

  app.get(
    '/api/docs',
    Scalar({ url: '/api/openapi.json', pageTitle: 'NextPress API', withDefaultFonts: false })
  )

  return app
}
