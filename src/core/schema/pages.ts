import { jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import type { Block } from '../validators/blocks'

export const pageStatusEnum = pgEnum('page_status', ['draft', 'published'])

export const pages = pgTable('pages', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  content: text('content').notNull().default(''),
  blocks: jsonb('blocks').$type<Block[]>(),
  status: pageStatusEnum('status').notNull().default('draft'),
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Page = typeof pages.$inferSelect
export type NewPage = typeof pages.$inferInsert
