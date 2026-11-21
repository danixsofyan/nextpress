import { sql } from 'drizzle-orm'
import { check, index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id'),
    actorType: text('actor_type', { enum: ['user', 'api_key', 'system'] }).notNull(),
    actorId: text('actor_id'),
    userId: text('user_id'),
    requestId: text('request_id'),
    before: jsonb('before'),
    after: jsonb('after'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_audit_logs_entity').on(table.entityType, table.entityId),
    index('idx_audit_logs_created_at').on(table.createdAt),
    index('idx_audit_logs_user_id').on(table.userId),
    check('chk_audit_logs_actor_type', sql`${table.actorType} in ('user', 'api_key', 'system')`),
  ]
)

export type AuditLog = typeof auditLogs.$inferSelect
