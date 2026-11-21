import { sql } from 'drizzle-orm'
import { check, index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const DONATION_STATUSES = ['pending', 'completed', 'failed', 'expired'] as const

export const donations = pgTable(
  'donations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: text('order_id').notNull().unique(),
    amount: integer('amount').notNull(),
    status: text('status', { enum: DONATION_STATUSES }).notNull().default('pending'),
    paymentUrl: text('payment_url'),
    requestId: text('request_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_donations_created_at').on(table.createdAt),
    check('chk_donations_amount', sql`${table.amount} > 0`),
    check(
      'chk_donations_status',
      sql`${table.status} in ('pending', 'completed', 'failed', 'expired')`
    ),
  ]
)

export type Donation = typeof donations.$inferSelect
