import { errorBody } from '@/lib/api-error'
import { createHash } from 'node:crypto'
import type { Context, Next } from 'hono'
import Redis from 'ioredis'
import { env } from '@/lib/env'

export const redis = env.REDIS_URL ? new Redis(env.REDIS_URL, { maxRetriesPerRequest: 2 }) : null

const memory = new Map<string, number>()

async function hit(key: string, windowMs: number) {
  if (redis) {
    const result = await redis.multi().incr(key).pexpire(key, windowMs, 'NX').exec()
    return Number(result?.[0]?.[1] ?? 0)
  }
  if (memory.size > 10_000) memory.clear()
  const count = (memory.get(key) ?? 0) + 1
  memory.set(key, count)
  return count
}

export function rateLimit(limit: number, windowMs: number) {
  return async (c: Context, next: Next) => {
    const client = c.req.header('X-Api-Key') ?? c.req.header('x-forwarded-for') ?? 'unknown'
    const id = createHash('sha256').update(client).digest('hex').slice(0, 32)
    const window = Math.floor(Date.now() / windowMs)
    const count = await hit(`rl:${id}:${window}`, windowMs)
    const headers = {
      'X-RateLimit-Limit': String(limit),
      'X-RateLimit-Remaining': String(Math.max(0, limit - count)),
      'X-RateLimit-Reset': String(Math.ceil(((window + 1) * windowMs) / 1000)),
    }
    if (count > limit) {
      return c.json(errorBody('Too many requests', 429), 429, {
        ...headers,
        'Retry-After': String(Math.ceil(((window + 1) * windowMs - Date.now()) / 1000)),
      })
    }
    await next()
    for (const [name, value] of Object.entries(headers)) c.header(name, value)
  }
}
