import type { Database } from '@/core/db'
import { auditLogs } from '@/core/schema'
import { logger } from '@/lib/logger'
import { currentActor } from '@/lib/request-context'

const HEAVY = new Set(['content', 'blocks', 'html', 'keyHash'])

const slim = (row: unknown) =>
  row && typeof row === 'object'
    ? Object.fromEntries(Object.entries(row).filter(([k]) => !HEAVY.has(k)))
    : null

export async function audit(
  db: Database,
  action: string,
  entity: { type: string; id?: string | null | undefined },
  change: { before?: unknown; after?: unknown } = {}
) {
  const actor = currentActor()
  try {
    await db.insert(auditLogs).values({
      action,
      entityType: entity.type,
      entityId: entity.id ?? null,
      actorType: actor.actorType,
      actorId: actor.actorId,
      userId: actor.userId,
      requestId: actor.requestId,
      before: slim(change.before),
      after: slim(change.after),
    })
  } catch (err) {
    logger.error('audit log write failed', { action, entity, requestId: actor.requestId, err })
  }
}
