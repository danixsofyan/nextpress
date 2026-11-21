import { eq, or } from 'drizzle-orm'
import { user } from '@/core/schema'
import { db } from './db'
import { emailEnabled, emailLayout, sendEmail } from './email'
import { env } from './env'
import { getSiteSettings } from './site'

export async function notifyNewComment(input: {
  authorName: string
  content: string
  status: 'pending' | 'approved'
  post: { title: string; slug: string; authorId: string | null }
}) {
  if (!emailEnabled()) return
  const site = await getSiteSettings()
  if (!site.commentNotify) return
  const recipients = await db
    .select({ email: user.email })
    .from(user)
    .where(
      input.post.authorId
        ? or(eq(user.role, 'administrator'), eq(user.id, input.post.authorId))
        : eq(user.role, 'administrator')
    )
  const to = [...new Set(recipients.map((r) => r.email))]
  if (to.length === 0) return
  const pending = input.status === 'pending'
  const { html, text } = emailLayout(
    [
      `${input.authorName} commented on "${input.post.title}":`,
      input.content.length > 600 ? `${input.content.slice(0, 600)}…` : input.content,
      pending ? 'The comment is waiting for your approval.' : 'The comment is published.',
    ],
    pending
      ? {
          label: 'Moderate comments',
          url: `${env.ADMIN_URL ?? env.NEXT_PUBLIC_SITE_URL}/admin/comments`,
        }
      : {
          label: 'View the comment',
          url: `${env.NEXT_PUBLIC_SITE_URL}/blog/${input.post.slug}#comments`,
        }
  )
  await sendEmail({
    to,
    subject: `${pending ? 'Please moderate' : 'New comment'}: "${input.post.title}"`,
    html,
    text,
  })
}
