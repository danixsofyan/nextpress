import { z } from 'zod'
import { commentStatusSchema } from '@/core/validators'
import { apiError } from '@/lib/api-error'
import { withApiErrors } from '@/lib/api-errors'
import { requireRole } from '@/lib/auth'
import { db } from '@/lib/db'
import { CommentRepository } from '@/server'

type Params = { params: Promise<{ id: string }> }

const idSchema = z.string().uuid()

async function patchHandler(request: Request, { params }: Params) {
  const session = await requireRole(request, 'editor')
  if (session instanceof Response) return session
  const id = idSchema.parse((await params).id)
  const { status } = z.object({ status: commentStatusSchema }).parse(await request.json())
  const comment = await new CommentRepository(db).setStatus(id, status)
  if (!comment) return apiError('Not found', 404)
  return Response.json(comment)
}

async function deleteHandler(request: Request, { params }: Params) {
  const session = await requireRole(request, 'editor')
  if (session instanceof Response) return session
  const id = idSchema.parse((await params).id)
  if (!(await new CommentRepository(db).delete(id))) {
    return apiError('Only spam or trashed comments can be deleted permanently', 409)
  }
  return new Response(null, { status: 204 })
}

export const PATCH = withApiErrors(patchHandler)
export const DELETE = withApiErrors(deleteHandler)
