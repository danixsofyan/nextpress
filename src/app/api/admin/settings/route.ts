import { apiError } from '@/lib/api-error'
import { SettingsRepository } from '@/server'
import { isValidTimeZone } from '@/themes/engine'
import { z } from 'zod'
import { customCssSchema } from '@/core/validators'
import { requireRole } from '@/lib/auth'
import { db } from '@/lib/db'

const imageUrl = z
  .string()
  .max(2000)
  .refine(
    (v) => v === '' || /^https?:\/\//.test(v) || /^\/(?!\/)/.test(v),
    'must be an http(s) URL or a /path'
  )
const id = z.string().max(64)
const count = z.string().regex(/^\d{1,3}$/, 'must be a number')

const settingsSchema = z
  .object({
    site_title: z.string().max(200),
    site_tagline: z.string().max(300),
    site_logo: imageUrl,
    site_icon: imageUrl,
    og_image: imageUrl,
    timezone: z.string().refine((v) => v === '' || isValidTimeZone(v), 'unknown timezone'),
    date_format: z.string().max(50),
    time_format: z.string().max(50),
    show_on_front: z.enum(['posts', 'page']),
    page_on_front: id,
    posts_per_page: count,
    posts_per_rss: count,
    rss_use_excerpt: z.enum(['0', '1']),
    blog_public: z.enum(['0', '1']),
    comments_enabled: z.enum(['0', '1']),
    comment_moderation: z.enum(['0', '1']),
    comment_notify: z.enum(['0', '1']),
    privacy_policy_page: id,
    default_meta_description: z.string().max(160),
    ga_id: z
      .string()
      .refine((v) => v === '' || /^G-[A-Z0-9]+$/.test(v), 'must look like G-XXXXXXXXXX'),
    robots_txt: z.string().max(5000),
    custom_css: customCssSchema,
  })
  .partial()

export async function GET(request: Request) {
  const session = await requireRole(request, 'administrator')
  if (session instanceof Response) return session
  return Response.json(await new SettingsRepository(db).getAll())
}

export async function PUT(request: Request) {
  const session = await requireRole(request, 'administrator')
  if (session instanceof Response) return session
  const parsed = settingsSchema.safeParse(await request.json())
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return apiError(`${issue?.path.join('.') || 'settings'} ${issue?.message ?? 'is invalid'}`, 400)
  }
  const values = Object.fromEntries(
    Object.entries(parsed.data).filter((entry): entry is [string, string] => entry[1] !== undefined)
  )
  const repo = new SettingsRepository(db)
  await repo.setMany(values)
  return Response.json(await repo.getAll())
}
