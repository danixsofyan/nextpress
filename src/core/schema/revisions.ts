import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { posts } from './posts'

export const postRevisions = pgTable(
  'post_revisions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    excerpt: text('excerpt'),
    content: text('content').notNull(),
    authorId: text('author_id'),
    authorName: text('author_name'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('idx_post_revisions_post_created').on(table.postId, table.createdAt)]
)

export type PostRevision = typeof postRevisions.$inferSelect
