import { errorBody } from '@/lib/api-error'
import { createHash, timingSafeEqual } from 'node:crypto'
import type { Database } from '@/core/db'
import type { Context, Next } from 'hono'
import { env } from '@/lib/env'
import { ApiKeyRepository } from '../repositories/api-key.repository'

const digest = (value: string) => createHash('sha256').update(value).digest()

export async function isValidApiKey(db: Database, key: string | null | undefined) {
  if (!key) return false
  const envKey = env.NEXTPRESS_API_KEY
  if (envKey && timingSafeEqual(digest(key), digest(envKey))) return true
  return new ApiKeyRepository(db).verify(key)
}

export function apiKeyAuth(db: Database) {
  return async (c: Context, next: Next) => {
    if (!(await isValidApiKey(db, c.req.header('X-Api-Key')))) {
      return c.json(errorBody('Invalid or missing X-Api-Key header', 401), 401)
    }
    await next()
  }
}
