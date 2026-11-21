import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { comments, donations, posts, user } from '@/core/schema'
import { audit } from '@/server/audit'
import { db } from './db'

export const privacyQuerySchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    email: z.string().trim().email().max(200).optional(),
  })
  .refine((q) => q.name || q.email, { message: 'Enter a name or an email address' })

export type PrivacyQuery = z.infer<typeof privacyQuerySchema>

const lower = (value: string) => sql`lower(${value})`

export async function findPersonalData(query: PrivacyQuery) {
  const account = query.email
    ? ((
        await db
          .select({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
          })
          .from(user)
          .where(sql`lower(${user.email}) = ${lower(query.email)}`)
          .limit(1)
      )[0] ?? null)
    : null
  const name = query.name ?? account?.name
  const [commentRows, donationRows] = name
    ? await Promise.all([
        db
          .select({
            id: comments.id,
            authorName: comments.authorName,
            content: comments.content,
            status: comments.status,
            createdAt: comments.createdAt,
            post: posts.title,
          })
          .from(comments)
          .innerJoin(posts, eq(posts.id, comments.postId))
          .where(sql`lower(${comments.authorName}) = ${lower(name)}`),
        db
          .select({
            orderId: donations.orderId,
            donorName: donations.donorName,
            message: donations.message,
            amount: donations.amount,
            status: donations.status,
            createdAt: donations.createdAt,
          })
          .from(donations)
          .where(sql`lower(${donations.donorName}) = ${lower(name)}`),
      ])
    : [[], []]
  return { account, comments: commentRows, donations: donationRows }
}

export async function erasePersonalData(name: string) {
  const match = sql`lower(${name})`
  const erasedComments = await db
    .update(comments)
    .set({ authorName: 'Anonymous', updatedAt: new Date() })
    .where(sql`lower(${comments.authorName}) = ${match}`)
    .returning({ id: comments.id })
  const erasedDonations = await db
    .update(donations)
    .set({ donorName: null, message: null, updatedAt: new Date() })
    .where(sql`lower(${donations.donorName}) = ${match}`)
    .returning({ id: donations.id })
  await audit(
    db,
    'privacy.erase',
    { type: 'person' },
    { after: { comments: erasedComments.length, donations: erasedDonations.length } }
  )
  return { comments: erasedComments.length, donations: erasedDonations.length }
}
