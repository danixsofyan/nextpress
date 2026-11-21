import { OpenAPIHono, z } from '@hono/zod-openapi'
import { errorBody } from '@/lib/api-error'

export const idParams = z.object({ id: z.string().uuid() })

export const errorSchema = z.object({ error: z.string(), code: z.string() })

export const notFound = {
  content: { 'application/json': { schema: errorSchema } },
  description: 'Not found',
}

export const conflict = {
  content: { 'application/json': { schema: errorSchema } },
  description: 'A record with this slug already exists',
}

export function uniqueViolation(error: unknown) {
  const e = error as { code?: string; cause?: { code?: string } }
  return e?.code === '23505' || e?.cause?.code === '23505'
}

export const createRouter = () =>
  new OpenAPIHono({
    defaultHook: (result, c) => {
      if (result.success) return
      const issue = result.error.issues[0]
      const field = issue?.path.join('.')
      return c.json(
        errorBody(`${field ? `${field}: ` : ''}${issue?.message ?? 'Invalid request'}`, 400),
        400
      )
    },
  })
