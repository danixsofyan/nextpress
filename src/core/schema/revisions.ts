import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import type { Block } from '../validators/blocks'
import { pages } from './pages'
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

export const pageRevisions = pgTable(
  'page_revisions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    pageId: uuid('page_id')
      .notNull()
      .references(() => pages.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    content: text('content').notNull(),
    blocks: jsonb('blocks').$type<Block[]>(),
    authorId: text('author_id'),
    authorName: text('author_name'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('idx_page_revisions_page_created').on(table.pageId, table.createdAt)]
)

export type PageRevision = typeof pageRevisions.$inferSelect
