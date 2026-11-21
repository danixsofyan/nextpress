import { errorBody } from '@/lib/api-error'
import { Scalar } from '@scalar/hono-api-reference'
import type { Database } from '@/core/db'
import { sql } from 'drizzle-orm'
import { env } from '@/lib/env'
import { logger } from '@/lib/logger'
import { redis } from './middleware/rate-limit'
import { postsRouter } from './routes/posts'
import { pagesRouter } from './routes/pages'
import { createRouter, uniqueViolation } from './routes/shared'
import { taxonomiesRouter } from './routes/taxonomies'

export function createApp(db: Database) {
  const app = createRouter()

  app.onError((error, c) => {
    if (uniqueViolation(error)) {
      return c.json(errorBody('A record with this slug already exists', 409), 409)
    }
    logger.error('api request failed', {
      requestId: c.req.header('x-request-id'),
      path: c.req.path,
      err: error,
    })
    return c.json(errorBody('Internal server error', 500), 500)
  })

  app.get('/api/health', async (c) => {
    try {
      await db.execute(sql`select 1`)
      if (redis) await redis.ping()
      return c.json({ status: 'ok', commit: env.VERCEL_GIT_COMMIT_SHA ?? null })
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
