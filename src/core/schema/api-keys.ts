import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { user } from './auth'

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  prefix: text('prefix').notNull(),
  keyHash: text('key_hash').notNull().unique(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
})

export type ApiKey = typeof apiKeys.$inferSelect
