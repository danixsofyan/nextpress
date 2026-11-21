import { z } from '@hono/zod-openapi'

export const idParams = z.object({ id: z.string().uuid() })

export const errorSchema = z.object({ error: z.string() })

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
