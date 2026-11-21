import { z } from 'zod'
import { apiError } from '@/lib/api-error'
import { withApiErrors } from '@/lib/api-errors'
import { requireRole } from '@/lib/auth'
import { db } from '@/lib/db'
import { PageRepository } from '@/server'

type Params = { params: Promise<{ id: string; revisionId: string }> }

async function postHandler(request: Request, { params }: Params) {
  const session = await requireRole(request, 'editor')
  if (session instanceof Response) return session
  const { id, revisionId } = await params
  const page = await new PageRepository(db).restoreRevision(
    z.string().uuid().parse(id),
    z.string().uuid().parse(revisionId)
  )
  return page ? Response.json(page) : apiError('Not found', 404)
}

export const POST = withApiErrors(postHandler)
