import { sql } from 'drizzle-orm'
import { check, index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import type { Block } from '../validators/blocks'
import { user } from './auth'

export const PAGE_STATUSES = ['draft', 'published'] as const

export const pages = pgTable(
  'pages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    content: text('content').notNull().default(''),
    blocks: jsonb('blocks').$type<Block[]>(),
    status: text('status', { enum: PAGE_STATUSES }).notNull().default('draft'),
    metaTitle: text('meta_title'),
    metaDescription: text('meta_description'),
    authorId: text('author_id').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_pages_author_id').on(table.authorId),
    index('idx_pages_deleted_at').on(table.deletedAt),
    check('chk_pages_status', sql`${table.status} in ('draft', 'published')`),
  ]
)

export type Page = typeof pages.$inferSelect
export type NewPage = typeof pages.$inferInsert
