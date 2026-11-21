import { apiError } from '@/lib/api-error'
import { redis } from '@/server'
import { account, session, user, verification } from '@/core/schema'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { APIError } from 'better-auth/api'
import { admin } from 'better-auth/plugins'
import { createAccessControl } from 'better-auth/plugins/access'
import { defaultStatements } from 'better-auth/plugins/admin/access'
import { headers } from 'next/headers'
import { db } from './db'
import { env } from './env'
import { hasRole, type Role } from './roles'

export async function hasUsers() {
  const rows = await db.select({ id: user.id }).from(user).limit(1)
  return rows.length > 0
}

const ac = createAccessControl(defaultStatements)
const contentRole = ac.newRole({ user: [], session: [] })
const roles = {
  administrator: ac.newRole({
    user: ['create', 'list', 'set-role', 'delete', 'set-password', 'set-email', 'get', 'update'],
    session: ['list', 'revoke', 'delete'],
  }),
  editor: contentRole,
  author: contentRole,
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: { user, session, account, verification },
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.ADMIN_URL ?? env.NEXT_PUBLIC_SITE_URL,
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  plugins: [admin({ ac, roles, defaultRole: 'author', adminRoles: ['administrator'] })],
  databaseHooks: {
    user: {
      create: {
        before: async (newUser, ctx) => {
          if (ctx?.path !== '/sign-up/email') return
          if (await hasUsers()) {
            throw new APIError('FORBIDDEN', { message: 'Sign-up is closed' })
          }
          return { data: { ...newUser, role: 'administrator' } }
        },
      },
    },
  },
  advanced: {
    defaultCookieAttributes: { httpOnly: true, sameSite: 'strict' },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 20,
    customRules: {
      '/sign-in/email': { window: 900, max: 5 },
      '/sign-up/email': { window: 900, max: 3 },
      '/request-password-reset': { window: 900, max: 3 },
    },
    ...(redis ? { customStorage: redisRateLimitStorage(redis) } : { storage: 'memory' as const }),
  },
})

export type Session = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>

export async function requireRole(request: Request, min: Role): Promise<Session | Response> {
  const current = await auth.api.getSession({ headers: request.headers })
  if (!current) return apiError('Unauthorized', 401)
  if (current.user.banned || !hasRole(current.user.role, min)) {
    return apiError('You do not have permission to do that', 403)
  }
  return current
}

function redisRateLimitStorage(client: NonNullable<typeof redis>) {
  return {
    consume: async (key: string, rule: { window: number; max: number }) => {
      const redisKey = `auth-rl:${key}`
      const result = await client
        .multi()
        .incr(redisKey)
        .expire(redisKey, rule.window, 'NX')
        .ttl(redisKey)
        .exec()
      const count = Number(result?.[0]?.[1] ?? 0)
      const ttl = Number(result?.[2]?.[1] ?? rule.window)
      return count <= rule.max
        ? { allowed: true, retryAfter: null }
        : { allowed: false, retryAfter: Math.max(ttl, 1) }
    },
  }
}

export async function getCurrentSession() {
  return auth.api.getSession({ headers: await headers() })
}
