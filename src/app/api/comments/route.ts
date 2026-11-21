import { NextResponse } from 'next/server'
import { createCommentSchema } from '@/core/validators'
import { clientIp, verifyCaptcha } from '@/lib/captcha'
import { db } from '@/lib/db'
import { env } from '@/lib/env'
import { logger, requestIdOf } from '@/lib/logger'
import { getSiteSettings } from '@/lib/site'
import { CommentRepository, PostRepository, redis } from '@/server'

const LIMIT_PER_MINUTE = 3

async function rateLimited(ip: string) {
  if (!redis) return false
  const key = `comment:${ip}:${Math.floor(Date.now() / 60_000)}`
  const count = await redis.incr(key)
  if (count === 1) await redis.expire(key, 60)
  return count > LIMIT_PER_MINUTE
}

const field = (form: FormData, name: string) => {
  const value = form.get(name)
  return typeof value === 'string' ? value : undefined
}

export async function POST(request: Request) {
  const form = await request.formData().catch(() => new FormData())
  const parsed = createCommentSchema.safeParse({
    postId: field(form, 'postId'),
    parentId: field(form, 'parentId') || undefined,
    authorName: field(form, 'authorName') ?? '',
    content: field(form, 'content') ?? '',
  })
  const post = parsed.success ? await new PostRepository(db).findById(parsed.data.postId) : null
  const back = (hash: string) =>
    NextResponse.redirect(
      new URL(post ? `/blog/${post.slug}#${hash}` : '/blog', env.NEXT_PUBLIC_SITE_URL),
      303
    )
  if (!parsed.success || !post || post.status !== 'published') return back('comment-error')
  if (field(form, 'website')) return back('comment-pending')

  const site = await getSiteSettings()
  if (!site.commentsEnabled) return back('comment-error')
  const ip = clientIp(request.headers) ?? 'unknown'
  if (await rateLimited(ip)) return back('comment-error')
  if (!(await verifyCaptcha(field(form, 'captcha'), ip))) return back('comment-error')

  const repo = new CommentRepository(db)
  if (parsed.data.parentId) {
    const parent = await repo.findById(parsed.data.parentId)
    if (!parent || parent.postId !== post.id || parent.status !== 'approved') {
      return back('comment-error')
    }
  }
  const status = site.commentModeration ? 'pending' : 'approved'
  const comment = await repo.create(parsed.data, status)
  logger.info('comment received', { requestId: requestIdOf(request), postId: post.id, status })
  return back(status === 'approved' ? `comment-${comment.id}` : 'comment-pending')
}
