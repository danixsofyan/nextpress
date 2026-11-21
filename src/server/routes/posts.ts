import { errorBody } from '@/lib/api-error'
import { createRoute, z } from '@hono/zod-openapi'
import type { Database } from '@/core/db'
import { createPostSchema, updatePostSchema, listPostsSchema } from '@/core/validators'
import { PostRepository } from '../repositories/post.repository'
import { apiKeyAuth } from '../middleware/auth'
import { rateLimit } from '../middleware/rate-limit'
import { conflict, idParams, createRouter } from './shared'

const postResponseSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  excerpt: z.string().nullable(),
  content: z.string(),
  coverImage: z.string().nullable(),
  status: z.enum(['draft', 'published']),
  metaTitle: z.string().nullable(),
  metaDescription: z.string().nullable(),
  publishedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export function postsRouter(db: Database) {
  const app = createRouter()
  const repo = new PostRepository(db)
  const auth = apiKeyAuth(db)
  const limit = rateLimit(60, 60_000)

  app.use('/api/posts/*', auth, limit)
  app.use('/api/posts', auth, limit)

  app.openapi(
    createRoute({
      method: 'get',
      path: '/api/posts',
      tags: ['Posts'],
      request: { query: listPostsSchema },
      responses: {
        200: {
          content: { 'application/json': { schema: z.array(postResponseSchema) } },
          description: 'List posts',
        },
      },
    }),
    async (c) => {
      const query = c.req.valid('query')
      const result = await repo.findMany(query)
      return c.json(result)
    }
  )

  app.openapi(
    createRoute({
      method: 'post',
      path: '/api/posts',
      tags: ['Posts'],
      request: { body: { content: { 'application/json': { schema: createPostSchema } } } },
      responses: {
        409: conflict,
        201: {
          content: { 'application/json': { schema: postResponseSchema } },
          description: 'Created post',
        },
      },
    }),
    async (c) => {
      const body = c.req.valid('json')
      const post = await repo.create(body)
      return c.json(post, 201)
    }
  )

  app.openapi(
    createRoute({
      method: 'get',
      path: '/api/posts/:id',
      tags: ['Posts'],
      request: { params: idParams },
      responses: {
        200: {
          content: { 'application/json': { schema: postResponseSchema } },
          description: 'Post',
        },
        404: {
          content: { 'application/json': { schema: z.object({ error: z.string() }) } },
          description: 'Not found',
        },
      },
    }),
    async (c) => {
      const { id } = c.req.valid('param')
      const post = await repo.findById(id)
      if (!post) return c.json(errorBody('Not found', 404), 404)
      return c.json(post as unknown as z.infer<typeof postResponseSchema>, 200)
    }
  )

  app.openapi(
    createRoute({
      method: 'put',
      path: '/api/posts/:id',
      tags: ['Posts'],
      request: {
        params: idParams,
        body: { content: { 'application/json': { schema: updatePostSchema } } },
      },
      responses: {
        409: conflict,
        200: {
          content: { 'application/json': { schema: postResponseSchema } },
          description: 'Updated post',
        },
        404: {
          content: { 'application/json': { schema: z.object({ error: z.string() }) } },
          description: 'Not found',
        },
      },
    }),
    async (c) => {
      const { id } = c.req.valid('param')
      const body = c.req.valid('json')
      const post = await repo.update(id, body)
      if (!post) return c.json(errorBody('Not found', 404), 404)
      return c.json(post as unknown as z.infer<typeof postResponseSchema>, 200)
    }
  )

  app.openapi(
    createRoute({
      method: 'delete',
      path: '/api/posts/:id',
      tags: ['Posts'],
      request: { params: idParams },
      responses: {
        204: { description: 'Deleted' },
        404: {
          content: { 'application/json': { schema: z.object({ error: z.string() }) } },
          description: 'Not found',
        },
      },
    }),
    async (c) => {
      const { id } = c.req.valid('param')
      const existing = await repo.findById(id)
      if (!existing) return c.json(errorBody('Not found', 404), 404)
      await repo.delete(id)
      return new Response(null, { status: 204 })
    }
  )

  return app
}
