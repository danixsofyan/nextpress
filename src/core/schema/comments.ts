import { sql } from 'drizzle-orm'
import { type AnyPgColumn, check, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { user } from './auth'
import { posts } from './posts'

export const COMMENT_STATUSES = ['pending', 'approved', 'spam', 'trash'] as const

export const comments = pgTable(
  'comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    parentId: uuid('parent_id').references((): AnyPgColumn => comments.id, {
      onDelete: 'cascade',
    }),
    authorName: text('author_name').notNull(),
    userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
    content: text('content').notNull(),
    status: text('status', { enum: COMMENT_STATUSES }).notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_comments_post_status').on(table.postId, table.status, table.createdAt),
    index('idx_comments_status_created').on(table.status, table.createdAt),
    check('chk_comments_status', sql`${table.status} in ('pending', 'approved', 'spam', 'trash')`),
    check('chk_comments_content_length', sql`char_length(${table.content}) between 1 and 2000`),
  ]
)

export type Comment = typeof comments.$inferSelect
