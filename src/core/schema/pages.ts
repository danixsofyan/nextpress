import { index, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import type { Block } from '../validators/blocks'
import { user } from './auth'

export const pageStatusEnum = pgEnum('page_status', ['draft', 'published'])

export const pages = pgTable(
  'pages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    content: text('content').notNull().default(''),
    blocks: jsonb('blocks').$type<Block[]>(),
    status: pageStatusEnum('status').notNull().default('draft'),
    metaTitle: text('meta_title'),
    metaDescription: text('meta_description'),
    authorId: text('author_id').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('idx_pages_author_id').on(table.authorId)]
)

export type Page = typeof pages.$inferSelect
export type NewPage = typeof pages.$inferInsert
