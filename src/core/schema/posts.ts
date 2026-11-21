import { user } from './auth'
import { sql } from 'drizzle-orm'
import { boolean, check, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const POST_STATUSES = ['draft', 'published'] as const
export const POST_VISIBILITIES = ['public', 'private'] as const
export const POST_FORMATS = ['standard', 'gallery', 'video', 'audio'] as const

export const posts = pgTable(
  'posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    excerpt: text('excerpt'),
    content: text('content').notNull().default(''),
    coverImage: text('cover_image'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    status: text('status', { enum: POST_STATUSES }).notNull().default('draft'),
    visibility: text('visibility', { enum: POST_VISIBILITIES }).notNull().default('public'),
    format: text('format', { enum: POST_FORMATS }).notNull().default('standard'),
    isSticky: boolean('is_sticky').notNull().default(false),
    metaTitle: text('meta_title'),
    metaDescription: text('meta_description'),
    authorId: text('author_id').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_posts_author_id').on(table.authorId),
    index('idx_posts_deleted_at').on(table.deletedAt),
    index('idx_posts_status_published_at').on(table.status, table.publishedAt),
    check('chk_posts_status', sql`${table.status} in ('draft', 'published')`),
    check('chk_posts_visibility', sql`${table.visibility} in ('public', 'private')`),
    check('chk_posts_format', sql`${table.format} in ('standard', 'gallery', 'video', 'audio')`),
  ]
)

export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert
