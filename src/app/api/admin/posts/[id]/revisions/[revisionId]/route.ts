import { z } from 'zod'
import { apiError } from '@/lib/api-error'
import { withApiErrors } from '@/lib/api-errors'
import { requireRole } from '@/lib/auth'
import { db } from '@/lib/db'
import { loadOwnedPost } from '@/lib/post-access'
import { PostRepository } from '@/server'

type Params = { params: Promise<{ id: string; revisionId: string }> }

async function getHandler(request: Request, { params }: Params) {
  const session = await requireRole(request, 'author')
  if (session instanceof Response) return session
  const { id, revisionId } = await params
  const owned = await loadOwnedPost(session, id)
  if (owned instanceof Response) return owned
  const revision = await new PostRepository(db).findRevision(
    id,
    z.string().uuid().parse(revisionId)
  )
  return revision ? Response.json(revision) : apiError('Not found', 404)
}

async function postHandler(request: Request, { params }: Params) {
  const session = await requireRole(request, 'author')
  if (session instanceof Response) return session
  const { id, revisionId } = await params
  const owned = await loadOwnedPost(session, id)
  if (owned instanceof Response) return owned
  const post = await new PostRepository(db).restoreRevision(id, z.string().uuid().parse(revisionId))
  return post ? Response.json(post) : apiError('Not found', 404)
}

export const GET = withApiErrors(getHandler)
export const POST = withApiErrors(postHandler)
