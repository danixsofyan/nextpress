import { getTableConfig, PgTable } from 'drizzle-orm/pg-core'
import { is, sql } from 'drizzle-orm'
import * as schema from '@/core/schema'
import { redis } from '@/server'
import { db } from './db'
import { env } from './env'
import { getPluginStates } from './plugins'
import { getSiteSettings } from './site'

export type HealthStatus = 'good' | 'recommended' | 'critical'

export type HealthCheck = {
  id: string
  label: string
  status: HealthStatus
  description: string
}

const tables = (Object.values(schema) as unknown[]).filter((value): value is PgTable =>
  is(value, PgTable)
)

async function databaseChecks(): Promise<HealthCheck[]> {
  const started = performance.now()
  try {
    await db.execute(sql`select 1`)
  } catch {
    return [
      {
        id: 'database',
        label: 'Database connection',
        status: 'critical',
        description: 'The database did not answer. Check DATABASE_URL and the database status.',
      },
    ]
  }
  const latency = Math.round(performance.now() - started)
  const rows = await db.execute<{ table_name: string; column_name: string }>(
    sql`select table_name, column_name from information_schema.columns where table_schema = 'public'`
  )
  const present = new Set(rows.map((r) => `${r.table_name}.${r.column_name}`))
  const missing = tables.flatMap((table) => {
    const config = getTableConfig(table)
    return config.columns
      .filter((column) => !present.has(`${config.name}.${column.name}`))
      .map((column) => `${config.name}.${column.name}`)
  })
  return [
    {
      id: 'database',
      label: 'Database connection',
      status: latency > 300 ? 'recommended' : 'good',
      description:
        latency > 300
          ? `The database answered in ${latency} ms. Host the app in the same region as the database.`
          : `The database answered in ${latency} ms.`,
    },
    {
      id: 'migrations',
      label: 'Database schema',
      status: missing.length > 0 ? 'critical' : 'good',
      description:
        missing.length > 0
          ? `Missing columns: ${missing.slice(0, 6).join(', ')}${missing.length > 6 ? '…' : ''}. Run pnpm db:migrate as the database owner, then pnpm db:roles.`
          : `All ${tables.length} tables match the code.`,
    },
  ]
}

async function cacheCheck(): Promise<HealthCheck> {
  if (!redis) {
    return {
      id: 'redis',
      label: 'Shared rate limits',
      status: 'recommended',
      description:
        'REDIS_URL is not set, so rate limits are kept per server instance and can be exceeded across instances.',
    }
  }
  try {
    await redis.ping()
    return {
      id: 'redis',
      label: 'Shared rate limits',
      status: 'good',
      description: 'Redis answers.',
    }
  } catch {
    return {
      id: 'redis',
      label: 'Shared rate limits',
      status: 'critical',
      description: 'REDIS_URL is set but Redis does not answer.',
    }
  }
}

export async function runSiteHealth(): Promise<HealthCheck[]> {
  const [database, cache, site, plugins] = await Promise.all([
    databaseChecks(),
    cacheCheck(),
    getSiteSettings(),
    getPluginStates(),
  ])
  const captchaActive = plugins.some((p) => p.active && p.plugin.captcha)
  const blockedPlugins = plugins.filter((p) => p.missingEnv.length > 0 && !p.active)
  const onVercel = Boolean(env.VERCEL_GIT_COMMIT_SHA)

  const checks: HealthCheck[] = [
    ...database,
    cache,
    {
      id: 'storage',
      label: 'Media storage',
      status: env.STORAGE_DRIVER === 's3' ? 'good' : onVercel ? 'critical' : 'recommended',
      description:
        env.STORAGE_DRIVER === 's3'
          ? 'Uploads go to S3-compatible object storage.'
          : 'Uploads are saved to the local disk, which serverless hosts erase. Set STORAGE_DRIVER=s3.',
    },
    {
      id: 'https',
      label: 'Site address',
      status: env.NEXT_PUBLIC_SITE_URL.startsWith('https://') ? 'good' : 'recommended',
      description: env.NEXT_PUBLIC_SITE_URL.startsWith('https://')
        ? `${env.NEXT_PUBLIC_SITE_URL} uses HTTPS.`
        : `${env.NEXT_PUBLIC_SITE_URL} does not use HTTPS. Use an https:// address in production.`,
    },
    {
      id: 'search-engines',
      label: 'Search engine visibility',
      status: site.discourageSearch ? 'recommended' : 'good',
      description: site.discourageSearch
        ? 'Search engines are asked not to index this site (Settings → Reading).'
        : 'Search engines may index this site.',
    },
    {
      id: 'comment-spam',
      label: 'Comment spam protection',
      status: site.commentsEnabled && !captchaActive ? 'recommended' : 'good',
      description:
        site.commentsEnabled && !captchaActive
          ? 'Comments are open without a captcha. Activate Cloudflare Turnstile or Google reCAPTCHA.'
          : site.commentsEnabled
            ? 'Comments are protected by a captcha.'
            : 'Comments are closed.',
    },
    ...blockedPlugins.map((p): HealthCheck => ({
      id: `plugin-${p.plugin.id}`,
      label: `${p.plugin.name} plugin`,
      status: 'recommended',
      description: `Set ${p.missingEnv.join(', ')} to be able to activate it.`,
    })),
    {
      id: 'version',
      label: 'Running version',
      status: 'good',
      description: `Commit ${env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local'} on Node.js ${process.versions.node}.`,
    },
  ]
  const order: Record<HealthStatus, number> = { critical: 0, recommended: 1, good: 2 }
  return checks.sort((a, b) => order[a.status] - order[b.status])
}
