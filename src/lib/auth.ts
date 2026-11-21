import { beginRequestContext, isInvite, setActor } from './request-context'
import { apiError } from '@/lib/api-error'
import { redis } from '@/server'
import { account, session, user, verification } from '@/core/schema'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { APIError, createAuthMiddleware } from 'better-auth/api'
import { admin } from 'better-auth/plugins'
import { createAccessControl } from 'better-auth/plugins/access'
import { defaultStatements } from 'better-auth/plugins/admin/access'
import { headers } from 'next/headers'
import { and, eq } from 'drizzle-orm'
import { db } from './db'
import { env } from './env'
import { clientIp, verifyCaptcha } from './captcha'
import { emailLayout, sendEmail } from './email'
import { getSiteSettings } from './site'
import { isPluginActive } from './plugins'
import { logger } from './logger'
import { hashPassword, isArgon2id, verifyPassword } from './password'
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

const CAPTCHA_PATHS = new Set(['/sign-in/email', '/sign-up/email', '/request-password-reset'])

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: { user, session, account, verification },
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.ADMIN_URL ?? env.NEXT_PUBLIC_SITE_URL,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    resetPasswordTokenExpiresIn: 60 * 60,
    sendResetPassword: async ({ user, url }) => {
      if (isInvite()) {
        const site = await getSiteSettings()
        const invite = emailLayout(
          [
            `Hi ${user.name},`,
            `An account was created for you on ${site.title}. Choose your password with the button below to sign in. The link works for one hour; after that, use "Lost your password?" on the sign-in page.`,
          ],
          { label: 'Choose your password', url }
        )
        await sendEmail({ to: user.email, subject: `Your account on ${site.title}`, ...invite })
        return
      }
      const { html, text } = emailLayout(
        [
          `Hi ${user.name},`,
          'Someone asked to reset the password of your NextPress account. If it was you, choose a new password with the button below. The link works for one hour.',
          'If you did not ask for this, ignore this email; your password stays the same.',
        ],
        { label: 'Choose a new password', url }
      )
      await sendEmail({ to: user.email, subject: 'Reset your password', html, text })
    },
    password: { hash: hashPassword, verify: verifyPassword },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === '/sign-in/social' || ctx.path.startsWith('/callback/')) {
        if (!(await isPluginActive('google-login'))) {
          throw new APIError('FORBIDDEN', { message: 'Google sign-in is turned off' })
        }
        return
      }
      if (!CAPTCHA_PATHS.has(ctx.path) || isInvite()) return
      const headers = ctx.headers ?? new Headers()
      if (!(await verifyCaptcha(headers.get('x-captcha-token'), clientIp(headers)))) {
        throw new APIError('FORBIDDEN', { message: 'The security check failed' })
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== '/sign-in/email') return
      const userId = ctx.context.newSession?.user.id
      const password = (ctx.body as { password?: unknown } | undefined)?.password
      if (userId && typeof password === 'string') await upgradeLegacyHash(userId, password)
    }),
  },
  ...(env.GOOGLE_CLIENT_ID &&
    env.GOOGLE_CLIENT_SECRET && {
      socialProviders: {
        google: {
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
          disableSignUp: true,
          disableImplicitSignUp: true,
        },
      },
    }),
  account: { accountLinking: { enabled: true, trustedProviders: ['google'] } },
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

async function upgradeLegacyHash(userId: string, password: string) {
  const credential = and(eq(account.userId, userId), eq(account.providerId, 'credential'))
  const [row] = await db.select({ password: account.password }).from(account).where(credential)
  if (!row?.password || isArgon2id(row.password)) return
  try {
    await db
      .update(account)
      .set({ password: await hashPassword(password), updatedAt: new Date() })
      .where(credential)
  } catch (err) {
    logger.error('password rehash failed', { userId, err })
  }
}

export type Session = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>

export async function requireRole(request: Request, min: Role): Promise<Session | Response> {
  beginRequestContext()
  const current = await auth.api.getSession({ headers: request.headers })
  if (!current) return apiError('Unauthorized', 401)
  if (current.user.banned || !hasRole(current.user.role, min)) {
    return apiError('You do not have permission to do that', 403)
  }
  setActor({
    actorType: 'user',
    actorId: current.user.id,
    userId: current.user.id,
    requestId: request.headers.get('x-request-id'),
  })
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
