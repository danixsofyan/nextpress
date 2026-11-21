import { SettingsRepository } from '@/server'
import { isValidTimeZone } from '@/themes/engine'
import { cache } from 'react'
import { customCssSchema } from '@/core/validators'
import { db } from './db'
import { env } from './env'

const count = (value: string | undefined, fallback: number) => {
  const n = Number.parseInt(value ?? '', 10)
  return Number.isFinite(n) && n > 0 ? Math.min(n, 100) : fallback
}

export const getSiteSettings = cache(async () => {
  const s = await new SettingsRepository(db).getAll()
  return {
    title: s.site_title || env.NEXT_PUBLIC_SITE_NAME,
    tagline: s.site_tagline || '',
    description: s.default_meta_description || s.site_tagline || '',
    logo: s.site_logo || '',
    icon: s.site_icon || '/favicon.svg',
    ogImage: s.og_image || '',
    timeZone: s.timezone && isValidTimeZone(s.timezone) ? s.timezone : 'UTC',
    dateFormat: s.date_format || 'F j, Y',
    timeFormat: s.time_format || 'g:i a',
    showOnFront: s.show_on_front === 'page' && s.page_on_front ? 'page' : 'posts',
    pageOnFront: s.page_on_front || '',
    postsPerPage: count(s.posts_per_page, 10),
    feedCount: count(s.posts_per_rss, 10),
    feedFullText: s.rss_use_excerpt !== '1',
    discourageSearch: s.blog_public === '0',
    privacyPage: s.privacy_policy_page || '',
    robotsTxt: s.robots_txt || '',
    customCss: customCssSchema.safeParse(s.custom_css ?? '').success ? (s.custom_css ?? '') : '',
    commentsEnabled: s.comments_enabled !== '0',
    commentModeration: s.comment_moderation !== '0',
  }
})
