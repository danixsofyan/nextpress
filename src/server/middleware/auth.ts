import { errorBody } from '@/lib/api-error'
import { createHash, timingSafeEqual } from 'node:crypto'
import type { Database } from '@/core/db'
import type { Context, Next } from 'hono'
import { env } from '@/lib/env'
import { beginRequestContext, setActor } from '@/lib/request-context'
import { ApiKeyRepository } from '../repositories/api-key.repository'

const digest = (value: string) => createHash('sha256').update(value).digest()

export async function isValidApiKey(
  db: Database,
  key: string | null | undefined,
  requestId: string | null = null
) {
  beginRequestContext()
  if (!key) return false
  const envKey = env.NEXTPRESS_API_KEY
  if (envKey && timingSafeEqual(digest(key), digest(envKey))) {
    setActor({ actorType: 'api_key', actorId: 'env', userId: null, requestId })
    return true
  }
  const row = await new ApiKeyRepository(db).verify(key)
  if (!row) return false
  setActor({ actorType: 'api_key', actorId: row.id, userId: row.userId, requestId })
  return true
}

export function apiKeyAuth(db: Database) {
  return async (c: Context, next: Next) => {
    if (
      !(await isValidApiKey(db, c.req.header('X-Api-Key'), c.req.header('x-request-id') ?? null))
    ) {
      return c.json(errorBody('Invalid or missing X-Api-Key header', 401), 401)
    }
    await next()
  }
}
