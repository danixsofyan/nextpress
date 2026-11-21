import { apiError } from '@/lib/api-error'
import { PostRepository } from '@/server'
import { withApiErrors } from '@/lib/api-errors'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { loadOwnedPost } from '@/lib/post-access'
import { updatePostSchema } from '@/core/validators'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Params) {
  const session = await requireRole(request, 'author')
  if (session instanceof Response) return session
  const owned = await loadOwnedPost(session, (await params).id)
  return owned instanceof Response ? owned : Response.json(owned)
}

async function putHandler(request: Request, { params }: Params) {
  const session = await requireRole(request, 'author')
  if (session instanceof Response) return session
  const { id } = await params
  const owned = await loadOwnedPost(session, id)
  if (owned instanceof Response) return owned
  const input = updatePostSchema.parse(await request.json())
  const post = await new PostRepository(db).update(id, input)
  if (!post) return apiError('Not found', 404)
  return Response.json(post)
}

export async function DELETE(request: Request, { params }: Params) {
  const session = await requireRole(request, 'author')
  if (session instanceof Response) return session
  const { id } = await params
  const permanent = new URL(request.url).searchParams.get('permanent') === '1'
  const owned = await loadOwnedPost(session, id, permanent)
  if (owned instanceof Response) return owned
  const repo = new PostRepository(db)
  const done = permanent ? await repo.purge(id) : await repo.delete(id)
  if (!done) return apiError('Move the post to the Trash first', 409)
  return new Response(null, { status: 204 })
}

export const PUT = withApiErrors(putHandler)
